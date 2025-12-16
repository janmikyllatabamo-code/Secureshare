# Setting Up Resend WITHOUT a Domain (Quick Start Guide)

## 🎯 Perfect for: Developers without a domain, testing, MVP, learning

You don't need a domain to use Resend! Here's how to set it up quickly.

---

## Step 1: Sign Up for Resend (2 minutes)

1. Go to: **https://resend.com**
2. Click **"Get Started"**
3. Sign up with your email
4. Verify your email address

**✅ No domain needed!**

---

## Step 2: Create API Key (1 minute)

1. In Resend Dashboard, go to: **API Keys** (left sidebar)
2. Click **"Create API Key"**
3. Name: `Supabase SecureShare`
4. Permissions: **"Sending access"**
5. Click **"Create API Key"**
6. **⚠️ Copy the API key immediately!** (starts with `re_`)

---

## Step 3: Verify Recipient Emails (Important!)

**Since you're using the test email, you need to verify recipient addresses first.**

1. Go to Resend Dashboard → **Emails** → **Test**
2. Click **"Add Email"** or **"Verify Email"**
3. Enter the email addresses you'll be sending to:
   - For example: `student@tup.edu.ph`
   - Or your personal email for testing
4. Resend will send a verification email
5. **Check your inbox** and click the verification link
6. ✅ Email is now verified

**Repeat this for each email address you want to send confirmation emails to.**

**Pro Tip**: For testing, verify your own email first so you can test the flow.

---

## Step 4: Configure in Supabase (2 minutes)

1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/settings/auth**
2. Scroll to **"SMTP Settings"**
3. **Toggle ON** "Enable Custom SMTP"
4. Fill in:

   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Your Resend API Key - paste it here]
   Sender Email: onboarding@resend.dev
   Sender Name: SecureShare
   ```

5. Click **"Save"**

**✅ Done!**

---

## Step 5: Enable Email Confirmations

1. Go to: **https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp/auth/providers**
2. Click **"Email"** provider
3. **Enable "Confirm email"** toggle
4. Click **"Save"**

---

## Step 6: Test It!

1. **Make sure you've verified the recipient email** in Resend (Step 3)
2. Sign up with Google OAuth using a `@tup.edu.ph` email
3. **Important**: The email must be verified in Resend first!
4. Check your inbox for the confirmation email

---

## Important Notes

### ✅ What Works:
- Sending emails to verified addresses
- Testing your email confirmation flow
- Development and MVP stage
- Learning and experimentation

### ⚠️ Limitations:
- Must verify each recipient email address first
- Can only send to verified emails
- Uses `onboarding@resend.dev` as sender (not custom)
- Limited to Resend's test email functionality

### 🚀 When to Upgrade:
- When you're ready for production
- When you want custom sender email (e.g., `noreply@yourdomain.com`)
- When you want to send to any email without verification
- When you want professional branding

---

## Troubleshooting

### Issue: "Email not verified" error
**Solution:**
- Go to Resend Dashboard → **Emails** → **Test**
- Verify the recipient email address first
- Wait for verification email and click the link

### Issue: Can't verify recipient email
**Solution:**
- Check spam folder for verification email
- Make sure the email address is correct
- Try resending verification email in Resend Dashboard

### Issue: Want to send to any email without verification
**Solution:**
- You need to verify your own domain in Resend
- See `SETUP_RESEND_FOR_SUPABASE.md` for domain verification
- Or use Gmail SMTP (see `FIX_EMAIL_CONFIRMATION_GMAIL.md`)

---

## Quick Checklist

- [ ] Signed up for Resend
- [ ] Created API key (copied it)
- [ ] Verified recipient email(s) in Resend Dashboard
- [ ] Configured SMTP in Supabase:
  - Host: `smtp.resend.com`
  - Port: `587`
  - Username: `resend`
  - Password: [Your API Key]
  - Sender Email: `onboarding@resend.dev`
- [ ] Enabled email confirmations in Supabase
- [ ] Tested signup flow
- [ ] Received confirmation email ✅

---

## Next Steps: Getting a Domain (Optional)

When you're ready for production, you can:

1. **Get a free domain:**
   - Freenom: https://www.freenom.com (free `.tk`, `.ml` domains)
   - Or buy a cheap domain (~$1-10/year)

2. **Verify it in Resend:**
   - Go to Resend → **Domains** → **Add Domain**
   - Follow DNS setup instructions
   - Use `noreply@yourdomain.com` as sender

3. **Update Supabase SMTP:**
   - Change "Sender Email" to your domain email
   - Everything else stays the same

---

## Alternative: Use Gmail SMTP (No Domain, No Verification Needed)

If verifying recipient emails is too much hassle, you can use Gmail SMTP instead:

1. See `FIX_EMAIL_CONFIRMATION_GMAIL.md` for Gmail setup
2. No domain needed
3. No recipient verification needed
4. Uses your Gmail account directly

---

## Summary

**For Quick Testing (No Domain):**
- ✅ Use Resend with `onboarding@resend.dev`
- ✅ Verify recipient emails first
- ✅ Perfect for development and testing

**For Production:**
- 🚀 Get a domain (free or cheap)
- 🚀 Verify domain in Resend
- 🚀 Use custom sender email

**You're all set!** Start with the test email, upgrade to a domain when ready. 🎉

