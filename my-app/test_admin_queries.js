/**
 * Test admin dashboard queries via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function testQueries() {
  try {
    console.log('🔍 Testing admin dashboard queries...');
    console.log('');
    
    // Query 1: Total Teachers
    const teachersSQL = `
      SELECT COUNT(*) as count
      FROM secureshare_users
      WHERE role = 'Teacher';
    `;
    
    console.log('📊 Query 1: Total Teachers');
    const teachersResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ query: teachersSQL })
    });
    
    const teachersResult = await teachersResponse.json();
    console.log('  Result:', teachersResult);
    console.log('');
    
    // Query 2: Total Students
    const studentsSQL = `
      SELECT COUNT(*) as count
      FROM secureshare_users
      WHERE role = 'Student';
    `;
    
    console.log('📊 Query 2: Total Students');
    const studentsResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ query: studentsSQL })
    });
    
    const studentsResult = await studentsResponse.json();
    console.log('  Result:', studentsResult);
    console.log('');
    
    // Query 3: New Accounts (this week)
    const newAccountsSQL = `
      SELECT COUNT(*) as count
      FROM secureshare_users
      WHERE created_at >= NOW() - INTERVAL '7 days';
    `;
    
    console.log('📊 Query 3: New Accounts (this week)');
    const newAccountsResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ query: newAccountsSQL })
    });
    
    const newAccountsResult = await newAccountsResponse.json();
    console.log('  Result:', newAccountsResult);
    console.log('');
    
    // Query 4: All users with roles
    const allUsersSQL = `
      SELECT role, COUNT(*) as count
      FROM secureshare_users
      GROUP BY role;
    `;
    
    console.log('📊 Query 4: All users by role');
    const allUsersResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ query: allUsersSQL })
    });
    
    const allUsersResult = await allUsersResponse.json();
    console.log('  Result:', allUsersResult);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testQueries();



