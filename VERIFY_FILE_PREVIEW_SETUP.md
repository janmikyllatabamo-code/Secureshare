# Verify File Preview Setup - Status Check

## ✅ Bucket Status: CONFIGURED

Your `files` bucket is properly configured:
- **ID**: `files`
- **Name**: `files`
- **Public**: `false` (Private - requires signed URLs)
- **File Size Limit**: 500 MB (524288000 bytes)
- **Allowed MIME Types**: All (NULL)

## Next Steps

### Step 1: Verify Storage Policies (Important!)

The bucket exists, but you need to ensure storage RLS policies are set up so users can access their files.

**Run this SQL in Supabase Dashboard SQL Editor:**

Open `CREATE_STORAGE_POLICIES_ONLY.sql` and run it, OR run this quick check:

```sql
-- Check if storage policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

**If no policies are returned**, you need to run `CREATE_STORAGE_POLICIES_ONLY.sql`.

### Step 2: Test File Preview

1. **Upload a test file:**
   - Go to your app: `http://localhost:3000/portal/files`
   - Click "Upload"
   - Upload a PDF or image file

2. **Preview the file:**
   - Click on the uploaded file
   - The preview modal should open
   - File should load without "Bucket not found" error

3. **Test different file types:**
   - PDF files (should show in iframe)
   - Images (PNG, JPG - should display)
   - Text files (TXT - should display)

### Step 3: Check Browser Console

If preview still doesn't work:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to preview a file
4. Look for any errors
5. Check Network tab for failed requests

## Common Issues After Bucket Creation

### Issue: "Permission denied" when previewing
**Solution:** Run `CREATE_STORAGE_POLICIES_ONLY.sql` to set up RLS policies

### Issue: "Bucket not found" still appears
**Solution:** 
1. Hard refresh the browser (Ctrl+F5)
2. Clear browser cache
3. Check that bucket name is exactly `files` (lowercase)

### Issue: Files upload but can't preview
**Solution:**
1. Verify storage policies allow SELECT on storage.objects
2. Check that file paths are correct in database
3. Verify user is authenticated

## Verification Checklist

- [x] Bucket `files` exists (✅ Confirmed from your screenshot)
- [ ] Storage RLS policies are set up
- [ ] Test file uploaded successfully
- [ ] File preview works (no "Bucket not found" error)
- [ ] PDF preview works
- [ ] Image preview works
- [ ] Download button works
- [ ] "Open in new tab" works

## What's Fixed

✅ **Bucket exists** - Confirmed from your SQL execution
✅ **Code updated** - File preview now uses signed URLs
✅ **Error handling** - Better error messages and retry options

## Still Need to Do

1. **Set up storage policies** (if not already done)
2. **Test file preview** in your app
3. **Verify all file types work**

## Quick Test

Try this in your app right now:
1. Go to Files page
2. Upload a test PDF
3. Click on it to preview
4. Should work! 🎉

If you still see errors, check:
- Browser console for specific error messages
- Network tab for failed requests
- Verify storage policies are set up

---

**Status**: Bucket is ready! Just need to verify storage policies and test previews. 🚀

