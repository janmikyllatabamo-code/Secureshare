import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side operations
 * Uses the user's JWT token for authenticated operations
 */
export function createServerSupabaseClient(accessToken) {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Create a Supabase admin client with service role key
 * WARNING: Only use for server-side operations that require elevated privileges
 */
export function createAdminSupabaseClient() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase admin environment variables');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Extract JWT token from Authorization header
 */
export function extractToken(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.replace('Bearer ', '');
}

/**
 * Verify user is authenticated and return user data
 */
export async function verifyAuth(req) {
    const token = extractToken(req);
    if (!token) {
        return { user: null, error: 'Missing authorization token' };
    }

    const supabase = createAdminSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return { user: null, error: error?.message || 'Invalid token' };
    }

    return { user, token, error: null };
}

/**
 * Standard CORS headers for API responses
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

/**
 * Create JSON response with CORS headers
 */
export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
}

/**
 * Create error response
 */
export function errorResponse(message, status = 400) {
    return jsonResponse({ success: false, error: message }, status);
}
