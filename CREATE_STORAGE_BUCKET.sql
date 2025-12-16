-- ============================================================================
-- Create Storage Bucket and Policies for SecureShare
-- This script creates the 'files' bucket and sets up RLS policies
-- ============================================================================

-- Note: Storage buckets in Supabase are created via the Storage API or Dashboard
-- However, we can use SQL to create policies once the bucket exists
-- 
-- IMPORTANT: You need to create the bucket first via Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name it "files"
-- 4. Make it PRIVATE (not public)
-- 5. Then run this SQL to set up the policies

-- ============================================================================
-- PART 1: Create Storage Bucket (if it doesn't exist)
-- ============================================================================

-- Insert bucket into storage.buckets table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false, -- Private bucket
    52428800, -- 50MB file size limit (in bytes)
    NULL -- Allow all file types
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2: Drop existing policies (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view shared files" ON storage.objects;

-- ============================================================================
-- PART 3: Enable RLS on storage.objects (if not already enabled)
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: Create Storage Policies for 'files' bucket
-- ============================================================================

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

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

-- Note: If you get an error about storage.buckets not existing or permission denied,
-- you need to create the bucket via Supabase Dashboard first:
-- 
-- Steps to create bucket via Dashboard:
-- 1. Go to your Supabase project Dashboard
-- 2. Click on "Storage" in the left sidebar
-- 3. Click "New bucket" button
-- 4. Enter bucket name: "files"
-- 5. Make sure it's set to "Private" (not public)
-- 6. Click "Create bucket"
-- 7. Then run this SQL script to set up the policies

