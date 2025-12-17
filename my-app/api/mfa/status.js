import { createServerSupabaseClient, verifyAuth } from '../lib/supabase-server.js';

/**
 * GET /api/mfa/status
 * Get user's MFA enrollment status and current AAL level
 */
export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify user is authenticated
        const { user, token, error: authError } = await verifyAuth(req);
        if (authError) {
            return res.status(401).json({ success: false, error: authError });
        }

        // Check if this is a Google OAuth user
        const isGoogleAuth = user.app_metadata?.provider === 'google' ||
            user.identities?.some(identity => identity.provider === 'google');

        // Create client with user's token
        const supabase = createServerSupabaseClient(token);

        // Get current AAL level
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalError) {
            return res.status(400).json({ success: false, error: aalError.message });
        }

        // Get user's MFA factors
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError) {
            return res.status(400).json({ success: false, error: factorsError.message });
        }

        const verifiedFactors = factors?.totp?.filter(f => f.status === 'verified') || [];
        const hasMfaEnabled = verifiedFactors.length > 0;

        return res.status(200).json({
            success: true,
            data: {
                hasMfaEnabled,
                isGoogleAuth,
                mfaRequired: !isGoogleAuth, // MFA only required for email/password users
                currentLevel: aalData.currentLevel, // 'aal1' or 'aal2'
                nextLevel: aalData.nextLevel,
                factors: verifiedFactors.map(f => ({
                    id: f.id,
                    friendlyName: f.friendly_name,
                    createdAt: f.created_at
                }))
            }
        });

    } catch (err) {
        console.error('MFA status error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
