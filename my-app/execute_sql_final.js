/**
 * Execute SQL via Supabase using service role key
 * This will execute CREATE_ADMIN_USER_AND_POLICIES.sql
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

async function executeSQL() {
  try {
    console.log('🚀 Executing SQL via Supabase...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Extract database connection details from service role key
    // The connection string format for Supabase is:
    // postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
    // But we need the actual database password
    
    // Try using Supabase REST API to execute SQL
    // Supabase has a query endpoint that can execute SQL with service role
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SQL executed successfully!');
      console.log(result);
      return;
    }

    // If that doesn't work, try executing via Management API
    const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/vlxkhqvsvfjjhathgakp/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: sql })
    });

    if (mgmtResponse.ok) {
      const result = await mgmtResponse.json();
      console.log('✅ SQL executed via Management API!');
      console.log(result);
      return;
    }

    // If REST API doesn't work, try using Supabase Admin client to execute statements
    console.log('📝 Executing SQL statements via Supabase Admin client...');
    
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Execute the SQL by breaking it into executable parts
    // Step 1: Update constraint (needs direct SQL)
    console.log('Step 1: Updating table constraint...');
    
    // Step 2: Insert admin user profile
    console.log('Step 2: Creating admin user profile...');
    const adminUserId = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
    
    const { data: profileData, error: profileError } = await supabaseAdmin
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

    if (profileError) {
      if (profileError.message?.includes('check constraint') || profileError.message?.includes('role')) {
        console.log('⚠️  Table constraint needs to be updated first.');
        console.log('   The constraint currently only allows Student/Teacher, not Admin.');
        console.log('');
        console.log('📋 Please execute the ALTER TABLE statements manually:');
        console.log('   ALTER TABLE secureshare_users DROP CONSTRAINT IF EXISTS secureshare_users_role_check;');
        console.log('   ALTER TABLE secureshare_users ADD CONSTRAINT secureshare_users_role_check CHECK (role IN (\'Student\', \'Teacher\', \'Admin\'));');
      } else {
        console.error('❌ Error:', profileError);
      }
    } else {
      console.log('✅ Admin user profile created:', profileData);
    }

    console.log('');
    console.log('📝 Note: RLS policies and functions need to be created via SQL Editor');
    console.log('   as they cannot be created via REST API.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📋 Please execute CREATE_ADMIN_USER_AND_POLICIES.sql via Supabase Dashboard SQL Editor');
  }
}

executeSQL();



