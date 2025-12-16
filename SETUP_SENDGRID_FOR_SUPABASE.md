# Complete Guide: Setting Up SendGrid for Supabase Email Confirmations

This guide will walk you through setting up SendGrid to send confirmation emails from your Supabase project, specifically for @tup.edu.ph email addresses.

## What is SendGrid?
SendGrid is a cloud-based email delivery service that provides:
- **Free tier**: 100 emails/day (forever free)
- **Reliable delivery**: High inbox placement rates
- **Enterprise-grade**: Used by major companies worldwide
- **Easy integration**: Simple SMTP setup

---

## Prerequisites
- A SendGrid account (free tier: 100 emails/day)
- Access to your Supabase Dashboard
- Your Supabase project URL: `https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp`

---

## Part 1: Create SendGrid Account and API Key

### Step 1: Sign Up for SendGrid
1. Go to: **https://sendgrid.com**
2. Click **"Start for Free"** or **"Sign Up"**
3. Fill in your details:
   - Email address
   - Password
   - Company name (optional)
4. Click **"Create Account"**
5. Verify your email address (check your inbox)
6. Complete the onboarding process

### Step 2: Verify Your Sender Identity

**Option A: Single Sender Verification (Recommended for Testing)**
1. Go to: **SendGrid Dashboard** → **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in the form:
   - **From Email Address**: `noreply@yourdomain.com` (or use a verified email)
   - **From Name**: `SecureShare`
   - **Reply To**: (optional)
   - **Company Address**: Your address
   - **City**: Your city
   - **State**: Your state
   - **Country**: Your country
   - **Zip Code**: Your zip code
4. Click **"Create"**
5. **Check your email** and click the verification link
6. ✅ Sender is now verified

**Option B: Domain Authentication (Recommended for Production)**
1. Go to: **SendGrid Dashboard** → **Settings** → **Sender Authentication**
2. Click **"Authenticate Your Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Choose your DNS provider
5. Follow the instructions to add DNS records (SPF, DKIM, CNAME)
6. Wait for verification (usually a few minutes to 24 hours)
7. ✅ Domain is now verified

**For @tup.edu.ph emails:**
- You can use Single Sender Verification with any email address
- The important part is that SendGrid can send emails TO @tup.edu.ph addresses
- You don't need to verify @tup.edu.ph domain - you just need to send emails to it

### Step 3: Create an API Key
1. In SendGrid Dashboard, go to: **Settings** → **API Keys** (left sidebar)
2. Click **"Create API Key"** (top right)
3. Give it a name: `Supabase SecureShare`
4. Select permissions: **"Full Access"** (or **"Restricted Access"** with "Mail Send" permission)
5. Click **"Create & View"**
6. **⚠️ IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Save it somewhere safe (password manager, notes app, etc.)

---

## Part 2: Configure SendGrid in Supabase

### Step 1: Navigate to Supabase SMTP Settings
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth**
2. Scroll down to the **"SMTP Settings"** section
3. You'll see a toggle: **"Enable Custom SMTP"**

### Step 2: Enable and Configure SMTP
1. **Toggle ON** "Enable Custom SMTP"
2. Fill in the following fields:

   **Host:**
   ```
   smtp.sendgrid.net
   ```

   **Port:**
   ```
   587
   ```
   (Alternative: `465` for SSL, but `587` is recommended)

   **Username:**
   ```
   apikey
   ```
   (This is literal - type "apikey" exactly as shown)

   **Password:**
   ```
   [Paste your SendGrid API key here]
   ```
   (The API key you copied in Part 1, Step 3)

   **Sender Email:**
   ```
   [Your verified sender email from SendGrid]
   ```
   - If you verified a single sender: use that email
   - If you verified a domain: use `noreply@yourdomain.com`
   - Example: `noreply@secure-share.com` or your verified email

   **Sender Name:**
   ```
   SecureShare
   ```

3. Click **"Save"** at the bottom of the page
4. ✅ You should see a success message

---

## Part 3: Enable Email Confirmations

### Step 1: Enable Email Confirmations in Supabase
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers**
2. Click on **"Email"** provider
3. **Enable "Confirm email"** toggle
4. Click **"Save"**

### Step 2: Configure Email Template
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates**
2. Click on **"Confirm signup"** template
3. **Subject**: `Welcome to SecureShare - Confirm Your Email`
4. **Body**: Copy the HTML from `supabase/templates/confirmation.html` (if it exists) or use a custom template
5. **Important**: Make sure the confirmation link redirects to `/portal` for students
6. Click **"Save"**

---

## Part 4: Configure Redirect URLs

### Step 1: Set Site URL
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth**
2. **Site URL**: Set to your production URL (e.g., `https://yourdomain.com`)
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

### Step 2: Add Redirect URLs
1. In the same page, scroll to **"Redirect URLs"**
2. Add the following URLs:
   - `http://localhost:3000/portal` (for local development)
   - `https://yourdomain.com/portal` (for production)
   - `http://localhost:3000/login` (fallback)
   - `https://yourdomain.com/login` (fallback)
3. Click **"Save"**

**Important**: The redirect URL in email confirmation links should point to `/portal` (student dashboard) after confirmation.

---

## Part 5: Test the Configuration

### Step 1: Test Email Sending
1. Try signing up with Google OAuth using a `@tup.edu.ph` email
2. Check your email inbox (and spam folder)
3. You should receive a confirmation email from SendGrid

### Step 2: Verify in SendGrid Dashboard
1. Go to SendGrid Dashboard: **https://app.sendgrid.com/activity**
2. Navigate to: **Activity** (left sidebar)
3. You should see your test email:
   - Status: **"Delivered"** (green)
   - Click on it to see details (opens, clicks, etc.)
   - If it shows "Bounced" or "Failed", check the reason

### Step 3: Test Email Confirmation Flow
1. Click the confirmation link in the email
2. You should be redirected to `/portal` (student dashboard)
3. You should be automatically logged in

---

## Troubleshooting

### Issue: "Authentication failed" in Supabase
**Solution:**
- Double-check your API key is correct (no extra spaces)
- Make sure Username is exactly `apikey` (lowercase, no quotes)
- Verify the API key has "Mail Send" permissions in SendGrid
- Make sure you're using `smtp.sendgrid.net` (not `api.sendgrid.com`)

### Issue: Emails not arriving
**Check:**
1. **SendGrid Dashboard**: Go to SendGrid → Activity
   - Look for your email
   - Check status (Delivered, Bounced, Failed, etc.)
   - Click on email to see detailed logs
2. **Spam Folder**: Check recipient's spam/junk folder
3. **Supabase Auth Logs**: Dashboard → Authentication → Logs
   - Look for sign_up events
   - Check email delivery status
4. **Sender Verification**: Make sure your sender email is verified in SendGrid

### Issue: "Sender not verified" or "Domain not verified"
**Solution:**
- Verify your sender email in SendGrid Dashboard → Settings → Sender Authentication
- For production: Verify your domain in SendGrid
- The "Sender Email" in Supabase must match a verified sender in SendGrid

### Issue: Rate limits
**Solution:**
- Free tier: 100 emails/day
- Upgrade to paid plan for more: https://sendgrid.com/pricing
- Check your usage in SendGrid Dashboard → Settings → Usage

### Issue: Emails going to spam
**Solution:**
- Use a verified sender domain (not just single sender)
- Configure SPF/DKIM records (for custom domains)
- Warm up your domain gradually (start with low volume)
- Use proper email content (avoid spam trigger words)

---

## Quick Reference

### SendGrid SMTP Settings for Supabase:
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
Sender Email: [Your verified sender email]
Sender Name: SecureShare
```

### SendGrid Dashboard Links:
- **Main Dashboard**: https://app.sendgrid.com
- **API Keys**: https://app.sendgrid.com/settings/api_keys
- **Sender Authentication**: https://app.sendgrid.com/settings/sender_auth
- **Activity (Email Logs)**: https://app.sendgrid.com/activity
- **Settings**: https://app.sendgrid.com/settings

### Supabase Dashboard Links:
- **SMTP Settings**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth
- **Email Provider**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers
- **Email Templates**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates
- **Auth Logs**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/logs

---

## Email Confirmation Flow for Google OAuth

When a user signs up with Google OAuth using a `@tup.edu.ph` email:

1. **User clicks "Sign in with Google"**
2. **Google OAuth completes** → User is created in Supabase
3. **Email confirmation is sent** via SendGrid to `@tup.edu.ph` email
4. **User checks email** and clicks confirmation link
5. **User is redirected to `/portal`** (student dashboard)
6. **User is automatically logged in**

---

## Quick Setup Checklist

- [ ] Sign up at https://sendgrid.com
- [ ] Verify sender email in SendGrid Dashboard
- [ ] Create API key in SendGrid Dashboard
- [ ] Copy API key (save it securely)
- [ ] Go to Supabase → Settings → Auth → SMTP
- [ ] Enable "Enable Custom SMTP"
- [ ] Fill in:
  - Host: `smtp.sendgrid.net`
  - Port: `587`
  - Username: `apikey`
  - Password: [Your SendGrid API Key]
  - Sender Email: [Your verified email]
  - Sender Name: `SecureShare`
- [ ] Click "Save"
- [ ] Enable email confirmations in Supabase
- [ ] Configure email template with redirect to `/portal`
- [ ] Add redirect URLs in Supabase settings
- [ ] Test signup flow with Google OAuth
- [ ] Check SendGrid Dashboard for email status
- [ ] Verify redirect to student dashboard after confirmation

---

## Next Steps

1. ✅ SendGrid account created
2. ✅ Sender verified
3. ✅ API key created
4. ✅ SMTP configured in Supabase
5. ✅ Email confirmations enabled
6. ✅ Email template configured
7. ✅ Redirect URLs configured
8. ✅ Test email sent successfully
9. ✅ Email confirmation redirects to student dashboard

**You're all set!** Confirmation emails will now be sent via SendGrid to @tup.edu.ph addresses, and users will be redirected to the student dashboard after confirming their email.

---

## Additional Resources

- **SendGrid Documentation**: https://docs.sendgrid.com
- **SendGrid SMTP Settings**: https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp
- **SendGrid Sender Authentication**: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
- **Supabase Email Documentation**: https://supabase.com/docs/guides/auth/auth-email
