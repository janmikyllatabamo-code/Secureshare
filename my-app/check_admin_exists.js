/**
 * Check if admin user still exists
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function checkAdmin() {
  try {
    console.log('🔍 Checking if admin user exists...');
    console.log('');
    
    const sql = `
-- Check admin user in secureshare_users
SELECT user_id, email, full_name, role
FROM secureshare_users
WHERE user_id = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';

-- Count all users
SELECT COUNT(*) as total_users FROM secureshare_users;

-- Check auth.users
SELECT id, email, created_at
FROM auth.users
WHERE id = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
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
      console.log('Results:');
      console.log('');
      
      // First result - admin in secureshare_users
      if (result[0] && Array.isArray(result[0])) {
        if (result[0].length > 0) {
          console.log('✅ Admin user in secureshare_users:');
          console.log(`   Email: ${result[0][0].email}`);
          console.log(`   Name: ${result[0][0].full_name}`);
          console.log(`   Role: ${result[0][0].role}`);
        } else {
          console.log('❌ Admin user NOT found in secureshare_users!');
        }
        console.log('');
      }
      
      // Second result - total users count
      if (result[1] && Array.isArray(result[1])) {
        console.log(`Total users in secureshare_users: ${result[1][0].total_users}`);
        console.log('');
      }
      
      // Third result - admin in auth.users
      if (result[2] && Array.isArray(result[2])) {
        if (result[2].length > 0) {
          console.log('✅ Admin user in auth.users:');
          console.log(`   Email: ${result[2][0].email}`);
          console.log(`   Created: ${result[2][0].created_at}`);
        } else {
          console.log('❌ Admin user NOT found in auth.users!');
        }
      }
      
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdmin();


