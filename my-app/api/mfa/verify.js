import { createServerSupabaseClient, verifyAuth } from '../lib/supabase-server.js';

/**
 * POST /api/mfa/verify
 * Verify MFA TOTP code and upgrade session to AAL2
 * 
 * Request body:
 * - factorId: string - The MFA factor ID
 * - challengeId: string - The challenge ID from /api/mfa/challenge
 * - code: string - The 6-digit TOTP code from authenticator app
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

        // Parse request body
        const { factorId, challengeId, code } = req.body;

        if (!factorId || !challengeId || !code) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: factorId, challengeId, code'
            });
        }

        if (code.length !== 6 || !/^\d+$/.test(code)) {
            return res.status(400).json({
                success: false,
                error: 'Code must be a 6-digit number'
            });
        }

        // Create client with user's token
        const supabase = createServerSupabaseClient(token);

        // Verify the TOTP code
        const { data, error } = await supabase.auth.mfa.verify({
            factorId,
            challengeId,
            code
        });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        // Return the new session with AAL2
        return res.status(200).json({
            success: true,
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                user: data.user,
                aal: 'aal2' // Authenticator Assurance Level 2
            }
        });

    } catch (err) {
        console.error('MFA verify error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
