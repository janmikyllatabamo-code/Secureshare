# Complete Guide: Setting Up Resend for Supabase Email Confirmations

This guide will walk you through setting up Resend to send confirmation emails from your Supabase project.

## What is Resend?
Resend is a modern email API service designed for developers. It offers:
- **Free tier**: 3,000 emails/month (100 emails/day)
- **Simple API**: Easy to integrate
- **Great deliverability**: High inbox placement rates
- **Developer-friendly**: Clean dashboard and excellent documentation

---

## Prerequisites
- A Resend account (free tier: 3,000 emails/month)
- Access to your Supabase Dashboard
- Your Supabase project URL: `https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp`

**🎯 Don't have a domain?** No problem! See `SETUP_RESEND_NO_DOMAIN.md` for quick setup without a domain.

---

## Part 1: Create Resend Account and API Key

### Step 1: Sign Up for Resend
1. Go to: **https://resend.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Fill in your details:
   - Email address
   - Password
   - Name (optional)
4. Click **"Create Account"**
5. Verify your email address (check your inbox)

### Step 2: Choose Your Email Setup (No Domain Required!)

**🎯 Don't have a domain? No problem! Here are your options:**

#### Option A: Use Resend Test Email (Easiest - No Domain Needed!)
**Perfect for: Testing, development, MVP, learning**

1. **You don't need to verify anything!** Resend provides a test email automatically
2. Use this email address: `onboarding@resend.dev`
3. **Limitations:**
   - Can only send to **verified email addresses** (you need to verify recipient emails first)
   - Limited functionality (no custom domain branding)
   - Good for testing and development
4. **How to verify recipient emails:**
   - Go to Resend Dashboard → **Emails** → **Test**
   - Add email addresses you want to send to
   - Resend will send a verification email
   - Click the verification link
   - ✅ Now you can send emails to those addresses

**This is perfect if:**
- You're just starting out
- You're in development/testing phase
- You don't have a domain yet
- You want to test email confirmations quickly

#### Option B: Get a Free Domain (Recommended for Production)
**Perfect for: Production apps, professional setup**

**Free Domain Options:**
1. **Freenom** (https://www.freenom.com) - Free `.tk`, `.ml`, `.ga` domains
2. **GitHub Student Pack** - Free domain with Namecheap
3. **Cloudflare** - Domain registration (not free, but cheap ~$8/year)
4. **Namecheap** - Often has promotions for $1-2/year domains

**Then verify it in Resend:**
1. Go to Resend Dashboard → **Domains** → **Add Domain**
2. Enter your domain (e.g., `yourdomain.tk`)
3. Follow DNS setup instructions
4. Wait for verification (usually a few minutes)
5. ✅ Use `noreply@yourdomain.tk` as sender email

#### Option C: Use Your Personal Email Domain (If You Have One)
**Perfect for: Personal projects, if you already have email hosting**

If you have a personal email (like `yourname@gmail.com`), you can:
- Use Gmail SMTP directly (see Option D below)
- Or if you have your own domain email, verify that domain in Resend

#### Option D: Use Gmail SMTP Instead (Alternative - No Domain Needed)
**Perfect for: Quick setup, personal projects**

If you don't want to use Resend, you can use Gmail SMTP directly:
- See `FIX_EMAIL_CONFIRMATION_GMAIL.md` for Gmail SMTP setup
- No domain verification needed
- Uses your Gmail account
- Free (with Gmail limits)

---

## 🚀 Quick Start: Using Resend Test Email (No Domain Required)

**This is the fastest way to get started:**

1. **Sign up for Resend**: https://resend.com
2. **Skip domain verification** - you don't need it!
3. **Create API key** (Part 1, Step 3)
4. **In Supabase SMTP settings**, use:
   - **Sender Email**: `onboarding@resend.dev`
   - **Username**: `resend`
   - **Password**: [Your Resend API Key]
5. **Verify recipient emails** in Resend Dashboard:
   - Go to: **Emails** → **Test**
   - Add the email addresses you'll be sending to (e.g., `student@tup.edu.ph`)
   - Verify them by clicking the link in the verification email
6. **Done!** You can now send confirmation emails

**Note**: You'll need to verify each recipient email address before sending. This is a security feature to prevent spam.

### Step 3: Create an API Key
1. In Resend Dashboard, go to: **API Keys** (left sidebar)
2. Click **"Create API Key"** (top right)
3. Give it a name: `Supabase SecureShare`
4. Select permissions: **"Sending access"** (or **"Full access"**)
5. Click **"Create API Key"**
6. **⚠️ IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
   - It will look like: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Save it somewhere safe (password manager, notes app, etc.)

---

## Part 2: Configure Resend in Supabase

### Step 1: Navigate to Supabase SMTP Settings
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth**
2. Scroll down to the **"SMTP Settings"** section
3. You'll see a toggle: **"Enable Custom SMTP"**

### Step 2: Enable and Configure SMTP
1. **Toggle ON** "Enable Custom SMTP"
2. Fill in the following fields:

   **Host:**
   ```
   smtp.resend.com
   ```

   **Port:**
   ```
   587
   ```
   (Alternative: `465` for SSL, but `587` is recommended)

   **Username:**
   ```
   resend
   ```
   (This is literal - type "resend" exactly as shown)

   **Password:**
   ```
   [Paste your Resend API key here]
   ```
   (The API key you copied in Part 1, Step 3)

   **Sender Email:**
   ```
   [Your verified domain email or onboarding@resend.dev for testing]
   ```
   - If you verified a domain: `noreply@yourdomain.com`
   - For testing: `onboarding@resend.dev` (limited functionality)

   **Sender Name:**
   ```
   SecureShare
   ```

3. Click **"Save"** at the bottom of the page
4. ✅ You should see a success message

---

## Part 3: Test the Configuration

### Step 1: Enable Email Confirmations (if not already done)
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers**
2. Click on **"Email"** provider
3. **Enable "Confirm email"** toggle
4. Click **"Save"**

### Step 2: Test Email Sending
1. Try signing up with Google OAuth using a `@tup.edu.ph` email
2. Check your email inbox (and spam folder)
3. You should receive a confirmation email from Resend

### Step 3: Verify in Resend Dashboard
1. Go to Resend Dashboard: **https://resend.com/emails**
2. Navigate to: **Emails** (left sidebar)
3. You should see your test email:
   - Status: **"Delivered"** (green)
   - Click on it to see details (opens, clicks, etc.)
   - If it shows "Bounced" or "Failed", check the reason

---

## Part 4: Configure Email Template (Optional but Recommended)

### Step 1: Copy Your Email Template
1. Open: `supabase/templates/confirmation.html`
2. Copy the entire HTML content

### Step 2: Paste in Supabase Dashboard
1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates**
2. Click on **"Confirm signup"** template
3. **Subject**: `Welcome to SecureShare - Confirm Your Email`
4. **Body**: Paste the HTML from `confirmation.html`
5. Click **"Save"**

---

## Troubleshooting

### Issue: "Authentication failed" in Supabase
**Solution:**
- Double-check your API key is correct (no extra spaces)
- Make sure Username is exactly `resend` (lowercase, no quotes)
- Verify the API key has "Sending access" permissions in Resend
- Make sure you're using `smtp.resend.com` (not `api.resend.com`)

### Issue: Emails not arriving
**Check:**
1. **Resend Dashboard**: Go to Resend → Emails
   - Look for your email
   - Check status (Delivered, Bounced, Failed, etc.)
   - Click on email to see detailed logs
2. **Spam Folder**: Check recipient's spam/junk folder
3. **Supabase Auth Logs**: Dashboard → Authentication → Logs
   - Look for sign_up events
   - Check email delivery status

### Issue: "Sender not verified" or "Domain not verified"
**Solution:**
- For production: Verify your domain in Resend (Part 1, Step 2, Option A)
- For testing: Use `onboarding@resend.dev` (limited)
- The "Sender Email" in Supabase must match a verified domain or use the test email

### Issue: Rate limits
**Solution:**
- Free tier: 3,000 emails/month (100 emails/day)
- Upgrade to paid plan for more: https://resend.com/pricing
- Check your usage in Resend Dashboard → Settings → Usage

### Issue: Using test email `onboarding@resend.dev`
**Limitations:**
- Can only send to verified email addresses
- Limited functionality
- **For production**: Verify your own domain

---

## Quick Reference

### Resend SMTP Settings for Supabase:
```
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Your Resend API Key]
Sender Email: [Your verified domain email or onboarding@resend.dev]
Sender Name: SecureShare
```

### Resend Dashboard Links:
- **Main Dashboard**: https://resend.com/emails
- **API Keys**: https://resend.com/api-keys
- **Domains**: https://resend.com/domains
- **Emails (Activity)**: https://resend.com/emails
- **Settings**: https://resend.com/settings

### Supabase Dashboard Links:
- **SMTP Settings**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth
- **Email Provider**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers
- **Email Templates**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates
- **Auth Logs**: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/logs

---

## Resend vs SendGrid Comparison

| Feature | Resend | SendGrid |
|---------|--------|----------|
| **Free Tier** | 3,000 emails/month | 100 emails/day |
| **Setup Complexity** | Simple | Moderate |
| **API** | Modern, RESTful | RESTful |
| **Dashboard** | Clean, developer-friendly | Feature-rich |
| **Deliverability** | Excellent | Excellent |
| **Best For** | Developers, startups | Enterprise, high volume |

**Recommendation**: 
- **Resend**: Better for developers, simpler setup, more free emails
- **SendGrid**: Better for enterprise, more features, higher volume

---

## Next Steps

1. ✅ Resend account created
2. ✅ Domain verified (or using test email)
3. ✅ API key created
4. ✅ SMTP configured in Supabase
5. ✅ Email confirmations enabled
6. ✅ Email template configured
7. ✅ Test email sent successfully

**You're all set!** Confirmation emails will now be sent via Resend with your custom SecureShare branding.

---

## Additional Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend SMTP Settings**: https://resend.com/docs/send-with-smtp
- **Resend Domain Verification**: https://resend.com/docs/dashboard/domains/introduction
- **Supabase Email Documentation**: https://supabase.com/docs/guides/auth/auth-email

---

## Quick Setup Checklist

- [ ] Sign up at https://resend.com
- [ ] Verify domain (or use test email for testing)
- [ ] Create API key in Resend Dashboard
- [ ] Copy API key (save it securely)
- [ ] Go to Supabase → Settings → Auth → SMTP
- [ ] Enable "Enable Custom SMTP"
- [ ] Fill in:
  - Host: `smtp.resend.com`
  - Port: `587`
  - Username: `resend`
  - Password: [Your Resend API Key]
  - Sender Email: [Your verified email]
  - Sender Name: `SecureShare`
- [ ] Click "Save"
- [ ] Enable email confirmations in Supabase
- [ ] Test signup flow
- [ ] Check Resend Dashboard for email status

