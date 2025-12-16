/**
 * Script to create admin user in Supabase
 * Run with: node create_admin_user.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with service role key (admin access)
const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

// Admin user credentials
const ADMIN_EMAIL = 'janmikyllatabamo4165@gmail.com';
const ADMIN_PASSWORD = '123456';
const ADMIN_FULL_NAME = 'Admin User';

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    console.log(`Email: ${ADMIN_EMAIL}`);
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(ADMIN_EMAIL);
    
    if (existingUser?.user) {
      console.log('⚠️  User already exists. Updating user...');
      
      // Update user password if needed
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.user.id,
        {
          password: ADMIN_PASSWORD,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: ADMIN_FULL_NAME,
            role: 'Admin'
          }
        }
      );

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        throw updateError;
      }

      console.log('✅ User updated successfully!');
      
      // Update or create profile in secureshare_users
      const { error: profileError } = await supabaseAdmin
        .from('secureshare_users')
        .upsert({
          user_id: existingUser.user.id,
          email: ADMIN_EMAIL,
          full_name: ADMIN_FULL_NAME,
          role: 'Admin'
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        throw profileError;
      }

      console.log('✅ Admin profile updated in secureshare_users table!');
      console.log('✅ Admin user is ready to use!');
      return;
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email so they can login immediately
      user_metadata: {
        full_name: ADMIN_FULL_NAME,
        role: 'Admin'
      }
    });

    if (createError) {
      console.error('❌ Error creating user:', createError);
      throw createError;
    }

    if (!newUser?.user) {
      throw new Error('Failed to create user - no user data returned');
    }

    console.log('✅ User created in auth.users!');
    console.log(`   User ID: ${newUser.user.id}`);

    // Create profile in secureshare_users table
    const { error: profileError } = await supabaseAdmin
      .from('secureshare_users')
      .insert({
        user_id: newUser.user.id,
        email: ADMIN_EMAIL,
        full_name: ADMIN_FULL_NAME,
        role: 'Admin'
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw profileError;
    }

    console.log('✅ Admin profile created in secureshare_users table!');
    console.log('');
    console.log('🎉 Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Role: Admin`);
    console.log('');
    console.log('✅ You can now log in and will be redirected to /admin-dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();






