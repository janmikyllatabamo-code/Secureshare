/**
 * Execute CREATE_STORAGE_POLICIES_ONLY.sql via Supabase Management API
 * This script attempts to execute the storage policies SQL using the service role key
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function executeStoragePolicies() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'CREATE_STORAGE_POLICIES_ONLY.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Executing Storage Policies SQL via Supabase...');
    console.log('📄 File: CREATE_STORAGE_POLICIES_ONLY.sql');
    console.log('');

    // Method 1: Try Supabase Management API (if available)
    console.log('📝 Method 1: Trying Supabase Management API...');
    try {
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
      
      if (response.ok) {
        console.log('✅ SQL executed successfully via Management API!');
        try {
          const result = JSON.parse(responseText);
          console.log('Result:', JSON.stringify(result, null, 2));
          return;
        } catch (e) {
          console.log('Response:', responseText);
          return;
        }
      } else {
        console.log(`⚠️  Management API returned ${response.status}`);
        console.log('Response:', responseText.substring(0, 500));
      }
    } catch (error) {
      console.log(`⚠️  Management API error: ${error.message}`);
    }

    console.log('');
    console.log('📝 Method 2: Trying PostgREST with exec_sql function...');
    
    // Method 2: Try using PostgREST with exec_sql RPC function (if it exists)
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: sql })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ SQL executed successfully via RPC!');
        console.log('Result:', JSON.stringify(result, null, 2));
        return;
      } else {
        const errorText = await response.text();
        console.log(`⚠️  RPC returned ${response.status}: ${errorText.substring(0, 500)}`);
      }
    } catch (error) {
      console.log(`⚠️  RPC error: ${error.message}`);
    }

    console.log('');
    console.log('📝 Method 3: Trying direct database connection via pg...');
    
    // Method 3: Try using pg library if available
    try {
      const { Client } = require('pg');
      const client = new Client({
        connectionString: `postgresql://postgres.${PROJECT_REF}:${SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
      });
      
      await client.connect();
      const result = await client.query(sql);
      await client.end();
      
      console.log('✅ SQL executed successfully via direct connection!');
      console.log('Result:', result);
      return;
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('⚠️  pg module not installed. Install with: npm install pg');
      } else {
        console.log(`⚠️  Direct connection error: ${error.message}`);
      }
    }

    // If all methods fail, provide instructions
    console.log('');
    console.log('❌ All automated methods failed. Please execute manually:');
    console.log('');
    console.log('📋 OPTION 1: Via Supabase Dashboard SQL Editor (Recommended)');
    console.log('   1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new');
    console.log('   2. Copy and paste the contents of CREATE_STORAGE_POLICIES_ONLY.sql');
    console.log('   3. Click "Run"');
    console.log('');
    console.log('📋 OPTION 2: Via Supabase CLI (if you have it installed)');
    console.log('   supabase db execute --file CREATE_STORAGE_POLICIES_ONLY.sql');
    console.log('');
    console.log('📋 OPTION 3: Via psql (if you have database connection)');
    console.log(`   psql "postgresql://postgres.${PROJECT_REF}:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f CREATE_STORAGE_POLICIES_ONLY.sql`);
    console.log('');
    console.log('📄 SQL file location:', sqlPath);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Please execute CREATE_STORAGE_POLICIES_ONLY.sql manually via Supabase Dashboard SQL Editor');
  }
}

executeStoragePolicies();

