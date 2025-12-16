/**
 * Execute SQL via Supabase Management API using Personal Access Token
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '..', 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing SQL via Supabase Management API...');
    console.log('');
    
    // Use Supabase Management API
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
      console.log('✅ SQL executed successfully!');
      try {
        const result = JSON.parse(responseText);
        console.log(result);
      } catch (e) {
        console.log(responseText);
      }
    } else {
      console.log('⚠️  Response:', responseText);
      
      // Try alternative endpoint
      console.log('');
      console.log('Trying alternative endpoint...');
      
      const altResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_PAT}`
        },
        body: JSON.stringify({ 
          query: sql
        })
      });
      
      const altText = await altResponse.text();
      console.log('Alternative response status:', altResponse.status);
      console.log('Alternative response:', altText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📋 If API execution fails, you can also execute via:');
    console.log('   Supabase Dashboard SQL Editor');
    console.log('   URL: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new');
  }
}

executeSQL();



