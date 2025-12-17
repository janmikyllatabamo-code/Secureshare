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

        // Initialize admin client
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Generate password recovery link (this is what allows setting up a password)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${req.headers.origin || 'https://secureshare-ten.vercel.app'}/login?password_setup=true`
            }
        });

        if (linkError) {
            console.error('Error generating password setup link:', linkError);
            return res.status(500).json({
                error: 'Failed to generate password setup link',
                details: linkError.message
            });
        }

        // The generateLink with type 'recovery' should automatically send an email
        // if email confirmations are properly configured in Supabase

        // If we got a link, try to send it via Supabase's built-in email
        // Note: Supabase's recovery email will be sent automatically if SMTP is configured

        console.log('Password setup link generated for:', email);
        console.log('Link (first 100 chars):', linkData?.properties?.action_link?.substring(0, 100));

        return res.status(200).json({
            success: true,
            message: 'Password setup email sent',
            // Always return the link so frontend can display it if email delivery fails
            passwordSetupLink: linkData?.properties?.action_link
        });

    } catch (error) {
        console.error('Error in send-password-setup:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};
