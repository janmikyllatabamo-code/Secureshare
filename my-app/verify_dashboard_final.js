/**
 * Final verification of dashboard statistics via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function verifyDashboardFinal() {
  try {
    console.log('🔍 Final verification of dashboard statistics...');
    console.log('');
    
    // Get all statistics
    const sql = `
-- Get all dashboard statistics
SELECT 
  (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Teacher') as total_teachers,
  (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Teacher') as active_teachers,
  (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Student') as total_students,
  (SELECT COUNT(*) FROM secureshare_users WHERE created_at >= NOW() - INTERVAL '7 days') as new_accounts,
  (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Admin') as admin_count;
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
      console.log('✅ Dashboard Statistics (via Supabase MCP):');
      console.log('');
      if (result[0] && result[0].length > 0) {
        const stats = result[0][0];
        console.log(`  Total Teachers: ${stats.total_teachers}`);
        console.log(`  Active Teachers: ${stats.active_teachers}`);
        console.log(`  Total Students: ${stats.total_students}`);
        console.log(`  New Accounts (this week): ${stats.new_accounts}`);
        console.log(`  Admin Count: ${stats.admin_count}`);
      }
      console.log('');
      console.log('✅ These values should now appear in the admin dashboard!');
      console.log('');
      console.log('📋 Summary of fixes:');
      console.log('  1. ✅ Fixed App.js to use secureshare_users table');
      console.log('  2. ✅ Fixed RLS policies to allow admin to view all users');
      console.log('  3. ✅ Improved error logging in AdminDashboard');
      console.log('  4. ✅ Verified queries work via Supabase MCP');
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDashboardFinal();


