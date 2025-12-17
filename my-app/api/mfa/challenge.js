import { createServerSupabaseClient, verifyAuth, jsonResponse, errorResponse, corsHeaders } from '../lib/supabase-server.js';

/**
 * POST /api/mfa/challenge
 * Create an MFA challenge for verification
 * Returns challengeId needed for the verify step
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

        // Create client with user's token
        const supabase = createServerSupabaseClient(token);

        // Get user's MFA factors
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError) {
            return res.status(400).json({ success: false, error: factorsError.message });
        }

        // Find an active TOTP factor
        const totpFactor = factors?.totp?.find(f => f.status === 'verified');

        if (!totpFactor) {
            return res.status(400).json({
                success: false,
                error: 'No verified MFA factor found. Please enroll in MFA first.'
            });
        }

        // Create challenge
        const { data, error } = await supabase.auth.mfa.challenge({
            factorId: totpFactor.id
        });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        return res.status(200).json({
            success: true,
            data: {
                challengeId: data.id,
                factorId: totpFactor.id,
                expiresAt: data.expires_at
            }
        });

    } catch (err) {
        console.error('MFA challenge error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
