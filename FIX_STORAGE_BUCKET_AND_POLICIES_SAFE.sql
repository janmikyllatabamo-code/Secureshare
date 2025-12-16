-- ============================================================================
-- Fix Storage Bucket and Policies - SAFE VERSION (No storage.objects ALTER)
-- This version only modifies tables we have permission to change
-- ============================================================================

-- ============================================================================
-- PART 1: Ensure Storage Bucket Exists (if you have permission)
-- ============================================================================

-- Insert bucket into storage.buckets table if it doesn't exist
-- NOTE: If this fails, create the bucket via Supabase Dashboard:
-- 1. Go to Storage > New bucket
-- 2. Name: "files" (exactly, lowercase)
-- 3. Set to "Private" (not public)
-- 4. Click "Create bucket"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false, -- Private bucket (more secure)
    524288000, -- 500MB file size limit (in bytes) - increased for large files
    NULL -- Allow all file types
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- PART 2: Fix files table RLS policies (This should work)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
DROP POLICY IF EXISTS "Users can view shared files" ON public.files;

-- Recreate policies
CREATE POLICY "Users can view their own files"
    ON public.files FOR SELECT
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can insert their own files"
    ON public.files FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can update their own files"
    ON public.files FOR UPDATE
    USING (user_id = auth.uid() OR is_admin_user())
    WITH CHECK (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "Users can delete their own files"
    ON public.files FOR DELETE
    USING (user_id = auth.uid() OR is_admin_user());

-- Fixed: Use secureshare_users instead of auth.users
CREATE POLICY "Users can view shared files"
    ON public.files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shared_access
            WHERE shared_access.file_id = files.file_id
            AND (
                shared_access.shared_with_id = auth.uid()
                OR shared_access.shared_with_email = (
                    SELECT email FROM public.secureshare_users 
                    WHERE user_id = auth.uid()
                )
            )
        )
        OR is_admin_user()
    );

-- ============================================================================
-- PART 3: Ensure insert_file function exists
-- ============================================================================

CREATE OR REPLACE FUNCTION public.insert_file(
    p_user_id UUID,
    p_file_name VARCHAR,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_file_type VARCHAR,
    p_folder_path TEXT,
    p_bucket VARCHAR,
    p_is_folder BOOLEAN,
    p_is_trashed BOOLEAN,
    p_is_shared BOOLEAN
)
RETURNS TABLE (
    file_id UUID,
    user_id UUID,
    file_name VARCHAR,
    file_path TEXT,
    file_size BIGINT,
    file_type VARCHAR,
    bucket VARCHAR,
    folder_path TEXT,
    is_folder BOOLEAN,
    is_trashed BOOLEAN,
    is_shared BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.files (
        user_id, file_name, file_path, file_size, file_type,
        folder_path, bucket, is_folder, is_trashed, is_shared
    )
    VALUES (
        p_user_id, p_file_name, p_file_path, p_file_size, p_file_type,
        p_folder_path, p_bucket, p_is_folder, p_is_trashed, p_is_shared
    )
    RETURNING 
        files.file_id, files.user_id, files.file_name, files.file_path,
        files.file_size, files.file_type, files.bucket, files.folder_path,
        files.is_folder, files.is_trashed, files.is_shared,
        files.created_at, files.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.insert_file TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_file TO anon;

-- ============================================================================
-- PART 4: Storage Policies
-- ============================================================================
-- IMPORTANT: Storage policies on storage.objects may require special permissions.
-- If you get "must be owner" errors, you have two options:
-- 
-- OPTION 1: Run this section separately with service role permissions
-- OPTION 2: Create policies via Dashboard (see CREATE_STORAGE_POLICIES_VIA_DASHBOARD.md)
--
-- Uncomment the section below if you have the necessary permissions,
-- or run it separately in a SQL Editor session with elevated privileges.

/*
-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view shared files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;

-- Policy: Users can upload files to their own folder
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

-- Policy: Users can view their own files and files shared with them
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
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script:

-- 1. Check if bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'files';

-- 2. Check files table policies (should work):
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'files';

-- 3. Check storage policies (may not exist if permission denied):
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%files%';
-- ============================================================================

-- ============================================================================
-- IF STORAGE POLICIES FAILED:
-- ============================================================================
-- If you got permission errors on storage policies, you have two options:
--
-- OPTION 1: Create via Supabase Dashboard
-- 1. Go to Storage > Policies
-- 2. Select the 'files' bucket
-- 3. Click "New Policy"
-- 4. Use the policy definitions from FIX_STORAGE_POLICIES_VIA_DASHBOARD.md
--
-- OPTION 2: Use Supabase Management API (with service role key)
-- See: CREATE_STORAGE_POLICIES_VIA_API.js
-- ============================================================================

