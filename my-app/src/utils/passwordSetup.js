/**
 * Utility function to send password setup email to Google OAuth users
 * This allows them to set up a password for manual email/password login
 */

/**
 * Send password setup email to a Google OAuth user
 * @param {string} email - User's email address
 * @param {string} userId - User's ID (for tracking)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendPasswordSetupEmail = async (email, userId) => {
    try {
        // Check if we already sent this email (avoid duplicates)
        const storageKey = `password_setup_email_sent_${userId}`;
        if (localStorage.getItem(storageKey)) {
            console.log('Password setup email already sent for this user');
            return { success: true, alreadySent: true };
        }

        const response = await fetch('/api/auth/send-password-setup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, userId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Mark as sent to avoid duplicates
            localStorage.setItem(storageKey, new Date().toISOString());
            console.log('✅ Password setup email sent successfully to:', email);

            // If SMTP is not configured, display the link directly
            if (data.passwordSetupLink) {
                console.log('🔗 PASSWORD SETUP LINK (use this if email not received):');
                console.log(data.passwordSetupLink);
                // Also show an alert to notify the user
                alert(`Password setup link generated! Since email delivery may not work, copy this link from the browser console (F12) or use the password reset feature later.\n\nEmail: ${email}`);
            }

            return { success: true, passwordSetupLink: data.passwordSetupLink };
        } else {
            console.error('Failed to send password setup email:', data.error);
            return { success: false, error: data.error || 'Failed to send email' };
        }
    } catch (error) {
        console.error('Error sending password setup email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if user is a new Google OAuth user (created within last 5 minutes)
 * @param {Object} user - Supabase user object
 * @returns {boolean}
 */
export const isNewGoogleOAuthUser = (user) => {
    if (!user) return false;

    // Check if user is Google OAuth
    const isGoogleAuth = user.app_metadata?.provider === 'google' ||
        user.identities?.some(id => id.provider === 'google');

    if (!isGoogleAuth) return false;

    // Check if user was created within last 5 minutes
    const createdAt = new Date(user.created_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return createdAt > fiveMinutesAgo;
};

/**
 * Check if password setup email was already sent for this user
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const wasPasswordSetupEmailSent = (userId) => {
    return !!localStorage.getItem(`password_setup_email_sent_${userId}`);
};
