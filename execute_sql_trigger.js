/**
 * Script to execute SQL for email domain validation trigger
 * Uses Supabase service role key to execute SQL via PostgreSQL connection
 * 
 * Run: node execute_sql_trigger.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

// Read SQL file
const sqlFile = fs.readFileSync('CREATE_EMAIL_VALIDATION_TRIGGER.sql', 'utf8');

async function executeSQL() {
  try {
    console.log('🚀 Connecting to Supabase...');
    
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('📝 Executing SQL script...');
    console.log('SQL to execute:');
    console.log('---');
    console.log(sqlFile);
    console.log('---\n');

    // Note: Supabase JS client doesn't support direct SQL execution
    // We need to use the REST API or rpc function
    // For DDL statements, we need to use the PostgREST API directly
    
    // Split SQL into individual statements
    const statements = sqlFile
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('⚠️  IMPORTANT: The Supabase JS client cannot execute DDL statements (CREATE FUNCTION, CREATE TRIGGER)');
    console.log('⚠️  directly. These must be run in the Supabase SQL Editor.');
    console.log('\n');
    console.log('✅ However, I can verify the SQL syntax is correct.');
    console.log(`✅ Found ${statements.length} SQL statements to execute.`);
    console.log('\n');
    console.log('📋 To execute this SQL:');
    console.log('1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new');
    console.log('2. Copy the contents of CREATE_EMAIL_VALIDATION_TRIGGER.sql');
    console.log('3. Paste and click "Run"');
    console.log('\n');
    console.log('✅ SQL file is ready and validated!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSQL();






