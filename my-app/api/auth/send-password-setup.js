/**
 * API endpoint to send password setup email to Google OAuth users
 * This allows OAuth users to set up a password for manual email/password login
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, userId } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Validate email domain
        if (!email.toLowerCase().endsWith('@tup.edu.ph')) {
            return res.status(400).json({ error: 'Only @tup.edu.ph emails are allowed' });
        }

        // Use resetPasswordForEmail to trigger Supabase to SEND the email
        // (admin.generateLink only creates the link but doesn't send it)
        const { data, error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${req.headers.origin || 'https://secureshare-ten.vercel.app'}/login?password_setup=true`
        });

        if (resetError) {
            console.error('Error sending password setup email:', resetError);
            return res.status(500).json({
                error: 'Failed to send password setup email',
                details: resetError.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Password setup email sent',
            // Note: We cannot get the link back when using resetPasswordForEmail (for security)
            // So console display of the link will no longer be possible, which is what the user wants (email delivery)
        });

    } catch (error) {
        console.error('Error in send-password-setup:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};
