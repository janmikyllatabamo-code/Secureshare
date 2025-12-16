# Storage Bucket Setup Instructions

## Problem
You're getting a "Bucket not found" error when trying to upload files.

## Solution
You need to create a storage bucket named `files` in your Supabase project.

## Method 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard

2. **Open Storage**
   - Click on "Storage" in the left sidebar

3. **Create New Bucket**
   - Click the "New bucket" button (usually at the top right)
   - Enter bucket name: `files` (exactly as shown, lowercase)
   - Set visibility to **Private** (not public)
   - Optionally set file size limit (e.g., 50MB)
   - Click "Create bucket"

4. **Set Up Policies (via SQL)**
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the contents of `CREATE_STORAGE_BUCKET.sql`
   - Click "Run" to execute

## Method 2: Via SQL Only (Alternative)

If you have the necessary permissions:

1. **Go to SQL Editor**
   - Navigate to SQL Editor in Supabase Dashboard

2. **Run the SQL Script**
   - Copy and paste the contents of `CREATE_STORAGE_BUCKET_ALTERNATIVE.sql`
   - Click "Run" to execute
   - If you get an error about permissions, use Method 1 instead

## What the Policies Do

The storage policies allow:
- ✅ Users to upload files to their own folder (`{user_id}/filename`)
- ✅ Users to view their own files
- ✅ Users to update their own files
- ✅ Users to delete their own files
- ✅ Users to view files shared with them
- ✅ Admins to manage all files

## Verification

After setup, try uploading a file again. The "Bucket not found" error should be resolved.

## Troubleshooting

If you still get errors:

1. **Check bucket name**: Make sure it's exactly `files` (lowercase, no spaces)
2. **Check bucket visibility**: Should be "Private"
3. **Check policies**: Make sure the SQL policies were executed successfully
4. **Check user authentication**: Make sure you're logged in as a teacher/student/admin

