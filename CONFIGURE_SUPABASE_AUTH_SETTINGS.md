# Complete Guide: Configuring Supabase Auth Settings for Email Confirmations

This guide will walk you through all the Auth settings needed for email confirmations to work properly.

---

## Step 1: Authentication → Settings (General Auth Settings)

### Navigate to Settings
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/settings**
2. Or: Dashboard → **Authentication** → **Settings** (left sidebar)

### Configure These Settings:

#### ✅ Enable Email Confirmations
1. Scroll to **"Email Auth"** section
2. Find **"Enable email confirmations"** toggle
3. **Turn it ON** ✅
4. This ensures users must confirm their email before signing in

#### ✅ Set Site URL
1. Find **"Site URL"** field (usually at the top)
2. Set it to your app's URL:
   - **For local development**: `http://localhost:3000`
   - **For production**: `https://yourdomain.com` or your actual production URL
3. This is used to generate confirmation links

#### ✅ Configure Redirect URLs
1. Find **"Redirect URLs"** or **"Additional Redirect URLs"** section
2. Click **"Add URL"** or **"Add new URL"**
3. Add these URLs (one per line or separate entries):
   ```
   http://localhost:3000/login
   http://localhost:3000
   https://yourdomain.com/login
   https://yourdomain.com
   ```
4. These are the allowed URLs users can be redirected to after email confirmation
5. Click **"Save"**

**Your current config should look like:**
```
Site URL: http://localhost:3000 (or your production URL)
Redirect URLs:
  - http://localhost:3000/login
  - http://localhost:3000
  - [Your production URLs]
```

---

## Step 2: Authentication → Providers (Email Provider Settings)

### Navigate to Email Provider
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers**
2. Or: Dashboard → **Authentication** → **Providers** (left sidebar)
3. Find **"Email"** in the list of providers
4. Click on **"Email"** to expand settings

### Configure Email Provider:

#### ✅ Enable Email Provider
1. Make sure **"Enable Email provider"** toggle is **ON** ✅
2. This allows users to sign up with email

#### ✅ Enable Email Confirmations
1. Find **"Confirm email"** or **"Email confirmations"** toggle
2. **Turn it ON** ✅
3. This is critical - without this, confirmation emails won't be sent

#### ✅ Configure Email Settings
1. **Double confirm email changes**: Enable this (recommended)
2. **Secure email change**: Enable this (recommended)
3. Click **"Save"**

**Your Email provider should show:**
```
✅ Enable Email provider: ON
✅ Confirm email: ON
✅ Double confirm email changes: ON
✅ Secure email change: ON
```

---

## Step 3: Authentication → Templates (Email Templates)

### Navigate to Templates
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates**
2. Or: Dashboard → **Authentication** → **Templates** (left sidebar)

### Configure Confirmation Email Template:

#### ✅ Edit "Confirm signup" Template
1. Find **"Confirm signup"** template in the list
2. Click on it to edit

#### ✅ Set Subject Line
1. In the **"Subject"** field, enter:
   ```
   Welcome to SecureShare - Confirm Your Email
   ```

#### ✅ Set Email Body (HTML)
1. Open the file: `supabase/templates/confirmation.html`
2. **Copy the entire HTML content**
3. In Supabase Dashboard, paste it into the **"Body"** field
4. Make sure it's set to **"HTML"** format (not plain text)

#### ✅ Preview the Template
1. Click **"Preview"** button (if available)
2. Verify the email looks correct with your branding
3. Check that `{{ .ConfirmationURL }}` is present (this will be replaced with the actual link)

#### ✅ Save Template
1. Click **"Save"** at the bottom
2. ✅ Template is now configured

**Your template should have:**
- Subject: `Welcome to SecureShare - Confirm Your Email`
- Body: HTML from `confirmation.html` with SecureShare branding
- Contains: `{{ .ConfirmationURL }}` placeholder

---

## Step 4: Settings → Auth → SMTP (Email Delivery)

### Navigate to SMTP Settings
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth**
2. Or: Dashboard → **Settings** → **Auth** (left sidebar)
3. Scroll down to **"SMTP Settings"** section

### Configure SMTP:

#### ✅ Enable Custom SMTP
1. Find **"Enable Custom SMTP"** toggle
2. **Turn it ON** ✅
3. This allows you to use Resend, SendGrid, or Gmail for sending emails

#### ✅ Fill in SMTP Details

**If using Resend:**
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Your Resend API Key]
Sender Email: onboarding@resend.dev (or your verified domain email)
Sender Name: SecureShare
```

**If using SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
Sender Email: [Your verified email]
Sender Name: SecureShare
```

**If using Gmail:**
```
Host: smtp.gmail.com
Port: 587
Username: [Your Gmail address]
Password: [Gmail App Password]
Sender Email: [Your Gmail address]
Sender Name: SecureShare
```

#### ✅ Verify Settings
1. Double-check all fields are filled correctly
2. Make sure there are no extra spaces in the API key/password
3. Click **"Save"**
4. You should see a success message

**Important Notes:**
- **Sender Email** must match what you verified in your SMTP provider (Resend/SendGrid)
- **Password** is your API key (not your account password)
- **Username** is usually `resend` or `apikey` (check your provider's docs)

---

## Step 5: Authentication → Logs (Verify Email Sending)

### Navigate to Auth Logs
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/logs**
2. Or: Dashboard → **Authentication** → **Logs** (left sidebar)

### Check for Email Events:

#### ✅ Look for Signup Events
1. Filter by: **"sign_up"** or **"signup"** event type
2. Look for recent signup attempts
3. Check the status:
   - ✅ **"Success"** = User created
   - ❌ **"Error"** = Something went wrong

#### ✅ Check Email Delivery Status
1. Look for events with type: **"email_send"** or **"email_delivery"**
2. Check the status:
   - ✅ **"Sent"** or **"Delivered"** = Email was sent successfully
   - ❌ **"Failed"** or **"Bounced"** = Email delivery failed
   - ⚠️ **"Pending"** = Email is queued

#### ✅ Review Error Messages
1. If you see errors, click on them to see details
2. Common errors:
   - **"SMTP not configured"** → Go back to Step 4
   - **"Email confirmations disabled"** → Go back to Step 1
   - **"Invalid sender email"** → Check SMTP sender email matches verified email
   - **"Authentication failed"** → Check SMTP username/password

#### ✅ Test Email Sending
1. Try signing up a new user
2. Watch the logs in real-time
3. You should see:
   - `sign_up` event (success)
   - `email_send` event (sent)
   - Check recipient's inbox

---

## Step 6: Verify Code Implementation

### Check Your Signup Code

#### ✅ For Regular Email Signup
Your code should look like this:

```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@tup.edu.ph',
  password: 'securepassword',
  options: {
    emailRedirectTo: `${window.location.origin}/login`
  }
});
```

**Important:**
- ✅ `emailRedirectTo` is set (where user goes after confirmation)
- ✅ Not setting `email_confirmed: true` manually
- ✅ Not using service role key on client side

#### ✅ For Google OAuth Signup
Your code should:
1. Handle OAuth callback
2. Check if email is confirmed
3. If not confirmed, call `sendOAuthConfirmationEmail()` (which you already have)

**Check in your code:**
- File: `my-app/src/components/login/Login.jsx`
- Function: `sendOAuthConfirmationEmail()` is being called
- File: `my-app/src/utils/emailConfirmation.js` exists and is working

---

## Complete Checklist

Use this checklist to verify everything is configured:

### General Auth Settings
- [ ] Site URL is set correctly
- [ ] Redirect URLs are configured
- [ ] Email confirmations are enabled

### Email Provider
- [ ] Email provider is enabled
- [ ] "Confirm email" toggle is ON
- [ ] Double confirm email changes is enabled

### Email Templates
- [ ] "Confirm signup" template exists
- [ ] Subject is set: "Welcome to SecureShare - Confirm Your Email"
- [ ] Body contains HTML from `confirmation.html`
- [ ] Template contains `{{ .ConfirmationURL }}` placeholder

### SMTP Settings
- [ ] Custom SMTP is enabled
- [ ] Host is correct (e.g., `smtp.resend.com`)
- [ ] Port is correct (usually `587`)
- [ ] Username is correct (e.g., `resend` or `apikey`)
- [ ] Password/API key is correct (no extra spaces)
- [ ] Sender email matches verified email in SMTP provider
- [ ] Sender name is set: `SecureShare`

### Testing
- [ ] Signed up a test user
- [ ] Checked Auth logs for `sign_up` event
- [ ] Checked Auth logs for `email_send` event
- [ ] Email was received in inbox
- [ ] Confirmation link works
- [ ] User can confirm email and sign in

---

## Troubleshooting Common Issues

### Issue: "Email confirmations not enabled"
**Fix:**
1. Go to: Authentication → Providers → Email
2. Enable "Confirm email" toggle
3. Save

### Issue: "SMTP not configured"
**Fix:**
1. Go to: Settings → Auth → SMTP
2. Enable "Enable Custom SMTP"
3. Fill in all SMTP details
4. Save

### Issue: "Authentication failed" in SMTP
**Fix:**
- Check username is exactly `resend` or `apikey` (no quotes, lowercase)
- Verify API key is correct (no extra spaces)
- Check API key has correct permissions in your SMTP provider

### Issue: "Invalid sender email"
**Fix:**
- Sender email must match verified email in Resend/SendGrid
- For Resend test: use `onboarding@resend.dev`
- For production: use verified domain email

### Issue: "Email sent but not received"
**Fix:**
1. Check spam/junk folder
2. Check Auth logs for delivery status
3. Check SMTP provider dashboard (Resend/SendGrid) for delivery status
4. Verify recipient email is correct

### Issue: "Confirmation link doesn't work"
**Fix:**
1. Check Site URL is set correctly
2. Check Redirect URLs include your app URL
3. Verify link format in email template
4. Check browser console for errors when clicking link

---

## Quick Links for Your Project

- **Auth Settings**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/settings
- **Email Provider**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers
- **Email Templates**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates
- **SMTP Settings**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth
- **Auth Logs**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/logs

---

## Next Steps After Configuration

1. ✅ Complete all 6 steps above
2. ✅ Test with a real email address
3. ✅ Check Auth logs for successful email delivery
4. ✅ Verify email arrives in inbox (not spam)
5. ✅ Test confirmation link works
6. ✅ User can sign in after confirmation

**You're all set!** Your email confirmations should now work properly. 🎉

