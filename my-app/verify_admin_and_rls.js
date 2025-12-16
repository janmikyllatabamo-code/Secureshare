/**
 * Verify admin user exists and RLS policies allow admin to view all users
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function verifyAdminAndRLS() {
  try {
    console.log('🔍 Verifying admin user and RLS policies...');
    console.log('');
    
    // Check if admin exists
    const checkAdminSQL = `
      SELECT user_id, email, full_name, role
      FROM secureshare_users
      WHERE role = 'Admin';
    `;
    
    const adminResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ 
        query: checkAdminSQL
      })
    });

    const adminResult = await adminResponse.json();
    console.log('Admin user check:');
    if (adminResult[0] && adminResult[0].length > 0) {
      console.log('✅ Admin user exists:', adminResult[0][0]);
    } else {
      console.log('❌ Admin user not found!');
    }
    console.log('');
    
    // Check RLS policies
    const checkRLSSQL = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'secureshare_users'
      ORDER BY policyname;
    `;
    
    const rlsResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ 
        query: checkRLSSQL
      })
    });

    const rlsResult = await rlsResponse.json();
    console.log('RLS Policies for secureshare_users:');
    if (rlsResult[0] && rlsResult[0].length > 0) {
      rlsResult[0].forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('  No policies found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAdminAndRLS();


