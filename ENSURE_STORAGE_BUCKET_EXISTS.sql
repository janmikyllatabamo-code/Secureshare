-- ============================================================================
-- Ensure Storage Bucket Exists for File Previews
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- This script ensures the 'files' bucket exists and is properly configured
-- If the bucket doesn't exist, it will be created
-- If it exists, it will be updated with correct settings

-- Insert or update the 'files' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false, -- Private bucket (more secure - requires signed URLs)
    524288000, -- 500MB file size limit (in bytes)
    NULL -- Allow all file types
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Verify the bucket was created/updated
SELECT 
    id,
    name,
    public,
    file_size_limit,
    created_at,
    updated_at
FROM storage.buckets
WHERE id = 'files';

-- Expected output:
-- id    | name  | public | file_size_limit | created_at          | updated_at
-- files | files | false  | 524288000       | [timestamp]         | [timestamp]

-- ============================================================================
-- NOTE: If you get a permission error, create the bucket manually:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: "files" (exactly, lowercase)
-- 4. Public: OFF (Private)
-- 5. File size limit: 500 MB
-- 6. Allowed MIME types: Leave empty (allows all types)
-- 7. Click "Create bucket"
-- ============================================================================

