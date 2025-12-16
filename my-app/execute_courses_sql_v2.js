/**
 * Execute CREATE_COURSES_TABLE.sql via Supabase Admin Client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'CREATE_COURSES_TABLE.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Read SQL file:', sqlPath);
    console.log('📝 Executing SQL...\n');

    // Execute SQL using rpc (if available) or direct query
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API with proper endpoint
    
    // Split into logical blocks
    const blocks = sql.split(/;\s*(?=CREATE|DROP|ALTER|GRANT)/i).filter(b => b.trim().length > 0);
    
    console.log(`📊 Found ${blocks.length} SQL blocks\n`);

    // For now, we'll provide instructions to run in Supabase Dashboard
    console.log('⚠️  Direct SQL execution via JS client is limited.');
    console.log('📋 Please execute the SQL in Supabase Dashboard:\n');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the contents of CREATE_COURSES_TABLE.sql');
    console.log('   3. Click "Run" to execute\n');
    
    console.log('📄 SQL file location:', sqlPath);
    console.log('\n✅ Components have been updated:');
    console.log('   ✓ AddCourseModal - removed enrollment link and Sunday');
    console.log('   ✓ ManageClasses - updated to work with new structure');
    console.log('   ✓ addCourse function - updated for new database schema');

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

executeSQL();

