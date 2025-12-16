/**
 * Execute SQL via direct PostgreSQL connection
 * Using Supabase connection pooler
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase connection using connection pooler
// Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
// For direct connection: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function executeSQL() {
  try {
    const sqlPath = path.join(__dirname, '..', 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Attempting to execute SQL...');
    console.log('');
    console.log('📋 To execute SQL, you need the database password.');
    console.log('   Get it from: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/database');
    console.log('');
    console.log('   Then run:');
    console.log('   cd ..');
    console.log('   .\\execute_admin_sql.ps1');
    console.log('');
    console.log('   Or execute CREATE_ADMIN_USER_AND_POLICIES.sql via Supabase Dashboard SQL Editor');
    console.log('   URL: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQL();



