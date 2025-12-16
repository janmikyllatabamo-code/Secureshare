/**
 * Storage utility functions for handling file URLs
 * Handles both public and private buckets with proper authentication
 */

import { supabase } from '../lib/supabase'

/**
 * Get a URL for a file in storage
 * For private buckets, uses signed URLs. For public buckets, uses public URLs.
 * @param {string} bucket - The storage bucket name
 * @param {string} filePath - The file path in the bucket
 * @param {number} expiresIn - Expiration time in seconds for signed URLs (default: 3600 = 1 hour)
 * @returns {Promise<string>} The URL to access the file
 */
export async function getFileUrl(bucket, filePath, expiresIn = 3600) {
  if (!bucket || !filePath) {
    console.warn('getFileUrl: Missing bucket or filePath', { bucket, filePath })
    return ''
  }

  try {
    // First, try to get a signed URL (works for both public and private buckets)
    // Signed URLs are more reliable for private buckets and work with RLS policies
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (!signedError && signedData?.signedUrl) {
      return signedData.signedUrl
    }

    // Fallback to public URL if signed URL fails (for public buckets)
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    if (publicData?.publicUrl) {
      return publicData.publicUrl
    }

    console.warn('getFileUrl: Failed to generate URL', { bucket, filePath, signedError })
    return ''
  } catch (error) {
    console.error('getFileUrl: Error generating file URL', error)
    return ''
  }
}

/**
 * Get a public URL for a file (synchronous, no auth required)
 * Use this only for public buckets or when you need a URL immediately
 * @param {string} bucket - The storage bucket name
 * @param {string} filePath - The file path in the bucket
 * @returns {string} The public URL
 */
export function getPublicUrlSync(bucket, filePath) {
  if (!bucket || !filePath) {
    return ''
  }

  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return data?.publicUrl || ''
  } catch (error) {
    console.error('getPublicUrlSync: Error', error)
    return ''
  }
}

