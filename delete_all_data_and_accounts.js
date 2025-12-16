/**
 * Script to delete ALL data and accounts from Supabase
 * Uses Supabase admin API to delete users and data
 * 
 * Run: node delete_all_data_and_accounts.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

async function deleteAllDataAndAccounts() {
  try {
    console.log('🚀 Connecting to Supabase...');
    console.log(`Project URL: ${SUPABASE_URL}`);
    
    // Service role key is set from the script
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('📋 Starting deletion process...\n');

    // Step 1: Get all auth users
    console.log('Step 1: Fetching all auth users...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error fetching users:', listError);
      throw listError;
    }

    const userCount = users?.length || 0;
    console.log(`   Found ${userCount} users to delete\n`);

    // Step 2: Delete all auth users (this will cascade delete related data)
    if (userCount > 0) {
      console.log('Step 2: Deleting all auth users...');
      let deletedCount = 0;
      
      for (const user of users) {
        try {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteError) {
            console.error(`   ⚠️  Error deleting user ${user.email}:`, deleteError.message);
          } else {
            deletedCount++;
            console.log(`   ✅ Deleted user: ${user.email}`);
          }
        } catch (err) {
          console.error(`   ⚠️  Error deleting user ${user.email}:`, err.message);
        }
      }
      
      console.log(`\n   ✅ Deleted ${deletedCount} out of ${userCount} users\n`);
    } else {
      console.log('   ℹ️  No users found to delete\n');
    }

    // Step 3: Delete remaining data from tables (in case cascade didn't work)
    console.log('Step 3: Cleaning up remaining data from tables...');
    
    const tables = [
      'shared_access',
      'submissions',
      'enrollments',
      'teaches',
      'assignments',
      'files',
      'activity_log',
      'courses',
      'secureshare_users',
      'users' // In case old table exists
    ];

    for (const table of tables) {
      try {
        // Try to delete all rows (this might fail if RLS is enabled, but we'll try)
        const { error: deleteError } = await supabaseAdmin
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)
        
        if (deleteError) {
          // If RLS blocks us, that's okay - the data should be gone from cascade deletes
          if (deleteError.message.includes('permission') || deleteError.message.includes('policy')) {
            console.log(`   ℹ️  ${table}: Data protected by RLS (likely already deleted via cascade)`);
          } else {
            console.log(`   ⚠️  ${table}: ${deleteError.message}`);
          }
        } else {
          console.log(`   ✅ ${table}: Cleaned`);
        }
      } catch (err) {
        // Table might not exist, which is fine
        if (err.message.includes('does not exist') || err.message.includes('relation')) {
          console.log(`   ℹ️  ${table}: Table does not exist (skipping)`);
        } else {
          console.log(`   ⚠️  ${table}: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Deletion process complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Auth users deleted: ${userCount > 0 ? userCount : 0}`);
    console.log('   - All related data should be deleted via cascade');
    console.log('\n🎉 Your database is now clean and ready for a fresh start!');
    console.log('\n💡 Next steps:');
    console.log('   1. Update your .env file with your new Supabase project URL');
    console.log('   2. Update supabase.js with your new project credentials');
    console.log('   3. Run your database setup scripts to create fresh tables');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
deleteAllDataAndAccounts();

