import { supabase } from '../lib/supabase';

/**
 * MFA API client for stateless server-side MFA operations
 * All endpoints require authentication via JWT token
 */

/**
 * Get the current access token from Supabase session
 */
async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
}

/**
 * Make an authenticated API request
 */
async function mfaRequest(endpoint, options = {}) {
    const token = await getAccessToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/mfa/${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

/**
 * Get MFA enrollment status and current AAL level
 * @returns {Promise<{hasMfaEnabled: boolean, isGoogleAuth: boolean, currentLevel: string, factors: Array}>}
 */
export async function getMfaStatus() {
    const result = await mfaRequest('status', { method: 'GET' });
    return result.data;
}

/**
 * Enroll in MFA (TOTP)
 * @returns {Promise<{id: string, qr_code: string, secret: string, uri: string}>}
 */
export async function enrollMfa() {
    const result = await mfaRequest('enroll', { method: 'POST' });
    return result.data;
}

/**
 * Create an MFA challenge for verification
 * @returns {Promise<{challengeId: string, factorId: string, expiresAt: string}>}
 */
export async function createMfaChallenge() {
    const result = await mfaRequest('challenge', { method: 'POST' });
    return result.data;
}

/**
 * Verify MFA code and get AAL2 session
 * @param {string} factorId - The MFA factor ID
 * @param {string} challengeId - The challenge ID
 * @param {string} code - The 6-digit TOTP code
 * @returns {Promise<{accessToken: string, refreshToken: string, user: object, aal: string}>}
 */
export async function verifyMfa(factorId, challengeId, code) {
    const result = await mfaRequest('verify', {
        method: 'POST',
        body: JSON.stringify({ factorId, challengeId, code })
    });

    // Update the session with the new AAL2 tokens
    if (result.data.accessToken && result.data.refreshToken) {
        await supabase.auth.setSession({
            access_token: result.data.accessToken,
            refresh_token: result.data.refreshToken
        });
    }

    return result.data;
}

/**
 * Disable MFA (requires AAL2 verification first)
 * @param {string} factorId - The MFA factor ID to remove
 * @returns {Promise<{message: string}>}
 */
export async function unenrollMfa(factorId) {
    const result = await mfaRequest('unenroll', {
        method: 'POST',
        body: JSON.stringify({ factorId })
    });
    return result;
}

/**
 * Check if user is Google OAuth (MFA not applicable)
 * @returns {Promise<boolean>}
 */
export async function isGoogleAuthUser() {
    try {
        const status = await getMfaStatus();
        return status.isGoogleAuth;
    } catch {
        // If we can't get status, check locally
        const { data: { user } } = await supabase.auth.getUser();
        return user?.app_metadata?.provider === 'google' ||
            user?.identities?.some(identity => identity.provider === 'google');
    }
}

/**
 * Check if MFA verification is required for current session
 * @returns {Promise<{required: boolean, currentLevel: string}>}
 */
export async function isMfaRequired() {
    try {
        const status = await getMfaStatus();
        return {
            required: status.hasMfaEnabled && status.currentLevel === 'aal1',
            hasMfaEnabled: status.hasMfaEnabled,
            currentLevel: status.currentLevel
        };
    } catch {
        return { required: false, hasMfaEnabled: false, currentLevel: 'aal1' };
    }
}
