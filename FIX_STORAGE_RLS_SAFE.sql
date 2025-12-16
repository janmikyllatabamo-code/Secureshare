-- ============================================================================
-- Safe Fix for File Upload RLS Issues (No Table Alterations)
-- This version only creates policies, no ALTER TABLE commands
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Storage Policies (ONLY POLICIES - No table alterations)
-- ============================================================================

-- Drop existing storage policies (safe to run)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view shared files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to files bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;

-- Create storage policies (these should work without owner permissions)
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

-- Policy: Users can view their own files
CREATE POLICY "Authenticated users can view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'files'
    AND (
        -- User's own files
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
-- PART 2: Fix files table RLS policies
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
-- PART 3: Ensure insert_file function exists and has proper permissions
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
-- VERIFICATION
-- ============================================================================
-- After running this, test by uploading a file.
-- 
-- To verify policies were created:
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%files%';
--
-- To verify insert_file function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'insert_file';
-- ============================================================================

