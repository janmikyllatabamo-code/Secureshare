# Quick Email Confirmation Fix Checklist

## ⚡ Quick Fix (5 minutes)

### 1. Enable Email Confirmations
- [ ] Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers
- [ ] Click **"Email"** provider
- [ ] **Enable "Confirm email"** toggle
- [ ] Click **Save**

### 2. Configure SMTP (Choose ONE)

#### Option A: Resend (Recommended - Free 3,000 emails/month)
**🎯 No domain? Use test email - see `SETUP_RESEND_NO_DOMAIN.md`**

- [ ] Sign up: https://resend.com
- [ ] **Choose one:**
  - **No domain?** Use `onboarding@resend.dev` (verify recipient emails first)
  - **Have domain?** Verify domain in Resend Dashboard
- [ ] Create API key
- [ ] **If using test email:** Verify recipient emails in Resend → Emails → Test
- [ ] Go to: Dashboard → Settings → Auth → SMTP
- [ ] Enable "Enable Custom SMTP"
- [ ] Fill in:
  - Host: `smtp.resend.com`
  - Port: `587`
  - Username: `resend`
  - Password: [Your Resend API key]
  - Sender email: `onboarding@resend.dev` (no domain) OR `noreply@yourdomain.com` (with domain)
  - Sender name: `SecureShare`
- [ ] Click **Save**
- [ ] See `SETUP_RESEND_NO_DOMAIN.md` (no domain) or `SETUP_RESEND_FOR_SUPABASE.md` (with domain)

#### Option B: SendGrid (Alternative - Free 100 emails/day)
- [ ] Sign up: https://sendgrid.com
- [ ] Create API key
- [ ] Go to: Dashboard → Settings → Auth → SMTP
- [ ] Enable "Enable Custom SMTP"
- [ ] Fill in:
  - Host: `smtp.sendgrid.net`
  - Port: `587`
  - Username: `apikey`
  - Password: [Your SendGrid API key]
  - Sender email: [Your verified email]
  - Sender name: `SecureShare`
- [ ] Click **Save**
- [ ] See `SETUP_SENDGRID_FOR_SUPABASE.md` for detailed guide

#### Option C: Gmail SMTP
- [ ] Go to: https://support.google.com/accounts/answer/185833
- [ ] Create App Password for your Gmail
- [ ] Go to: Dashboard → Settings → Auth → SMTP
- [ ] Enable "Enable Custom SMTP"
- [ ] Fill in:
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Username: [Your Gmail]
  - Password: [App Password]
  - Sender email: [Your Gmail]
  - Sender name: `SecureShare`
- [ ] Click **Save**

### 3. Configure Email Template
- [ ] Go to: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/templates
- [ ] Click **"Confirm signup"** template
- [ ] Subject: `Welcome to SecureShare - Confirm Your Email`
- [ ] Body: Copy from `supabase/templates/confirmation.html`
- [ ] Click **Save**

### 4. Test
- [ ] Sign up with Google OAuth
- [ ] Check email inbox (and spam folder)
- [ ] Click confirmation link

## ✅ Verification

After configuration, check:
- [ ] Supabase Auth Logs show email "sent" status
- [ ] Email received in inbox
- [ ] Confirmation link works

## 📋 Full Instructions

See `FIX_EMAIL_CONFIRMATION_GMAIL.md` for detailed troubleshooting.

