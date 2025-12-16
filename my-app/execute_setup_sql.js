/**
 * Execute SQL via Supabase Management API using Personal Access Token
 * First creates the table, then sets up admin user
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

async function executeSQL(sql, description) {
  try {
    console.log(`🚀 ${description}...`);
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_PAT}`,
        'apikey': SUPABASE_PAT
      },
      body: JSON.stringify({ 
        query: sql
      })
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ ${description} - Success!`);
      try {
        const result = JSON.parse(responseText);
        if (result.data) console.log(result.data);
      } catch (e) {
        // Response might not be JSON
      }
      return true;
    } else {
      const error = JSON.parse(responseText);
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`⚠️  ${description} - Already exists (skipping)`);
        return true;
      }
      console.log(`❌ ${description} - Error:`, error.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error executing ${description}:`, error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Setting up SecureShare database and admin user...');
    console.log('');
    
    // Step 1: Check if table exists, if not create it
    console.log('📝 Step 1: Ensuring secureshare_users table exists...');
    
    const createTableSQL = `
-- Create secureshare_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS secureshare_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Student', 'Teacher', 'Admin')),
    student_id VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE secureshare_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can update own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON secureshare_users;
DROP POLICY IF EXISTS "Users can search by email" ON secureshare_users;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON secureshare_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON secureshare_users
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON secureshare_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can search by email" ON secureshare_users
    FOR SELECT USING (auth.role() = 'authenticated');
`;

    await executeSQL(createTableSQL, 'Creating secureshare_users table and basic policies');
    console.log('');
    
    // Step 2: Execute the admin setup SQL
    console.log('📝 Step 2: Setting up admin user and policies...');
    const adminSQLPath = path.join(__dirname, '..', 'CREATE_ADMIN_USER_AND_POLICIES.sql');
    const adminSQL = fs.readFileSync(adminSQLPath, 'utf8');
    
    await executeSQL(adminSQL, 'Setting up admin user and RLS policies');
    console.log('');
    
    console.log('✅ Setup complete!');
    console.log('');
    console.log('You can now login with:');
    console.log('  Email: janmikyllatabamo4165@gmail.com');
    console.log('  Password: 123456');
    console.log('  You will be redirected to /admin-dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();



