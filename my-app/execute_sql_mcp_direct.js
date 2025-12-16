/**
 * Execute SQL directly via Supabase Management API
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '..', 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing SQL via Supabase Management API...');
    console.log('');
    
    // Try Supabase Management API
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ 
        query: sql,
        timeout: 30000
      })
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', responseText);

    if (response.ok) {
      console.log('✅ SQL executed successfully!');
      try {
        const result = JSON.parse(responseText);
        console.log(result);
      } catch (e) {
        console.log(responseText);
      }
    } else {
      console.log('⚠️  Management API response:', response.status, responseText);
      
      // Try alternative: Use PostgREST with exec_sql function if it exists
      console.log('');
      console.log('Trying alternative method...');
      
      // Split SQL and execute key parts via REST API
      const supabaseAdmin = require('@supabase/supabase-js').createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      
      // Try to create admin profile directly
      const adminUserId = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
      
      const { data, error } = await supabaseAdmin
        .from('secureshare_users')
        .upsert({
          user_id: adminUserId,
          email: 'janmikyllatabamo4165@gmail.com',
          full_name: 'Admin User',
          role: 'Admin'
        }, {
          onConflict: 'user_id'
        })
        .select();
      
      if (error) {
        console.log('⚠️  Direct insert failed:', error.message);
        console.log('');
        console.log('📋 The table may not exist or constraint needs updating.');
        console.log('   Please ensure FINAL_COMPLETE_SETUP.sql has been executed first.');
      } else {
        console.log('✅ Admin profile created:', data);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📋 SQL execution requires:');
    console.log('   1. Table secureshare_users to exist (run FINAL_COMPLETE_SETUP.sql first)');
    console.log('   2. Then execute CREATE_ADMIN_USER_AND_POLICIES.sql');
  }
}

executeSQL();



