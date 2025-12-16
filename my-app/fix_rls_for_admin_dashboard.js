/**
 * Fix RLS policies to ensure admin can query all users for dashboard
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function fixRLSForDashboard() {
  try {
    console.log('🔧 Fixing RLS policies for admin dashboard...');
    console.log('');
    
    const sql = `
-- Drop and recreate the "Users can view own profile" policy
-- This should allow users to see their own profile OR admins to see all
DROP POLICY IF EXISTS "Users can view own profile" ON secureshare_users;

CREATE POLICY "Users can view own profile" ON secureshare_users
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM secureshare_users AS admin_check
            WHERE admin_check.user_id = auth.uid() 
            AND admin_check.role = 'Admin'
        )
    );

-- Ensure "Admins can view all users" policy exists and works
DROP POLICY IF EXISTS "Admins can view all users" ON secureshare_users;

CREATE POLICY "Admins can view all users" ON secureshare_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM secureshare_users
            WHERE user_id = auth.uid() AND role = 'Admin'
        )
    );

-- Verify policies
SELECT 
    'RLS policies updated' AS status,
    (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Admin') as admin_count,
    (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Teacher') as teacher_count,
    (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Student') as student_count;
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
      console.log('✅ RLS policies fixed!');
      console.log('');
      if (result[result.length - 1] && result[result.length - 1].length > 0) {
        const stats = result[result.length - 1][0];
        console.log('Current user counts:');
        console.log(`  Admin: ${stats.admin_count}`);
        console.log(`  Teacher: ${stats.teacher_count}`);
        console.log(`  Student: ${stats.student_count}`);
      }
      console.log('');
      console.log('✅ Admin should now be able to query all users for dashboard!');
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRLSForDashboard();


