/**
 * Test admin dashboard statistics queries via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function testDashboardStats() {
  try {
    console.log('🔍 Testing admin dashboard statistics queries...');
    console.log('');
    
    // Query all statistics at once
    const sql = `
-- Get all statistics for admin dashboard
SELECT 
  (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Teacher') as total_teachers,
  (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Teacher') as active_teachers,
  (SELECT COUNT(*) FROM secureshare_users WHERE role = 'Student') as total_students,
  (SELECT COUNT(*) FROM secureshare_users WHERE created_at >= NOW() - INTERVAL '7 days') as new_accounts;
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
      console.log('✅ Dashboard Statistics:');
      console.log('');
      if (result[0] && result[0].length > 0) {
        const stats = result[0][0];
        console.log(`  Total Teachers: ${stats.total_teachers}`);
        console.log(`  Active Teachers: ${stats.active_teachers}`);
        console.log(`  Total Students: ${stats.total_students}`);
        console.log(`  New Accounts (this week): ${stats.new_accounts}`);
      }
      console.log('');
      
      // Also get detailed breakdown
      const detailSQL = `
        SELECT role, COUNT(*) as count
        FROM secureshare_users
        GROUP BY role
        ORDER BY role;
      `;
      
      const detailResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_PAT}`,
          'apikey': SUPABASE_PAT
        },
        body: JSON.stringify({ 
          query: detailSQL
        })
      });
      
      const detailResult = await detailResponse.json();
      console.log('📊 Users by Role:');
      if (detailResult[0] && detailResult[0].length > 0) {
        detailResult[0].forEach(row => {
          console.log(`  ${row.role}: ${row.count}`);
        });
      }
      
    } else {
      console.log('⚠️  Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDashboardStats();


