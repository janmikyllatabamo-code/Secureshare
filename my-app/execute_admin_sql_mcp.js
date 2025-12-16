/**
 * Execute SQL statements via Supabase Admin Client
 * This executes the CREATE_ADMIN_USER_AND_POLICIES.sql statements
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

    console.log('🚀 Executing SQL via Supabase Admin API...');
    console.log('');

    // Step 1: Update table constraint
    console.log('📝 Step 1: Updating secureshare_users table constraint...');
    // This needs to be done via SQL Editor, but we can verify the table exists
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('secureshare_users')
      .select('role')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST205') {
      console.log('⚠️  Table secureshare_users not found. Please run FINAL_COMPLETE_SETUP.sql first.');
      return;
    }
    console.log('✅ Table exists');

    // Step 2: Insert/Update admin user profile
    console.log('📝 Step 2: Creating/updating admin user profile...');
    
    // Get admin user from auth (we know the user_id from earlier: f2bf9974-5b00-4acd-8dc0-bd3c37170821)
    const adminUserId = 'f2bf9974-5b00-4acd-8dc0-bd3c37170821';
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('secureshare_users')
      .upsert({
        user_id: adminUserId,
        email: 'janmikyllatabamo4165@gmail.com',
        full_name: 'Admin User',
        role: 'Admin'
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (profileError) {
      // If error is about constraint, we need to update the constraint first
      if (profileError.message?.includes('check constraint') || profileError.message?.includes('role')) {
        console.log('⚠️  Table constraint needs to be updated first.');
        console.log('📋 Please execute the ALTER TABLE statement from CREATE_ADMIN_USER_AND_POLICIES.sql');
        console.log('   via Supabase Dashboard SQL Editor');
        return;
      }
      console.error('❌ Error creating profile:', profileError);
      return;
    }
    
    console.log('✅ Admin user profile created/updated:', profileData);

    // Step 3: RLS Policies - These need to be created via SQL Editor
    // But we can verify they exist by checking if admin can query
    console.log('');
    console.log('📝 Step 3: RLS Policies need to be created via SQL Editor');
    console.log('   (Supabase JS client cannot create RLS policies directly)');
    
    console.log('');
    console.log('✅ Partial setup complete!');
    console.log('');
    console.log('📋 Remaining steps (execute via Supabase Dashboard SQL Editor):');
    console.log('  1. ALTER TABLE secureshare_users DROP CONSTRAINT IF EXISTS secureshare_users_role_check;');
    console.log('  2. ALTER TABLE secureshare_users ADD CONSTRAINT secureshare_users_role_check CHECK (role IN (\'Student\', \'Teacher\', \'Admin\'));');
    console.log('  3. Create RLS policies (see CREATE_ADMIN_USER_AND_POLICIES.sql lines 49-90)');
    console.log('  4. Create is_admin() function (see CREATE_ADMIN_USER_AND_POLICIES.sql lines 92-101)');
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSQL();



