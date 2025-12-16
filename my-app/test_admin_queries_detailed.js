/**
 * Test admin queries with detailed error checking via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function testAdminQueries() {
  try {
    console.log('🔍 Testing admin queries with detailed error checking...');
    console.log('');
    
    // Test 1: Query teachers
    console.log('📊 Test 1: Query teachers');
    const teachersSQL = `
      SELECT user_id, email, full_name, role, created_at
      FROM secureshare_users
      WHERE role = 'Teacher'
      ORDER BY created_at DESC;
    `;
    
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
    console.log('  Status:', teachersResponse.status);
    console.log('  Result:', JSON.stringify(teachersResult, null, 2));
    console.log('');
    
    // Test 2: Count students
    console.log('📊 Test 2: Count students');
    const studentsSQL = `
      SELECT COUNT(*) as count
      FROM secureshare_users
      WHERE role = 'Student';
    `;
    
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
    console.log('  Status:', studentsResponse.status);
    console.log('  Result:', JSON.stringify(studentsResult, null, 2));
    console.log('');
    
    // Test 3: Count new accounts
    console.log('📊 Test 3: Count new accounts (last 7 days)');
    const newAccountsSQL = `
      SELECT COUNT(*) as count
      FROM secureshare_users
      WHERE created_at >= NOW() - INTERVAL '7 days';
    `;
    
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
    console.log('  Status:', newAccountsResponse.status);
    console.log('  Result:', JSON.stringify(newAccountsResult, null, 2));
    console.log('');
    
    // Test 4: Check all users
    console.log('📊 Test 4: Check all users');
    const allUsersSQL = `
      SELECT user_id, email, full_name, role, created_at
      FROM secureshare_users
      ORDER BY created_at DESC;
    `;
    
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
    console.log('  Status:', allUsersResponse.status);
    console.log('  Result:', JSON.stringify(allUsersResult, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdminQueries();


