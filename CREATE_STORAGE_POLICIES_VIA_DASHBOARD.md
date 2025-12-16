# How to Create Storage Policies via Supabase Dashboard

If you got permission errors when trying to create storage policies via SQL, follow these steps to create them via the Dashboard:

## Step 1: Navigate to Storage Policies

1. Go to your Supabase Dashboard
2. Click on **Storage** in the left sidebar
3. Click on the **Policies** tab (or select your `files` bucket and go to Policies)

## Step 2: Create Each Policy

For each policy below, click **"New Policy"** and fill in the details:

### Policy 1: Authenticated users can upload to files bucket

- **Policy Name**: `Authenticated users can upload to files bucket`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **USING expression**: (leave empty)
- **WITH CHECK expression**:
```sql
bucket_id = 'files'
AND (
    name LIKE (auth.uid()::text || '/%')
    OR split_part(name, '/', 1) = auth.uid()::text
)
```

### Policy 2: Authenticated users can view files

- **Policy Name**: `Authenticated users can view files`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
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
```
- **WITH CHECK expression**: (leave empty)

### Policy 3: Users can update their own files

- **Policy Name**: `Users can update their own files`
- **Allowed Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'files'
AND (name LIKE (auth.uid()::text || '/%') OR split_part(name, '/', 1) = auth.uid()::text)
```
- **WITH CHECK expression**:
```sql
bucket_id = 'files'
AND (name LIKE (auth.uid()::text || '/%') OR split_part(name, '/', 1) = auth.uid()::text)
```

### Policy 4: Users can delete their own files

- **Policy Name**: `Users can delete their own files`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'files'
AND (name LIKE (auth.uid()::text || '/%') OR split_part(name, '/', 1) = auth.uid()::text)
```
- **WITH CHECK expression**: (leave empty)

### Policy 5: Admins can manage all files

- **Policy Name**: `Admins can manage all files`
- **Allowed Operation**: `ALL`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'files'
AND EXISTS (
    SELECT 1 FROM public.secureshare_users
    WHERE user_id = auth.uid()
    AND role = 'Admin'
)
```
- **WITH CHECK expression**:
```sql
bucket_id = 'files'
AND EXISTS (
    SELECT 1 FROM public.secureshare_users
    WHERE user_id = auth.uid()
    AND role = 'Admin'
)
```

## Step 3: Verify Policies

After creating all policies, verify they exist:

1. Go to Storage > Policies
2. You should see all 5 policies listed
3. Test by uploading a file from your application

## Notes

- Make sure the `files` bucket exists before creating policies
- If you get errors about `secureshare_users` table, make sure that table exists
- The policies use `auth.uid()` which requires the user to be authenticated

