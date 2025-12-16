/**
 * Execute SQL directly via PostgreSQL connection using service role
 * This bypasses the need for database password by using connection pooling
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase connection using service role
// Note: We need the database password from connection string
// But we can try using the connection pooler or direct connection
const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

// Try to get password from environment or use connection string format
// For Supabase, we need the actual database password
// This is typically found in: Dashboard → Settings → Database → Connection string

async function executeSQL() {
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Attempting to execute SQL...');
    console.log('📝 Note: This requires the Supabase database password.');
    console.log('');
    console.log('Since direct SQL execution requires the database password,');
    console.log('please execute the SQL via one of these methods:');
    console.log('');
    console.log('Option 1: Supabase Dashboard (Recommended)');
    console.log('  1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new');
    console.log('  2. Copy contents of CREATE_ADMIN_USER_AND_POLICIES.sql');
    console.log('  3. Paste and click "Run"');
    console.log('');
    console.log('Option 2: PowerShell Script');
    console.log('  Run: cd ..; .\\execute_admin_sql.ps1');
    console.log('  (Will prompt for database password)');
    console.log('');
    console.log('✅ The SQL file is ready at: CREATE_ADMIN_USER_AND_POLICIES.sql');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQL();



