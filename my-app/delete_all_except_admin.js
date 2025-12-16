/**
 * Delete all users and data except admin via Supabase MCP
 */

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';
const fs = require('fs');
const path = require('path');

async function deleteAllExceptAdmin() {
  try {
    console.log('🗑️  Deleting all users and data except admin...');
    console.log('');
    console.log('⚠️  WARNING: This will delete all users and data except the admin!');
    console.log('');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'DELETE_ALL_EXCEPT_ADMIN.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing cleanup SQL...');
    
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
      console.log('✅ Cleanup executed successfully!');
      console.log('');
      console.log('Results:');
      result.forEach((row, index) => {
        if (row.status) {
          console.log(`  ${row.status}`);
        } else {
          console.log(`  Row ${index + 1}:`, row);
        }
      });
      console.log('');
      console.log('✅ Database cleaned! Only admin user remains.');
      console.log('');
      console.log('Admin user:');
      console.log('  Email: janmikyllatabamo4165@gmail.com');
      console.log('  Password: 123456');
    } else {
      console.log('⚠️  Response:', responseText);
      const error = JSON.parse(responseText);
      if (error.message) {
        console.log('Error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteAllExceptAdmin();


