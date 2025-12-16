/**
 * Ensure admin user exists in secureshare_users via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';
const ADMIN_USER_ID = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
const ADMIN_EMAIL = 'janmikyllatabamo4165@gmail.com';

async function ensureAdminExists() {
  try {
    console.log('🔧 Ensuring admin user exists...');
    console.log('');
    
    const sql = `
-- Check if admin exists in auth.users
SELECT id, email, created_at
FROM auth.users
WHERE id = '${ADMIN_USER_ID}';

-- Insert/Update admin in secureshare_users
INSERT INTO secureshare_users (user_id, email, full_name, role)
VALUES ('${ADMIN_USER_ID}', '${ADMIN_EMAIL}', 'Admin User', 'Admin')
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Verify admin exists
SELECT user_id, email, full_name, role, created_at
FROM secureshare_users
WHERE user_id = '${ADMIN_USER_ID}';

-- Get all statistics
SELECT 
    COUNT(*) FILTER (WHERE role = 'Teacher') as total_teachers,
    COUNT(*) FILTER (WHERE role = 'Student') as total_students,
    COUNT(*) FILTER (WHERE role = 'Admin') as total_admins,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_accounts
FROM secureshare_users;
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
      console.log('✅ Admin user setup complete!');
      console.log('');
      
      // Check auth.users
      if (result[0] && result[0].length > 0) {
        console.log('✅ Admin exists in auth.users:', result[0][0].email);
      } else {
        console.log('⚠️  Admin not found in auth.users');
      }
      console.log('');
      
      // Check secureshare_users
      if (result[2] && result[2].length > 0) {
        console.log('✅ Admin exists in secureshare_users:', result[2][0].email);
        console.log(`   Role: ${result[2][0].role}`);
      } else {
        console.log('⚠️  Admin not found in secureshare_users');
      }
      console.log('');
      
      // Statistics
      if (result[3] && result[3].length > 0) {
        const stats = result[3][0];
        console.log('📊 Dashboard Statistics:');
        console.log(`  Total Teachers: ${stats.total_teachers}`);
        console.log(`  Total Students: ${stats.total_students}`);
        console.log(`  Total Admins: ${stats.total_admins}`);
        console.log(`  New Accounts (this week): ${stats.new_accounts}`);
      }
      console.log('');
      console.log('✅ Dashboard should now work correctly!');
      
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

ensureAdminExists();


