/**
 * Execute CREATE_COURSES_TABLE.sql via Supabase Admin API
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   REACT_APP_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   REACT_APP_SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

async function executeSQL() {
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'CREATE_COURSES_TABLE.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Read SQL file:', sqlPath);
    console.log('📝 SQL length:', sql.length, 'characters');

    // Split SQL into individual statements (semicolon-separated)
    // Remove comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📊 Found', statements.length, 'SQL statements');

    // Execute each statement via REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.trim().length === 0) continue;

      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
      console.log('   Preview:', statement.substring(0, 100).replace(/\n/g, ' ') + '...');

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql: statement + ';' })
        });

        if (!response.ok) {
          // Try alternative endpoint
          const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ query: statement })
          });

          if (!altResponse.ok) {
            const errorText = await response.text();
            console.error('   ❌ Error:', response.status, response.statusText);
            console.error('   Response:', errorText.substring(0, 200));
            // Continue with next statement
            continue;
          }
        }

        console.log('   ✅ Success');
      } catch (err) {
        console.error('   ❌ Exception:', err.message);
        // Continue with next statement
      }
    }

    console.log('\n✅ SQL execution completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify the courses table was created in Supabase Dashboard');
    console.log('   2. Check RLS policies are enabled');
    console.log('   3. Test creating a course from the UI');

  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

executeSQL();

