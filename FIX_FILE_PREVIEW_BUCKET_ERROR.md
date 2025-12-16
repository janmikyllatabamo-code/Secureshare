# Fix: "Bucket not found" Error in File Preview

## Problem
When trying to preview files (especially PDFs), users were seeing a "Bucket not found" error (404).

## Root Cause
1. **Using `getPublicUrl()` for private bucket**: The code was using `getPublicUrl()` which only works for public buckets, but the `files` bucket is set to private.
2. **Missing signed URL generation**: Private buckets require signed URLs for access, which expire after a set time.
3. **No error handling**: The preview modal didn't handle bucket errors gracefully.

## Solution Implemented

### 1. Updated File URL Generation (`FilesPage.jsx`)
- Changed from synchronous `getPublicUrl()` to async signed URL generation
- Now generates signed URLs for all files when loading the file list
- Falls back to public URL if bucket is public
- Handles errors gracefully

### 2. Enhanced File Preview Modal (`FilePreviewModal.jsx`)
- Added proper URL generation on mount
- Uses `getFileUrl()` utility which handles both signed and public URLs
- Added loading states and error handling
- Shows helpful error messages with retry option
- Generates signed URLs on-demand if URL is missing

### 3. Improved Preview Function (`FilesPage.jsx`)
- `previewFileNow()` now generates signed URLs if missing
- Passes file path and bucket to preview modal for on-demand URL generation
- Better error handling

## Files Changed

1. **`my-app/src/components/sidebar/FilesPage.jsx`**
   - Updated `fetchFiles()` to generate signed URLs asynchronously
   - Updated `previewFileNow()` to generate URLs on-demand

2. **`my-app/src/components/portal/FilePreviewModal.jsx`**
   - Added URL generation with `useEffect`
   - Added loading and error states
   - Improved error messages
   - Added retry functionality

3. **`ENSURE_STORAGE_BUCKET_EXISTS.sql`** (New)
   - SQL script to ensure the `files` bucket exists
   - Can be run in Supabase Dashboard SQL Editor

## How to Fix

### Step 1: Ensure Bucket Exists
Run this SQL in Supabase Dashboard SQL Editor:

```sql
-- See ENSURE_STORAGE_BUCKET_EXISTS.sql for full script
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'files',
    'files',
    false, -- Private bucket
    524288000, -- 500MB
    NULL
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
```

**OR** create it manually:
1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Name: `files` (exactly, lowercase)
4. Public: **OFF** (Private)
5. File size limit: **500 MB**
6. Allowed MIME types: Leave empty
7. Click **"Create bucket"**

### Step 2: Verify Storage Policies
Make sure storage RLS policies are set up. Run:
- `CREATE_STORAGE_POLICIES_ONLY.sql` in Supabase Dashboard SQL Editor

### Step 3: Test File Preview
1. Upload a test file (PDF, image, etc.)
2. Click on the file to preview
3. File should load without "Bucket not found" error

## How It Works Now

1. **File List Loading**:
   - When files are fetched, signed URLs are generated for each file
   - URLs expire after 1 hour (3600 seconds)
   - Folders don't need URLs

2. **File Preview**:
   - If URL exists and is valid, use it
   - If URL is missing or expired, generate a new signed URL
   - Show loading state while generating URL
   - Show error with retry option if URL generation fails

3. **Error Handling**:
   - Clear error messages
   - Retry button to regenerate URL
   - Fallback to public URL if bucket is public
   - Helpful troubleshooting tips

## Supported File Types for Preview

- **Images**: PNG, JPG, JPEG, GIF, WEBP, SVG
- **PDFs**: Full PDF viewer with toolbar
- **Text**: TXT files
- **Other**: Download option available

## Testing Checklist

- [ ] Bucket `files` exists in Supabase Storage
- [ ] Storage policies are configured
- [ ] Upload a test file
- [ ] Preview PDF file - should load in iframe
- [ ] Preview image file - should display image
- [ ] Preview text file - should display text
- [ ] Download button works
- [ ] "Open in new tab" works
- [ ] Error handling works (try with invalid file)

## Troubleshooting

### Issue: Still seeing "Bucket not found"
**Solution:**
1. Verify bucket exists: Dashboard → Storage → Check for `files` bucket
2. Run `ENSURE_STORAGE_BUCKET_EXISTS.sql`
3. Check browser console for specific error
4. Verify storage policies are set up

### Issue: "Permission denied" error
**Solution:**
1. Run `CREATE_STORAGE_POLICIES_ONLY.sql` in SQL Editor
2. Verify user is authenticated
3. Check RLS policies allow user to access their files

### Issue: URLs expire too quickly
**Solution:**
- Signed URLs expire after 1 hour by default
- The code regenerates URLs automatically when needed
- If you need longer expiration, modify the `expiresIn` parameter (max 7 days)

### Issue: Preview not working for specific file type
**Solution:**
- Check if file type is in supported list
- For unsupported types, download option is available
- Check browser console for specific errors

## Technical Details

### Signed URLs
- **Purpose**: Provide secure, time-limited access to private bucket files
- **Expiration**: 1 hour (3600 seconds) by default
- **Format**: `https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?token=[token]&expires=[timestamp]`

### Public URLs
- **Purpose**: Direct access to public bucket files
- **No expiration**: Always accessible
- **Format**: `https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]`

### URL Generation Priority
1. Try signed URL first (works for both public and private buckets)
2. Fallback to public URL if signed URL fails
3. Show error if both fail

## Next Steps

After fixing:
1. ✅ All files should preview correctly
2. ✅ No more "Bucket not found" errors
3. ✅ Better error messages if something goes wrong
4. ✅ Automatic URL regeneration when needed

**You're all set!** File previews should now work correctly. 🎉

