/**
 * Find admin user and ensure it's set up correctly via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';
const ADMIN_EMAIL = 'janmikyllatabamo4165@gmail.com';

async function findAndFixAdmin() {
  try {
    console.log('🔍 Finding and fixing admin user...');
    console.log('');
    
    const sql = `
-- Find admin user in auth.users by email
SELECT id, email, created_at
FROM auth.users
WHERE email = '${ADMIN_EMAIL}';

-- Get all users in secureshare_users
SELECT user_id, email, full_name, role
FROM secureshare_users
ORDER BY created_at DESC;
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
      console.log('✅ Query Results:');
      console.log('');
      
      // Check auth.users
      if (result[0] && result[0].length > 0) {
        const authUser = result[0][0];
        console.log('✅ Found in auth.users:');
        console.log(`   User ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email}`);
        console.log('');
        
        // Now insert into secureshare_users with the correct user_id
        const insertSQL = `
          INSERT INTO secureshare_users (user_id, email, full_name, role)
          VALUES ('${authUser.id}', '${authUser.email}', 'Admin User', 'Admin')
          ON CONFLICT (user_id) DO UPDATE SET
              email = EXCLUDED.email,
              full_name = EXCLUDED.full_name,
              role = EXCLUDED.role,
              updated_at = NOW();
          
          SELECT user_id, email, full_name, role
          FROM secureshare_users
          WHERE user_id = '${authUser.id}';
        `;
        
        const insertResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_PAT}`,
            'apikey': SUPABASE_PAT
          },
          body: JSON.stringify({ 
            query: insertSQL
          })
        });
        
        const insertResult = await insertResponse.json();
        if (insertResponse.ok && insertResult[0] && insertResult[0].length > 0) {
          console.log('✅ Admin profile created/updated in secureshare_users!');
          console.log(`   ${insertResult[0][0].email} (${insertResult[0][0].role})`);
        }
      } else {
        console.log('⚠️  Admin user not found in auth.users');
        console.log('   You may need to create the user first');
      }
      console.log('');
      
      // Check secureshare_users
      if (result[1] && result[1].length > 0) {
        console.log('📊 Users in secureshare_users:');
        result[1].forEach(user => {
          console.log(`  - ${user.email} (${user.role})`);
        });
      } else {
        console.log('📊 No users in secureshare_users');
      }
      
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAndFixAdmin();


