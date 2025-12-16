/**
 * Test queries after fixing RLS recursion
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function testFixedQueries() {
  try {
    console.log('🔍 Testing queries after RLS recursion fix...');
    console.log('');
    
    // Test all dashboard statistics
    const sql = `
-- Test 1: Get all teachers
SELECT user_id, email, full_name, role, created_at
FROM secureshare_users
WHERE role = 'Teacher'
ORDER BY created_at DESC;

-- Test 2: Count students
SELECT COUNT(*) as count
FROM secureshare_users
WHERE role = 'Student';

-- Test 3: Count new accounts
SELECT COUNT(*) as count
FROM secureshare_users
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Test 4: Get all users (admin should see all)
SELECT user_id, email, full_name, role
FROM secureshare_users
ORDER BY role, created_at DESC;
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
      console.log('✅ All queries successful!');
      console.log('');
      
      // Result 1: Teachers
      if (result[0] && result[0].length > 0) {
        console.log('📊 Teachers:', result[0].length);
        result[0].forEach(teacher => {
          console.log(`  - ${teacher.email} (${teacher.full_name})`);
        });
      } else {
        console.log('📊 Teachers: 0');
      }
      console.log('');
      
      // Result 2: Students count
      if (result[1] && result[1].length > 0) {
        console.log(`📊 Students: ${result[1][0].count}`);
      }
      console.log('');
      
      // Result 3: New accounts
      if (result[2] && result[2].length > 0) {
        console.log(`📊 New Accounts (this week): ${result[2][0].count}`);
      }
      console.log('');
      
      // Result 4: All users
      if (result[3] && result[3].length > 0) {
        console.log('📊 All Users:', result[3].length);
        result[3].forEach(user => {
          console.log(`  - ${user.email} (${user.role})`);
        });
      }
      console.log('');
      console.log('✅ Dashboard should now display these statistics correctly!');
      
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFixedQueries();


