/**
 * Create Storage Policies via Supabase Management API
 * This uses the service role key which has the necessary permissions
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vlxkhqvsvfjjhathgakp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA';

async function createStoragePolicies() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🚀 Creating storage policies via Management API...\n');

    // SQL statements to create policies
    const policies = [
      {
        name: 'Drop existing policies',
        sql: `
          DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
          DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
          DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
          DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
          DROP POLICY IF EXISTS "Users can view shared files" ON storage.objects;
          DROP POLICY IF EXISTS "Admins can manage all files" ON storage.objects;
          DROP POLICY IF EXISTS "Authenticated users can upload to files bucket" ON storage.objects;
          DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
        `
      },
      {
        name: 'Authenticated users can upload to files bucket',
        sql: `
          CREATE POLICY "Authenticated users can upload to files bucket"
          ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (
              bucket_id = 'files'
              AND (
                  name LIKE (auth.uid()::text || '/%')
                  OR split_part(name, '/', 1) = auth.uid()::text
              )
          );
        `
      },
      {
        name: 'Authenticated users can view files',
        sql: `
          CREATE POLICY "Authenticated users can view files"
          ON storage.objects
          FOR SELECT
          TO authenticated
          USING (
              bucket_id = 'files'
              AND (
                  name LIKE (auth.uid()::text || '/%')
                  OR split_part(name, '/', 1) = auth.uid()::text
                  OR EXISTS (
                      SELECT 1 FROM public.shared_access sa
                      JOIN public.files f ON f.file_id = sa.file_id
                      WHERE f.file_path = name
                      AND (
                          sa.shared_with_id = auth.uid()
                          OR sa.shared_with_email = (
                              SELECT email FROM public.secureshare_users 
                              WHERE user_id = auth.uid()
                          )
                      )
                  )
              )
          );
        `
      },
      {
        name: 'Users can update their own files',
        sql: `
          CREATE POLICY "Users can update their own files"
          ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (
              bucket_id = 'files'
              AND (name LIKE (auth.uid()::text || '/%') OR split_part(name, '/', 1) = auth.uid()::text)
          )
          WITH CHECK (
              bucket_id = 'files'
              AND (name LIKE (auth.uid()::text || '/%') OR split_part(name, '/', 1) = auth.uid()::text)
          );
        `
      },
      {
        name: 'Users can delete their own files',
        sql: `
          CREATE POLICY "Users can delete their own files"
          ON storage.objects
          FOR DELETE
          TO authenticated
          USING (
              bucket_id = 'files'
              AND (name LIKE (auth.uid()::text || '/%') OR split_part(name, '/', 1) = auth.uid()::text)
          );
        `
      },
      {
        name: 'Admins can manage all files',
        sql: `
          CREATE POLICY "Admins can manage all files"
          ON storage.objects
          FOR ALL
          TO authenticated
          USING (
              bucket_id = 'files'
              AND EXISTS (
                  SELECT 1 FROM public.secureshare_users
                  WHERE user_id = auth.uid()
                  AND role = 'Admin'
              )
          )
          WITH CHECK (
              bucket_id = 'files'
              AND EXISTS (
                  SELECT 1 FROM public.secureshare_users
                  WHERE user_id = auth.uid()
                  AND role = 'Admin'
              )
          );
        `
      }
    ];

    // Execute each policy
    for (const policy of policies) {
      console.log(`📝 ${policy.name}...`);
      
      // Use RPC to execute SQL (if you have an exec_sql function)
      // Otherwise, we'll need to use the REST API directly
      try {
        // Try using the REST API to execute SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql: policy.sql })
        });

        if (response.ok) {
          console.log(`   ✅ Success`);
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️  Response: ${response.status} - ${errorText}`);
          console.log(`   💡 You may need to run this SQL manually in the Dashboard`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
        console.log(`   💡 You may need to run this SQL manually in the Dashboard`);
      }
    }

    console.log('\n✅ Storage policies setup complete!');
    console.log('\n📋 If some policies failed, you can:');
    console.log('   1. Run FIX_STORAGE_BUCKET_AND_POLICIES_SAFE.sql in SQL Editor');
    console.log('   2. Or create policies manually via Dashboard (see CREATE_STORAGE_POLICIES_VIA_DASHBOARD.md)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Run the SQL directly in Supabase Dashboard SQL Editor');
  }
}

createStoragePolicies();

