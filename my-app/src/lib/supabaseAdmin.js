// Admin Supabase client for server-side operations
// WARNING: Service role key should NEVER be exposed in production frontend
// This is a temporary solution. For production, use Edge Functions or backend API

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vlxkhqvsvfjjhathgakp.supabase.co'
// In production, this should come from a secure backend API, not frontend
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY4Mzc3OSwiZXhwIjoyMDgxMjU5Nzc5fQ.rpxdjXa1R6Y4ElggWIy3txImNp_nR_rhe94tYiFqtdA'

if (!serviceRoleKey) {
  console.warn('⚠️ Service role key not found. Admin operations will fail.')
}

// Create singleton admin client with unique storage key to avoid GoTrueClient conflicts
// Using a unique storage key prevents conflicts with the regular supabase client
let supabaseAdminInstance = null

if (!supabaseAdminInstance) {
  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'supabase-admin-auth' // Unique storage key to avoid conflicts
    },
    global: {
      headers: {
        'x-client-info': 'supabase-admin-client'
      }
    }
  })
}

export const supabaseAdmin = supabaseAdminInstance

