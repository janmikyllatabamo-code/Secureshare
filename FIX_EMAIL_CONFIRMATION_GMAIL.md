# Fix Email Confirmation Not Sending to Gmail

## Problem
Confirmation emails are not being sent to Gmail accounts after Google OAuth signup.

## Root Causes Identified

1. **Email confirmations not enabled in Supabase Dashboard** (most common)
2. **SMTP not configured** - Supabase needs SMTP to send emails
3. **OAuth users don't automatically get confirmation emails** - Need to manually trigger
4. **Site URL/Redirect URLs not configured correctly**

## Step-by-Step Fix

### Step 1: Enable Email Confirmations in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers
2. Click on **"Email"** provider
3. **Enable "Confirm email"** toggle
4. Click **Save**

### Step 2: Configure SMTP (REQUIRED for Gmail delivery)

You have two options:

#### Option A: Use Supabase's Built-in SMTP (Free tier - limited)
1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth
2. Scroll to **"SMTP Settings"**
3. Supabase provides a basic SMTP service, but it's limited
4. For production, use Option B

#### Option B: Use External SMTP Provider (RECOMMENDED)

**Using Gmail SMTP (if you have a Gmail account):**
1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth
2. Scroll to **"SMTP Settings"**
3. Enable **"Enable Custom SMTP"**
4. Fill in:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587` (or `465` for SSL)
   - **Username**: Your Gmail address
   - **Password**: Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
   - **Sender email**: Your Gmail address
   - **Sender name**: `SecureShare`
5. Click **Save**

**Using Resend (Recommended - Modern & Developer-Friendly):**
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Verify your domain (or use `onboarding@resend.dev` for testing)
3. Create an API key
4. In Supabase Dashboard → Settings → Auth → SMTP:
   - **Host**: `smtp.resend.com`
   - **Port**: `587`
   - **Username**: `resend`
   - **Password**: Your Resend API key
   - **Sender email**: Your verified domain email (or `onboarding@resend.dev` for testing)
   - **Sender name**: `SecureShare`
5. See `SETUP_RESEND_FOR_SUPABASE.md` for detailed instructions

**Using SendGrid (Alternative - Enterprise Option):**
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create an API key
3. In Supabase Dashboard → Settings → Auth → SMTP:
   - **Host**: `smtp.sendgrid.net`
   - **Port**: `587`
   - **Username**: `apikey`
   - **Password**: Your SendGrid API key
   - **Sender email**: Your verified sender email
   - **Sender name**: `SecureShare`
4. See `SETUP_SENDGRID_FOR_SUPABASE.md` for detailed instructions

**Using Mailgun (Alternative):**
1. Sign up at https://www.mailgun.com (free tier: 5,000 emails/month)
2. Get SMTP credentials
3. Configure in Supabase Dashboard

### Step 3: Configure Email Template

1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates
2. Click on **"Confirm signup"** template
3. **Subject**: `Welcome to SecureShare - Confirm Your Email`
4. **Body**: Copy the HTML from `supabase/templates/confirmation.html`
5. Click **Save**

### Step 4: Configure Site URL and Redirect URLs

1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth
2. **Site URL**: Set to your production URL (e.g., `https://yourdomain.com`)
3. **Redirect URLs**: Add:
   - `http://localhost:3000/login`
   - `https://yourdomain.com/login`
   - Any other URLs where users should be redirected after confirmation

### Step 5: Verify Configuration

1. Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/logs
2. Try signing up with Google OAuth
3. Check the logs for:
   - `sign_up` event
   - Email status (should show "sent" or "delivered")
   - Any error messages

## Testing

1. **Test with a real Gmail account**:
   - Sign up with Google OAuth using a `@tup.edu.ph` email
   - Check inbox (and spam folder)
   - Click confirmation link

2. **Check Supabase Auth Logs**:
   - Dashboard → Authentication → Logs
   - Look for email delivery status

3. **Test SMTP directly** (if using custom SMTP):
   - Use your SMTP provider's dashboard to send a test email
   - Verify it arrives in Gmail

## Common Issues and Solutions

### Issue: "Email confirmations not enabled"
**Solution**: Enable in Dashboard → Authentication → Providers → Email → "Confirm email"

### Issue: "SMTP not configured"
**Solution**: Configure SMTP in Dashboard → Settings → Auth → SMTP Settings

### Issue: "Emails going to spam"
**Solution**: 
- Use a verified sender domain
- Configure SPF/DKIM records (for custom domains)
- Use a reputable SMTP provider (SendGrid, Mailgun)

### Issue: "Rate limit exceeded"
**Solution**: 
- Free tier has limits
- Upgrade to Pro plan or use external SMTP provider

### Issue: "OAuth users not getting emails"
**Solution**: 
- OAuth users need manual confirmation email trigger
- The code in `emailConfirmation.js` handles this
- Make sure `sendOAuthConfirmationEmail()` is being called

## Verification Checklist

- [ ] Email confirmations enabled in Dashboard
- [ ] SMTP configured (custom or Supabase's built-in)
- [ ] Email template configured with custom HTML
- [ ] Site URL set correctly
- [ ] Redirect URLs configured
- [ ] Test email sent successfully
- [ ] Email received in inbox (not spam)
- [ ] Confirmation link works

## Next Steps After Configuration

1. Test the signup flow
2. Monitor Auth logs for email delivery
3. Check spam folders if emails don't arrive
4. Consider setting up email analytics (SendGrid/Mailgun provide this)

## Support

If emails still don't send after following these steps:
1. Check Supabase Auth logs for specific errors
2. Check SMTP provider logs (if using custom SMTP)
3. Verify email address is valid and not blocked
4. Test with a different email provider to rule out Gmail-specific issues

