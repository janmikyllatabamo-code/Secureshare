/**
 * Complete admin user creation via Supabase Admin API and MCP
 */

const { createClient } = require('@supabase/supabase-js');
const SUPABASE_PAT = 'sbp_7f6db6fa466646b3cac82647214c9a3a4db72eac';
const PROJECT_REF = 'vlxkhqvsvfjjhathgakp';

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

const ADMIN_EMAIL = 'janmikyllatabamo4165@gmail.com';
const ADMIN_PASSWORD = '123456';

async function createAdminComplete() {
  try {
    console.log('🚀 Creating admin user (complete setup)...');
    console.log('');
    
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === ADMIN_EMAIL);
    
    let userId;
    
    if (existingUser) {
      console.log('✅ User exists in auth.users');
      userId = existingUser.id;
      
      // Update password and metadata
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User',
          role: 'Admin'
        }
      });
      console.log('✅ User updated');
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin User',
          role: 'Admin'
        }
      });

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return;
      }

      userId = newUser.user.id;
      console.log('✅ User created in auth.users');
      console.log(`   User ID: ${userId}`);
    }

    // Now insert profile via SQL using MCP
    console.log('');
    console.log('📝 Creating profile in secureshare_users via MCP...');
    
    const sql = `
      INSERT INTO secureshare_users (user_id, email, full_name, role)
      VALUES ('${userId}', '${ADMIN_EMAIL}', 'Admin User', 'Admin')
      ON CONFLICT (user_id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          updated_at = NOW();
      
      SELECT user_id, email, full_name, role
      FROM secureshare_users
      WHERE user_id = '${userId}';
    `;
    
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

    const result = await response.json();
    
    if (response.ok && result[0] && result[0].length > 0) {
      console.log('✅ Admin profile created!');
      console.log(`   ${result[0][0].email} (${result[0][0].role})`);
      console.log('');
      console.log('✅ Admin user setup complete!');
      console.log('');
      console.log('Login credentials:');
      console.log(`  Email: ${ADMIN_EMAIL}`);
      console.log(`  Password: ${ADMIN_PASSWORD}`);
    } else {
      console.log('⚠️  Could not create profile:', result);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminComplete();


