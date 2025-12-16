/**
 * Test direct query to verify admin exists
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function testDirectQuery() {
  try {
    console.log('🔍 Testing direct query...');
    console.log('');
    
    // Simple query without any filters
    const sql = `
      SELECT user_id, email, full_name, role, created_at
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
    console.log('Response:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      if (result[0] && result[0].length > 0) {
        console.log('✅ Users found:');
        result[0].forEach(user => {
          console.log(`  - ${user.email} (${user.role})`);
        });
      } else {
        console.log('⚠️  No users found in query result');
      }
    } else {
      console.log('⚠️  Error response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectQuery();


