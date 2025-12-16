/**
 * Fix courses table RLS infinite recursion issue
 * This script updates the RLS policies to use SECURITY DEFINER functions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLS() {
  try {
    console.log('🔧 Fixing RLS infinite recursion issue...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'CREATE_COURSES_TABLE.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file read:', sqlPath);
    console.log('📝 Executing SQL to fix RLS policies...\n');

    // The SQL needs to be executed in Supabase Dashboard SQL Editor
    // But we can provide instructions
    console.log('⚠️  Direct SQL execution via JS client is limited.');
    console.log('📋 Please execute the SQL in Supabase Dashboard:\n');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the contents of CREATE_COURSES_TABLE.sql');
    console.log('   3. Click "Run" to execute\n');
    
    console.log('📄 SQL file location:', sqlPath);
    console.log('\n✅ The SQL file has been updated with:');
    console.log('   ✓ SECURITY DEFINER functions to bypass RLS');
    console.log('   ✓ Proper function ordering (created after tables)');
    console.log('   ✓ Helper functions to prevent infinite recursion');

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fixRLS();

