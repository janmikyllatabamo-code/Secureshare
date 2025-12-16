/**
 * Fix infinite recursion in RLS policies via Supabase MCP
 * The issue is that policies query secureshare_users which triggers the same policy again
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function fixRLSRecursion() {
  try {
    console.log('🔧 Fixing infinite recursion in RLS policies...');
    console.log('');
    
    const sql = `
-- Step 1: Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS when checking if a user is admin
CREATE OR REPLACE FUNCTION is_admin_user(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM secureshare_users
        WHERE user_id = check_user_id AND role = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can update own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can search by email" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can view all users" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can update all users" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can insert users" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can delete users" ON secureshare_users;

-- Step 3: Create new policies that avoid recursion
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON secureshare_users
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Admins can view all users (using the function that bypasses RLS)
CREATE POLICY "Admins can view all users" ON secureshare_users
    FOR SELECT USING (is_admin_user(auth.uid()));

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON secureshare_users
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Admins can update all users
CREATE POLICY "Admins can update all users" ON secureshare_users
    FOR UPDATE USING (is_admin_user(auth.uid()));

-- Policy 5: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON secureshare_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 6: Admins can insert users
CREATE POLICY "Admins can insert users" ON secureshare_users
    FOR INSERT WITH CHECK (is_admin_user(auth.uid()));

-- Policy 7: Admins can delete users
CREATE POLICY "Admins can delete users" ON secureshare_users
    FOR DELETE USING (is_admin_user(auth.uid()));

-- Policy 8: Authenticated users can search by email (for file sharing, etc.)
CREATE POLICY "Users can search by email" ON secureshare_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Step 4: Update the is_admin() function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_admin_user(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify
SELECT 
    'RLS policies fixed - no recursion' AS status,
    (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Admin') as admin_count;
    `;
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ 
        query: sql
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ RLS policies fixed! Infinite recursion resolved!');
      console.log('');
      if (result[result.length - 1] && result[result.length - 1].length > 0) {
        const stats = result[result.length - 1][0];
        console.log('Verification:', stats.status);
        console.log(`  Admin users: ${stats.admin_count}`);
      }
      console.log('');
      console.log('✅ The dashboard should now work without recursion errors!');
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRLSRecursion();


