# How to Execute CREATE_STORAGE_POLICIES_ONLY.sql

Since automated execution requires special permissions, here's how to execute the storage policies SQL:

## Method 1: Via Supabase Dashboard SQL Editor (Recommended)

1. **Open Supabase Dashboard SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy the SQL:**
   - Open `CREATE_STORAGE_POLICIES_ONLY.sql` in your editor
   - Copy all contents (lines 1-134)

3. **Paste and Execute:**
   - Paste the SQL into the SQL Editor
   - Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify:**
   - You should see "Success. No rows returned" or similar
   - Run this verification query:
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%files%';
   ```
   - You should see 5 policies listed

## Method 2: Via Supabase CLI (If Installed)

If you have Supabase CLI installed and linked to your project:

```bash
supabase db execute --file CREATE_STORAGE_POLICIES_ONLY.sql --project-ref vlxkhqvsvfjjhathgakp
```

## Method 3: Via psql (If You Have Database Access)

If you have the database password:

```bash
psql "postgresql://postgres.vlxkhqvsvfjjhathgakp:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f CREATE_STORAGE_POLICIES_ONLY.sql
```

## What This SQL Does

This SQL file creates 5 storage policies for the `files` bucket:

1. **Authenticated users can upload to files bucket** - Allows users to upload files to their own folder
2. **Authenticated users can view files** - Allows users to view their own files and files shared with them
3. **Users can update their own files** - Allows users to update their own files
4. **Users can delete their own files** - Allows users to delete their own files
5. **Admins can manage all files** - Allows admin users to manage all files

## Troubleshooting

### Error: "must be owner of table objects"
- This means you don't have the necessary permissions
- The SQL Editor in Supabase Dashboard should have the right permissions
- If it still fails, you may need to contact Supabase support

### Error: "bucket not found"
- Make sure the `files` bucket exists first
- Run `FIX_STORAGE_BUCKET_AND_POLICIES_SAFE.sql` first to create the bucket

### Error: "relation secureshare_users does not exist"
- Make sure your database tables are set up
- Run `CREATE_ALL_TABLES.sql` first if needed

## Verification After Execution

Run this query to verify all policies were created:

```sql
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%files%'
ORDER BY policyname;
```

You should see 5 policies:
- Authenticated users can upload to files bucket
- Authenticated users can view files
- Users can update their own files
- Users can delete their own files
- Admins can manage all files

