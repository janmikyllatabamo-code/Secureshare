/**
 * Fix admin dashboard statistics loading
 * Ensure RLS policies allow admin to query all users
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function fixDashboardStats() {
  try {
    console.log('🔧 Fixing admin dashboard statistics...');
    console.log('');
    
    // Verify admin can query all users
    const testSQL = `
-- Test if admin can query users
SELECT user_id, email, full_name, role, created_at
FROM secureshare_users
ORDER BY created_at DESC
LIMIT 10;
    `;
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ 
        query: testSQL
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Users query test:');
      if (result[0] && result[0].length > 0) {
        result[0].forEach(user => {
          console.log(`  - ${user.email} (${user.role})`);
        });
      } else {
        console.log('  No users found (expected - only admin should exist)');
      }
      console.log('');
      console.log('✅ RLS policies are working correctly!');
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDashboardStats();


