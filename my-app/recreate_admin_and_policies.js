/**
 * Recreate admin user and RLS policies via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';
const ADMIN_USER_ID = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
const ADMIN_EMAIL = 'janmikyllatabamo4165@gmail.com';

async function recreateAdminAndPolicies() {
  try {
    console.log('🔧 Recreating admin user and RLS policies...');
    console.log('');
    
    const sql = `
-- Step 1: Ensure table exists and has correct constraint
ALTER TABLE secureshare_users DROP CONSTRAINT IF EXISTS secureshare_users_role_check;
ALTER TABLE secureshare_users ADD CONSTRAINT secureshare_users_role_check 
    CHECK (role IN ('Student', 'Teacher', 'Admin'));

-- Step 2: Create/Update admin user profile
INSERT INTO secureshare_users (user_id, email, full_name, role)
VALUES ('${ADMIN_USER_ID}', '${ADMIN_EMAIL}', 'Admin User', 'Admin')
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can update own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can search by email" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can view all users" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can update all users" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can insert users" ON secureshare_users;
DROP POLICY IF EXISTS "Admins can delete users" ON secureshare_users;

-- Step 4: Create RLS policies
-- Users can view own profile OR admins can view all
CREATE POLICY "Users can view own profile" ON secureshare_users
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM secureshare_users
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

CREATE POLICY "Users can update own profile" ON secureshare_users
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON secureshare_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can search by email" ON secureshare_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies
CREATE POLICY "Admins can view all users" ON secureshare_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM secureshare_users
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

CREATE POLICY "Admins can update all users" ON secureshare_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM secureshare_users
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

CREATE POLICY "Admins can insert users" ON secureshare_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM secureshare_users
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

CREATE POLICY "Admins can delete users" ON secureshare_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM secureshare_users
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

-- Step 5: Verify
SELECT 
    'Setup complete' AS status,
    (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Admin') as admin_count,
    (SELECT COUNT(*) FROM secureshare_users) as total_users;
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
      console.log('✅ Admin user and RLS policies recreated!');
      console.log('');
      if (result[result.length - 1] && result[result.length - 1].length > 0) {
        const stats = result[result.length - 1][0];
        console.log('Verification:');
        console.log(`  Admin users: ${stats.admin_count}`);
        console.log(`  Total users: ${stats.total_users}`);
      }
      console.log('');
      console.log('✅ Dashboard statistics should now work correctly!');
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

recreateAdminAndPolicies();


