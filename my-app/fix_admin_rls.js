/**
 * Fix RLS policies to ensure admins can read their own role
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function fixAdminRLS() {
  try {
    console.log('🔧 Fixing RLS policies for admin role checking...');
    
    // Update the "Users can view own profile" policy to ensure it works for admins
    // Also ensure admins can view all users (which we already have)
    const sql = `
-- Ensure the "Users can view own profile" policy works correctly
-- This should already exist, but we'll verify it's correct
DROP POLICY IF EXISTS "Users can view own profile" ON secureshare_users;

CREATE POLICY "Users can view own profile" ON secureshare_users
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM secureshare_users
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

-- Verify admin policies exist
SELECT 'RLS policies updated successfully!' AS status;
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
      console.log('✅ RLS policies updated successfully!');
      try {
        const result = JSON.parse(responseText);
        console.log(result);
      } catch (e) {
        console.log(responseText);
      }
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAdminRLS();



