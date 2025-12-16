/**
 * Check admin user role via Supabase Management API
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';
const ADMIN_USER_ID = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';

async function checkAdminRole() {
  try {
    console.log('🔍 Checking admin user role...');
    
    // Query the secureshare_users table to check admin role
    const sql = `
      SELECT user_id, email, full_name, role 
      FROM secureshare_users 
      WHERE user_id = '${ADMIN_USER_ID}';
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
    console.log('Response:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Admin user data:', result);
    } else {
      console.log('⚠️  Error:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminRole();



