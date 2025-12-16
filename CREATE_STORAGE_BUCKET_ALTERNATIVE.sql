-- ============================================================================
-- Alternative: Create Storage Bucket via SQL (if you have permissions)
-- This is an alternative approach if the first script doesn't work
-- ============================================================================

-- Try to create the bucket directly
DO $$
BEGIN
    -- Check if bucket exists
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'files') THEN
        -- Insert bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'files',
            'files',
            false,
            52428800, -- 50MB
            NULL
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If this fails, you need to create the bucket via Dashboard
        RAISE NOTICE 'Could not create bucket via SQL. Please create it via Supabase Dashboard: Storage > New bucket > Name: "files" > Private';
END $$;

-- ============================================================================
-- Storage Policies (same as CREATE_STORAGE_BUCKET.sql)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all files" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'files'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.shared_access sa
            JOIN public.files f ON f.file_id = sa.file_id
            WHERE f.file_path = name
            AND (
                sa.shared_with_id = auth.uid()
                OR sa.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
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
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
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

