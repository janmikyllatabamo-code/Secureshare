/**
 * Execute SQL via Supabase Admin API (using service role key)
 * This simulates executing via Supabase MCP
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

async function executeSQL() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Read SQL file
    const sqlPath = path.join(__dirname, 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executing SQL via Supabase Admin API...');
    
    // Execute SQL using RPC or direct query
    // Note: Supabase doesn't have a direct SQL execution endpoint via JS client
    // We need to use the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      // Try alternative: execute via PostgREST or use Supabase Management API
      console.log('⚠️  Direct SQL execution not available via JS client');
      console.log('📝 Please execute the SQL via Supabase Dashboard SQL Editor or MCP');
      console.log('📄 SQL file location:', sqlPath);
      return;
    }

    const result = await response.json();
    console.log('✅ SQL executed successfully!');
    console.log(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('📝 Please execute CREATE_ADMIN_USER_AND_POLICIES.sql via Supabase Dashboard SQL Editor');
  }
}

executeSQL();



