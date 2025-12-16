/**
 * Verify cleanup - check that only admin remains
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function verifyCleanup() {
  try {
    console.log('🔍 Verifying cleanup...');
    console.log('');
    
    const sql = `
-- Check all users in secureshare_users
SELECT user_id, email, full_name, role, created_at
FROM secureshare_users
ORDER BY created_at;

-- Count users by role
SELECT 
    role,
    COUNT(*) as count
FROM secureshare_users
GROUP BY role
ORDER BY role;
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
      console.log('✅ Users remaining:');
      console.log('');
      
      // First result set - all users
      if (result[0] && Array.isArray(result[0])) {
        console.log('All users:');
        result[0].forEach(user => {
          console.log(`  - ${user.email} (${user.role})`);
        });
        console.log('');
      }
      
      // Second result set - counts by role
      if (result[1] && Array.isArray(result[1])) {
        console.log('User counts by role:');
        result[1].forEach(role => {
          console.log(`  - ${role.role}: ${role.count}`);
        });
      }
      
      console.log('');
      console.log('✅ Verification complete!');
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyCleanup();


