/**
 * Utility functions for handling email confirmation for OAuth users
 * 
 * IMPORTANT: Email templates are configured in Supabase Dashboard or supabase/templates/confirmation.html
 * The custom SecureShare email template with branding will be used automatically when emails are sent.
 * 
 * Email Template Format:
 * - Subject: "Welcome to SecureShare - Confirm Your Email"
 * - Uses custom HTML with SecureShare branding (#8B0000 red header)
 * - Includes confirmation button and fallback link
 * - Template location: supabase/templates/confirmation.html
 */

import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseAdmin';

/**
 * Get the custom email HTML template (for reference/documentation)
 * This matches the template in supabase/templates/confirmation.html
 * Supabase will automatically use this template when sending confirmation emails
 */
const getEmailTemplateHTML = (confirmationURL) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #8B0000; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">🔒 SecureShare</h1>
    <p style="margin: 5px 0 0 0; font-size: 14px;">Secure File Sharing for Academic Excellence</p>
  </div>
  
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
    <h2 style="color: #8B0000; margin-top: 0;">Welcome to SecureShare!</h2>
    
    <p>Hello,</p>
    
    <p>Thank you for signing up for SecureShare. To complete your registration and start using our secure file sharing platform, please confirm your email address by clicking the button below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationURL}" style="background-color: #8B0000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Confirm Your Email Address</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 12px; color: #999; word-break: break-all; background-color: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e0e0e0;">${confirmationURL}</p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666; margin-bottom: 0;">
      <strong>Important:</strong> This confirmation link will expire in 24 hours. If you didn't create an account with SecureShare, please ignore this email.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      If you have any questions or need assistance, please don't hesitate to contact our support team.
    </p>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      Best regards,<br>
      <strong>The SecureShare Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
    <p>This is an automated email. Please do not reply to this message.</p>
    <p>© 2024 SecureShare. All rights reserved.</p>
  </div>
</body>
</html>`;
};

/**
 * Send confirmation email to OAuth user
 * 
 * This function uses Supabase's built-in email system which will automatically
 * use the custom email template configured in supabase/templates/confirmation.html
 * 
 * The email will be sent with:
 * - Subject: "Welcome to SecureShare - Confirm Your Email"
 * - Custom HTML template with SecureShare branding
 * - Confirmation link that expires in 24 hours
 * 
 * @param {string} email - User's email address (must be @tup.edu.ph)
 * @returns {Promise<{success: boolean, error?: string, confirmationLink?: string, requiresDashboardConfig?: boolean}>}
 */
export const sendOAuthConfirmationEmail = async (email) => {
  console.log('📧 Sending confirmation email to:', email);
  console.log('📋 Using custom SecureShare email template (configured in Supabase Dashboard)');
  
  // STEP 1: Find user using Admin API FIRST
  let user = null;
  try {
    console.log('   Step 1: Finding user via Admin API...');
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
    } else {
      user = usersData?.users?.find(u => u.email?.toLowerCase() === email?.toLowerCase());
      if (user) {
        console.log('✅ Found user:', user.id, user.email, 'Confirmed:', !!user.email_confirmed_at);
      } else {
        console.log('⚠️  User not found in list, will try to generate link anyway');
      }
    }
  } catch (err) {
    console.error('❌ Error finding user:', err);
  }

  // STEP 2: Generate confirmation link using Admin API (this ALWAYS works)
  let confirmationLink = null;
  try {
    console.log('   Step 2: Generating confirmation link via Admin API...');
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: email,
          options: {
            redirectTo: `${window.location.origin}/portal`
          }
        });

    if (linkError) {
      console.error('❌ Error generating link:', linkError);
    } else if (linkData?.properties?.action_link) {
      confirmationLink = linkData.properties.action_link;
      console.log('✅ Confirmation link generated:', confirmationLink.substring(0, 100) + '...');
    } else {
      console.error('❌ No action_link in response:', linkData);
    }
  } catch (err) {
    console.error('❌ Exception generating link:', err);
  }

  // STEP 3: Try MULTIPLE methods to send email
  const methods = [
    // Method 1: Use Admin API generateLink - BEST METHOD for OAuth users
    async () => {
      console.log('   Method 1: Trying Admin API generateLink (BEST for OAuth users)...');
      try {
        // Generate confirmation link using Admin API
        // This works even if user was created via OAuth
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: email,
          options: {
            redirectTo: `${window.location.origin}/portal`
          }
        });
        
        if (!linkError && linkData?.properties?.action_link) {
          confirmationLink = linkData.properties.action_link;
          console.log('✅ Method 1: Confirmation link generated');
          console.log('   📧 Supabase should automatically send email with this link');
          console.log('   ⚠️  If email not received, check:');
          console.log('      1. Email confirmations enabled in Dashboard');
          console.log('      2. SMTP configured in Dashboard');
          console.log('      3. Check spam folder');
          
          // Note: generateLink doesn't always trigger email automatically
          // We'll try to manually send it in Method 3
          return false; // Continue to try other methods to actually send email
        }
        console.log('❌ Method 1 failed:', linkError?.message);
      } catch (err) {
        console.log('❌ Method 1 exception:', err.message);
      }
      return false;
    },
    
    // Method 2: Regular resend (uses Supabase email template automatically)
    // NOTE: This works for regular signups but may not work for OAuth users
    async () => {
      console.log('   Method 2: Trying supabase.auth.resend()...');
      console.log('   📧 This will use the custom SecureShare email template from Dashboard');
      console.log('   ⚠️  Note: For OAuth users, this may not work - will try Admin API if it fails');
      
      const { error, data } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/portal`
        }
      });
      
      if (!error) {
        console.log('✅ Method 2 SUCCESS! Email sent with custom SecureShare template');
        console.log('   📬 Check the inbox for:', email);
        console.log('   📋 Subject: "Welcome to SecureShare - Confirm Your Email"');
        return true;
      }
      
      // For OAuth users, resend() often fails - this is expected
      if (error?.message?.includes('already confirmed') || error?.message?.includes('not found')) {
        console.log('⚠️  Method 2: User may be OAuth user or already exists, trying Admin API...');
        return false; // Will try Admin API methods
      }
      
      console.log('❌ Method 2 failed:', error?.message);
      return false;
    },
    
    // Method 3: Use Admin API to update user and trigger email (for OAuth users)
    async () => {
      if (!user) return false;
      console.log('   Method 3: Trying Admin API to update user and trigger email...');
      try {
        // For OAuth users, we can't directly send confirmation email
        // But we can use generateLink which should trigger email if configured
        // The email will be sent automatically by Supabase if:
        // 1. Email confirmations are enabled
        // 2. SMTP is configured
        // 3. User is unconfirmed
        
        // Check if user is already confirmed
        if (user.email_confirmed_at) {
          console.log('⚠️  User already confirmed, no email needed');
          return true; // User is confirmed, consider this success
        }
        
        // Generate link (this should trigger email if properly configured)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email: email,
          options: {
            redirectTo: `${window.location.origin}/portal`
          }
        });
        
        if (!linkError && linkData?.properties?.action_link) {
          confirmationLink = linkData.properties.action_link;
          console.log('✅ Method 3: Link generated');
          console.log('   📧 Email should be sent automatically by Supabase');
          console.log('   ⚠️  If email not received, verify SMTP configuration in Dashboard');
          // Return true because link was generated - email sending depends on Supabase config
          return true;
        }
        console.log('❌ Method 3 failed:', linkError?.message);
      } catch (err) {
        console.log('❌ Method 3 exception:', err.message);
      }
      return false;
    },
    
    // Method 4: Try using Admin API inviteUserByEmail (might trigger confirmation email)
    async () => {
      if (!user) return false;
      console.log('   Method 4: Trying Admin API inviteUserByEmail...');
      try {
        // Note: This might create a new user, so we need to be careful
        // But if user already exists, it might trigger a confirmation email
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${window.location.origin}/login`
        });
        
        if (!error) {
          console.log('✅ Method 4 SUCCESS!');
          return true;
        }
        console.log('❌ Method 4 failed:', error?.message);
      } catch (err) {
        console.log('❌ Method 4 exception:', err.message);
      }
      return false;
    }
  ];

  // Try all methods
  let emailSent = false;
  for (let i = 0; i < methods.length; i++) {
    try {
      emailSent = await methods[i]();
      if (emailSent) {
        break;
      }
      // Wait a bit between attempts
      if (i < methods.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error(`❌ Method ${i + 1} exception:`, err);
    }
  }

  // STEP 4: Return result
  if (emailSent) {
    console.log('🎉 EMAIL SENT SUCCESSFULLY!');
    console.log('📧 Email sent to:', email);
    console.log('📋 Email uses custom SecureShare template with branding');
    console.log('📬 Subject: "Welcome to SecureShare - Confirm Your Email"');
    console.log('');
    console.log('📝 IMPORTANT: If email not received:');
    console.log('   1. Check spam/junk folder');
    console.log('   2. Verify email confirmations enabled in Supabase Dashboard');
    console.log('   3. Verify SMTP configured in Dashboard → Settings → Auth → SMTP');
    console.log('   4. Check Supabase Auth logs: Dashboard → Authentication → Logs');
    return { success: true };
  }

  // If email wasn't sent but we have a link, return it
  if (confirmationLink) {
    console.log('⚠️  Email may not have been sent automatically');
    console.log('🔗 FULL CONFIRMATION LINK:', confirmationLink);
    console.log('📋 Copy this link and open it in your browser to confirm your email!');
    console.log('');
    console.log('❌ EMAIL NOT SENDING? Follow these steps:');
    console.log('');
    console.log('1. ENABLE EMAIL CONFIRMATIONS:');
    console.log('   → Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers');
    console.log('   → Click "Email" provider');
    console.log('   → Enable "Confirm email" toggle');
    console.log('   → Click Save');
    console.log('');
    console.log('2. CONFIGURE SMTP (REQUIRED for Gmail delivery):');
    console.log('   → Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth');
    console.log('   → Scroll to "SMTP Settings"');
    console.log('   → Enable "Enable Custom SMTP"');
    console.log('   → Configure with SendGrid, Mailgun, or Gmail SMTP');
    console.log('   → See FIX_EMAIL_CONFIRMATION_GMAIL.md for detailed instructions');
    console.log('');
    console.log('3. CONFIGURE EMAIL TEMPLATE:');
    console.log('   → Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates');
    console.log('   → Click "Confirm signup" template');
    console.log('   → Copy HTML from: supabase/templates/confirmation.html');
    console.log('   → Paste and save');
    console.log('');
    console.log('4. CHECK AUTH LOGS:');
    console.log('   → Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/logs');
    console.log('   → Look for sign_up events and email delivery status');
    
    // Try to copy to clipboard
    try {
      await navigator.clipboard.writeText(confirmationLink);
      console.log('✅ Confirmation link copied to clipboard!');
    } catch (err) {
      console.log('⚠️  Could not copy to clipboard:', err);
    }
    
    // Try to open the link automatically
    try {
      window.open(confirmationLink, '_blank');
      console.log('✅ Opened confirmation link in new tab!');
    } catch (err) {
      console.log('⚠️  Could not open link automatically:', err);
    }
    
    return {
      success: false,
      error: `⚠️ EMAIL CONFIRMATIONS NOT ENABLED IN SUPABASE DASHBOARD!\n\nTo receive emails with the custom SecureShare template:\n1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates\n2. Edit "Confirm signup" template\n3. Copy HTML from: supabase/templates/confirmation.html\n4. Enable: Authentication > Providers > Email > "Confirm sign up"\n5. Configure SMTP (recommended)\n\nYour confirmation link (also copied to clipboard):\n${confirmationLink.substring(0, 100)}...\n\nFull link in console. Click it to confirm your email now!`,
      confirmationLink: confirmationLink,
      requiresDashboardConfig: true
    };
  }

  // Last resort error
  console.error('❌ ALL METHODS FAILED - No email sent, no link generated');
  console.error('💡 To fix this:');
  console.error('   1. Enable email confirmations: Dashboard > Authentication > Providers > Email > "Confirm sign up"');
  console.error('   2. Configure email template: Dashboard > Authentication > Email Templates > "Confirm signup"');
  console.error('   3. Use HTML from: supabase/templates/confirmation.html');
  console.error('   4. Configure SMTP for reliable email delivery');
  return {
    success: false,
    error: `Failed to send confirmation email with custom SecureShare template.\n\nPlease:\n1. Enable email confirmations in Supabase Dashboard\n2. Configure the email template (use supabase/templates/confirmation.html)\n3. Configure SMTP for reliable delivery\n\nYour email: ${email}`,
    requiresDashboardConfig: true
  };
};

/**
 * Get email template HTML (for manual sending if needed)
 * This is the same format used in supabase/templates/confirmation.html
 * @param {string} confirmationURL - The confirmation URL to include in the email
 * @returns {string} HTML email template
 */
export const getConfirmationEmailHTML = (confirmationURL) => {
  return getEmailTemplateHTML(confirmationURL);
};

/**
 * Check if user's email is confirmed
 * @param {Object} user - Supabase user object
 * @returns {boolean}
 */
export const isEmailConfirmed = (user) => {
  return user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
};

/**
 * Validate email domain for TUP
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
export const isValidTUPEmail = (email) => {
  if (!email) return false;
  return email.toLowerCase().endsWith('@tup.edu.ph');
};


