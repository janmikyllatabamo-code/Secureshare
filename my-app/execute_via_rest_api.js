/**
 * Execute SQL via Supabase REST API using service role key
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '..', 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing SQL via Supabase REST API...');
    console.log('');
    
    // Supabase doesn't have a direct SQL execution endpoint via REST API
    // We need to use the Management API or SQL Editor
    // However, we can try to execute via PostgREST if there's an exec_sql function
    
    // Try to create/update the admin user profile directly via REST API
    console.log('📝 Step 1: Creating admin user profile via REST API...');
    
    const adminUserId = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
    
    // Try to insert/update via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/secureshare_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: adminUserId,
        email: 'janmikyllatabamo4165@gmail.com',
        full_name: 'Admin User',
        role: 'Admin'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin user profile created/updated:', data);
    } else {
      const error = await response.text();
      console.log('⚠️  Could not create profile via REST:', error);
      console.log('');
      console.log('📋 This is expected - the table constraint and RLS policies need to be set up first.');
      console.log('   Please execute CREATE_ADMIN_USER_AND_POLICIES.sql via:');
      console.log('   1. Supabase Dashboard → SQL Editor');
      console.log('   2. Or via Supabase MCP (if configured)');
    }

    console.log('');
    console.log('📋 Complete SQL execution requires Supabase Dashboard SQL Editor or MCP');
    console.log('   File: CREATE_ADMIN_USER_AND_POLICIES.sql');
    console.log('   URL: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQL();



