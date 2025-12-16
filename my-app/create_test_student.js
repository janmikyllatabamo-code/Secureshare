/**
 * Create test student user via Supabase Admin API
 * Email: studenttesting@gmail.com
 * Password: 123456
 * Role: student
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   REACT_APP_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   REACT_APP_SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestStudent() {
  try {
    const email = 'studenttesting@gmail.com';
    const password = '123456';
    const role = 'Student'; // Note: Capital S - check constraint likely requires exact case

    console.log('📧 Creating test student user...');
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);

    // Step 1: Check if user exists, create if not
    console.log('\n🔐 Step 1: Checking/Creating user in Supabase Auth...');
    let userId = null;
    
    // First, try to get existing user
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError && users) {
      const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Found existing user in Auth:', userId);
        
        // Update password if needed
        console.log('   Updating password...');
        const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: password
        });
        if (updatePasswordError) {
          console.warn('⚠️  Could not update password:', updatePasswordError.message);
        } else {
          console.log('✅ Password updated');
        }
      }
    }
    
    // If user doesn't exist, create it
    if (!userId) {
      console.log('   Creating new user...');
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          role: role
        }
      });

      if (authError) {
        console.error('❌ Error creating user in Auth:', authError);
        process.exit(1);
      }
      
      userId = authUser.user.id;
      console.log('✅ User created in Auth:', userId);
    }
    if (!userId) {
      console.error('❌ No user ID found');
      process.exit(1);
    }

    // Step 2: Check if profile already exists
    console.log('\n👤 Step 2: Checking if profile exists in secureshare_users...');
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('secureshare_users')
      .select('user_id, email, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && !checkError.message?.includes('does not exist')) {
      console.error('❌ Error checking profile:', checkError);
      process.exit(1);
    }

    if (existingProfile) {
      console.log('⚠️  Profile already exists:', existingProfile);
      console.log('   Updating role to student...');
      
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from('secureshare_users')
        .update({
          role: role,
          email: email
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        process.exit(1);
      }
      console.log('✅ Profile updated successfully!');
    } else {
      // Step 3: Create profile in secureshare_users
      console.log('\n📝 Step 3: Creating profile in secureshare_users...');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('secureshare_users')
        .insert({
          user_id: userId,
          email: email,
          full_name: 'Test Student',
          role: role
        })
        .select('user_id, email, role, full_name')
        .single();

      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
        console.error('   Details:', profileError.message);
        process.exit(1);
      }

      console.log('✅ Profile created successfully!');
      console.log('   Profile data:', profile);
    }

    console.log('\n🎉 Test student user created successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`   User ID: ${userId}`);
    console.log('\n✅ You can now log in with these credentials to test the student dashboard.');

  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

createTestStudent();

