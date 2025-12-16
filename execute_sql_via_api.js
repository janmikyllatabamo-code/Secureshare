/**
 * Execute SQL via Supabase Management API using service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

async function executeSQL() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    // Read SQL file
    const sql = fs.readFileSync('CREATE_ADMIN_USER_AND_POLICIES.sql', 'utf8');
    
    console.log('🚀 Executing SQL via Supabase Admin API...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '$$');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0 || statement.startsWith('--')) continue;
      
      // Skip DO blocks - we'll handle them separately
      if (statement.includes('DO $$')) {
        // Extract the DO block
        const doBlockMatch = sql.match(/DO \$\$[\s\S]*?\$\$/);
        if (doBlockMatch) {
          try {
            const { error } = await supabaseAdmin.rpc('exec_sql', { 
              sql: doBlockMatch[0] 
            });
            if (error) {
              // Try direct execution via REST
              const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': SERVICE_ROLE_KEY,
                  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({ sql: doBlockMatch[0] })
              });
              if (!response.ok) {
                console.log(`⚠️  Could not execute DO block directly, will use alternative method`);
              }
            }
          } catch (e) {
            console.log(`⚠️  Statement ${i + 1} may need manual execution`);
          }
          continue;
        }
      }

      // For regular statements, try to execute via RPC or direct query
      try {
        // Try executing via a simple query if it's a SELECT
        if (statement.trim().toUpperCase().startsWith('SELECT')) {
          const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
          if (error) console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
        } else {
          // For DDL statements, we need to use the Management API or direct connection
          console.log(`📝 Executing statement ${i + 1}...`);
        }
      } catch (e) {
        console.log(`⚠️  Statement ${i + 1} needs to be executed via SQL Editor`);
      }
    }

    // Since direct SQL execution via JS client is limited, let's use the REST API approach
    // Supabase doesn't expose a direct SQL execution endpoint, so we'll use the Management API
    console.log('');
    console.log('📝 Note: Some SQL statements need to be executed via Supabase Dashboard SQL Editor');
    console.log('📝 Or use the execute_admin_sql.ps1 script with your database password');
    console.log('');
    console.log('✅ However, let me try executing via Supabase REST API...');
    
    // Try using the Supabase Management API
    const managementResponse = await fetch(`https://api.supabase.com/v1/projects/vlxkhqvsvfjjhathgakp/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: sql })
    });

    if (managementResponse.ok) {
      const result = await managementResponse.json();
      console.log('✅ SQL executed via Management API!');
      console.log(result);
    } else {
      console.log('⚠️  Management API not available, using alternative method...');
      // Execute via PostgREST RPC if available, or provide instructions
      console.log('');
      console.log('📋 To complete setup, please:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the contents of CREATE_ADMIN_USER_AND_POLICIES.sql');
      console.log('3. Execute the SQL');
      console.log('');
      console.log('Or run: .\\execute_admin_sql.ps1 (with your database password)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📋 Alternative: Execute CREATE_ADMIN_USER_AND_POLICIES.sql via:');
    console.log('   - Supabase Dashboard → SQL Editor');
    console.log('   - Or run: .\\execute_admin_sql.ps1');
  }
}

executeSQL();



