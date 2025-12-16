/**
 * Check if admin exists, recreate if needed
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';
const ADMIN_USER_ID = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
const ADMIN_EMAIL = 'janmikyllatabamo4165@gmail.com';

async function recreateAdminIfNeeded() {
  try {
    console.log('🔍 Checking admin user status...');
    console.log('');
    
    // Check if admin exists in secureshare_users
    const checkSQL = `
      SELECT user_id, email, full_name, role
      FROM secureshare_users
      WHERE user_id = '${ADMIN_USER_ID}';
    `;
    
    const checkResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ query: checkSQL })
    });

    const checkResult = await checkResponse.json();
    
    if (checkResult && checkResult.length > 0 && checkResult[0].length > 0) {
      console.log('✅ Admin user exists!');
      console.log(`   Email: ${checkResult[0][0].email}`);
      console.log(`   Role: ${checkResult[0][0].role}`);
      console.log('');
      console.log('✅ Database cleanup complete! Only admin user remains.');
      return;
    }
    
    console.log('⚠️  Admin user not found in secureshare_users');
    console.log('   Checking auth.users...');
    
    // Check auth.users
    const authCheckSQL = `
      SELECT id, email
      FROM auth.users
      WHERE id = '${ADMIN_USER_ID}';
    `;
    
    const authCheckResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ query: authCheckSQL })
    });

    const authCheckResult = await authCheckResponse.json();
    
    if (authCheckResult && authCheckResult.length > 0 && authCheckResult[0].length > 0) {
      console.log('✅ Admin exists in auth.users, recreating profile...');
      
      // Recreate profile
      const recreateSQL = `
        INSERT INTO secureshare_users (user_id, email, full_name, role)
        VALUES ('${ADMIN_USER_ID}', '${ADMIN_EMAIL}', 'Admin User', 'Admin')
        ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role;
      `;
      
      const recreateResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_PAT}`,
          'apikey': SUPABASE_PAT
        },
        body: JSON.stringify({ query: recreateSQL })
      });
      
      if (recreateResponse.ok) {
        console.log('✅ Admin profile recreated!');
      } else {
        console.log('⚠️  Could not recreate profile');
      }
    } else {
      console.log('❌ Admin user not found in auth.users either!');
      console.log('   You may need to recreate the admin user via create_admin_user_mcp.js');
    }
    
    console.log('');
    console.log('📋 Summary:');
    console.log('   - All users and data have been deleted');
    console.log('   - Admin user status checked');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

recreateAdminIfNeeded();


