import { createServerSupabaseClient, verifyAuth } from '../lib/supabase-server.js';

/**
 * POST /api/mfa/unenroll
 * Disable MFA for the user
 * Requires AAL2 (user must verify MFA first)
 * 
 * Request body:
 * - factorId: string - The MFA factor ID to remove
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
        const { factorId } = req.body;

        if (!factorId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: factorId'
            });
        }

        // Create client with user's token
        const supabase = createServerSupabaseClient(token);

        // Check current AAL level - must be AAL2 to unenroll
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aalError) {
            return res.status(400).json({ success: false, error: aalError.message });
        }

        if (aalData.currentLevel !== 'aal2') {
            return res.status(403).json({
                success: false,
                error: 'You must verify MFA before disabling it. Please enter your current MFA code first.'
            });
        }

        // Unenroll from MFA
        const { error } = await supabase.auth.mfa.unenroll({
            factorId
        });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        return res.status(200).json({
            success: true,
            message: 'MFA has been disabled successfully'
        });

    } catch (err) {
        console.error('MFA unenroll error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
