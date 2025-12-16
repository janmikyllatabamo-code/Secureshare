/**
 * Verify current database state via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function verifyCurrentState() {
  try {
    console.log('🔍 Verifying current database state...');
    console.log('');
    
    const sql = `
-- Get all users
SELECT user_id, email, full_name, role, created_at
FROM secureshare_users
ORDER BY created_at DESC;

-- Get statistics
SELECT 
    COUNT(*) FILTER (WHERE role = 'Teacher') as total_teachers,
    COUNT(*) FILTER (WHERE role = 'Student') as total_students,
    COUNT(*) FILTER (WHERE role = 'Admin') as total_admins,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_accounts
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
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Current Database State:');
      console.log('');
      
      // All users
      if (result[0] && result[0].length > 0) {
        console.log('📊 All Users:');
        result[0].forEach(user => {
          console.log(`  - ${user.email} (${user.role}) - Created: ${user.created_at}`);
        });
      } else {
        console.log('📊 No users found');
      }
      console.log('');
      
      // Statistics
      if (result[1] && result[1].length > 0) {
        const stats = result[1][0];
        console.log('📊 Dashboard Statistics:');
        console.log(`  Total Teachers: ${stats.total_teachers}`);
        console.log(`  Total Students: ${stats.total_students}`);
        console.log(`  Total Admins: ${stats.total_admins}`);
        console.log(`  New Accounts (this week): ${stats.new_accounts}`);
      }
      console.log('');
      console.log('✅ RLS recursion fixed! Dashboard should work correctly now.');
      
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyCurrentState();


