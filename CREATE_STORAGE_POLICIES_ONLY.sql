-- ============================================================================
-- Storage Policies for 'files' Bucket - Run This Separately
-- ============================================================================
-- IMPORTANT: This file requires owner/superuser permissions on storage.objects
-- 
-- If you get "must be owner" errors when running FIX_STORAGE_BUCKET_AND_POLICIES_SAFE.sql,
-- run this file separately in the Supabase SQL Editor.
--
-- The SQL Editor in Supabase Dashboard should have the necessary permissions.
-- ============================================================================

-- ============================================================================
-- Step 1: Drop existing storage policies (safe to run)
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view shared files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;

-- ============================================================================
-- Step 2: Create Storage Policies for 'files' bucket
-- ============================================================================

-- Policy: Users can upload files to their own folder
-- Files are stored as: {user_id}/filename or {user_id}/folder/filename
CREATE POLICY "Authenticated users can upload to files bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'files'
    AND (
        -- Path must start with user's UUID
        name LIKE (auth.uid()::text || '/%')
        -- OR first part of path is user's UUID (handles nested folders)
        OR split_part(name, '/', 1) = auth.uid()::text
    )
);

-- Policy: Users can view their own files and files shared with them
-- IMPORTANT: This allows authenticated users to access files via getPublicUrl() or signed URLs
CREATE POLICY "Authenticated users can view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'files'
    AND (
        -- User's own files (path starts with their user_id)
        name LIKE (auth.uid()::text || '/%')
        OR split_part(name, '/', 1) = auth.uid()::text
        -- OR files shared with them (by UUID or email from secureshare_users)
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

-- Policy: Users can update their own files
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

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'files'
    AND (name LIKE (auth.uid()::text || '/%') OR split_part(name, '/', 1) = auth.uid()::text)
);

-- Policy: Admins can manage all files
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, verify the policies were created:
-- 
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%files%';
--
-- You should see 5 policies:
-- 1. Authenticated users can upload to files bucket
-- 2. Authenticated users can view files
-- 3. Users can update their own files
-- 4. Users can delete their own files
-- 5. Admins can manage all files
-- ============================================================================
