import { createServerSupabaseClient, verifyAuth, jsonResponse, errorResponse, corsHeaders } from '../lib/supabase-server.js';

/**
 * POST /api/mfa/enroll
 * Enroll user in MFA (TOTP)
 * Returns QR code and secret for authenticator app setup
 */
export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify user is authenticated
        const { user, token, error: authError } = await verifyAuth(req);
        if (authError) {
            return res.status(401).json({ success: false, error: authError });
        }

        // Check if this is a Google OAuth user - they shouldn't use MFA
        const isGoogleAuth = user.app_metadata?.provider === 'google' ||
            user.identities?.some(identity => identity.provider === 'google');

        if (isGoogleAuth) {
            return res.status(400).json({
                success: false,
                error: 'MFA is not available for Google sign-in accounts. Google provides its own 2FA.'
            });
        }

        // Create client with user's token
        const supabase = createServerSupabaseClient(token);

        // Enroll in MFA
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: 'SecureShare Authenticator'
        });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: data.id,
                qr_code: data.totp.qr_code,
                secret: data.totp.secret,
                uri: data.totp.uri
            }
        });

    } catch (err) {
        console.error('MFA enroll error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
