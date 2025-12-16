# Simple Storage Setup Guide

## The Error You Got
```
ERROR: 42501: must be owner of table objects
```

This happens because you can't modify `storage.objects` directly via SQL. You need to create the bucket via Dashboard first.

## Solution (2 Steps)

### Step 1: Create Bucket via Dashboard (REQUIRED)

1. **Go to Supabase Dashboard**
   - Open your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar

3. **Create New Bucket**
   - Click the **"New bucket"** button (top right)
   - **Bucket name**: `files` (exactly, lowercase, no spaces)
   - **Public bucket**: Leave this **UNCHECKED** (make it Private)
   - **File size limit**: Optional (e.g., 50MB)
   - Click **"Create bucket"**

### Step 2: Run SQL Policies

1. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar

2. **Copy and Run**
   - Copy the **entire contents** of `CREATE_STORAGE_POLICIES_ONLY.sql`
   - Paste into SQL Editor
   - Click **"Run"** button

## That's It!

After these 2 steps, file uploads should work. The bucket will exist and have the correct policies.

## Verify It Worked

Try uploading a file again. The "Bucket not found" error should be gone.

## Troubleshooting

**Still getting "Bucket not found"?**
- Double-check the bucket name is exactly `files` (lowercase)
- Make sure you created it in the Dashboard
- Refresh your browser and try again

**Getting permission errors?**
- Make sure you're logged in as an admin or have proper permissions
- The policies should work for all authenticated users

