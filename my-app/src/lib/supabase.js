import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallback
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vlxkhqvsvfjjhathgakp.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseGtocXZzdmZqamhhdGhnYWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODM3NzksImV4cCI6MjA4MTI1OTc3OX0.yd2IICCV6K034581-0G3FKQHDmGttRvIL4S_i4i6ZEE'

// Debug logging (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length,
    keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
    fromEnv: !!process.env.REACT_APP_SUPABASE_ANON_KEY
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env file.')
  throw new Error('Missing Supabase environment variables. Please ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in your .env file.')
}

// Create singleton supabase client to avoid multiple GoTrueClient instances
let supabaseInstance = null

if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'supabase-auth', // Unique storage key
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Handle clock skew warnings gracefully
      // Use implicit flow instead of PKCE to avoid code verifier loss issues
      flowType: 'implicit'
    },
    global: {
      // Suppress clock skew warnings in development
      headers: {
        'X-Client-Info': 'supabase-js-client'
      }
    }
  })

  // Suppress clock skew warnings by handling them gracefully
  if (process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn
    console.warn = function (...args) {
      // Filter out clock skew warnings
      if (args[0] && typeof args[0] === 'string' && args[0].includes('clock for skew')) {
        // Silently ignore clock skew warnings
        return
      }
      originalWarn.apply(console, args)
    }
  }
}

export const supabase = supabaseInstance

