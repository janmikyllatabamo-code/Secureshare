# How to Enable Email Confirmation in Supabase

Your Supabase project is currently configured with `enable_confirmations = false`, which is why confirmation emails aren't being sent.

## Option 1: Enable via Supabase Dashboard (Recommended for Production)

### Step 1: Navigate to Authentication Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp
2. Click on **Authentication** in the left sidebar
3. Click on **Providers** (or **Email**)

### Step 2: Enable Email Confirmations

1. Find the **Email** provider section
2. Look for **"Confirm email"** or **"Enable email confirmations"** toggle
3. **Turn it ON** ✅
4. Click **Save**

### Step 3: Configure SMTP (Optional but Recommended)

For production, you should configure SMTP to send emails reliably:

1. In the same **Email** provider section
2. Scroll down to **SMTP Settings**
3. Click **"Configure SMTP"** or **"Add SMTP"**
4. Enter your SMTP details:

**For Gmail:**
- **Host**: `smtp.gmail.com`
- **Port**: `587`
- **Username**: Your Gmail address
- **Password**: Your Gmail App Password (not your regular password)
  - To create an App Password: Google Account → Security → 2-Step Verification → App Passwords

**For SendGrid (Recommended for Production):**
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Username**: `apikey`
- **Password**: Your SendGrid API Key

**For Other Providers:**
- Check your email provider's SMTP documentation

5. **Sender email**: The email address that will send confirmation emails
6. **Sender name**: The name that will appear in emails (e.g., "SecureShare")
7. Click **Save**

### Step 4: Test Email Confirmation

1. Try signing up a new user
2. Check the user's email inbox (and spam folder)
3. The confirmation email should arrive within a few seconds

---

## Option 2: Enable via Config File (For Local Development)

If you're running Supabase locally, update your `supabase/config.toml`:

### Step 1: Update config.toml

Open `supabase/config.toml` and find the `[auth.email]` section:

```toml
[auth.email]
enable_signup = true
# Change this from false to true:
enable_confirmations = true  # ← Change this to true
```

### Step 2: Configure SMTP (Optional for Local)

For local development, you can use Inbucket (already enabled in your config) or configure SMTP:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.gmail.com"  # or your SMTP host
port = 587
user = "your-email@gmail.com"
pass = "your-app-password"
admin_email = "your-email@gmail.com"
sender_name = "SecureShare"
```

### Step 3: Restart Supabase

After making changes:

```bash
# Stop Supabase
supabase stop

# Start Supabase again
supabase start
```

### Step 4: View Emails in Inbucket (Local Only)

If using local Supabase with Inbucket:
1. Go to: http://localhost:54504
2. You'll see all emails sent by Supabase
3. Click on any email to view it

---

## Option 3: Verify Current Settings

To check if email confirmations are enabled:

### Via Dashboard:
1. Go to **Authentication** → **Providers** → **Email**
2. Check if **"Confirm email"** is enabled

### Via SQL:
Run this query in the SQL Editor:

```sql
SELECT 
    name,
    value
FROM auth.config
WHERE name LIKE '%email%' OR name LIKE '%confirmation%';
```

---

## Troubleshooting

### Emails Still Not Sending?

1. **Check SMTP Configuration**
   - Verify SMTP credentials are correct
   - Test SMTP connection
   - Check if your email provider requires "Less secure app access" or App Passwords

2. **Check Rate Limits**
   - Supabase has rate limits on emails
   - Default: 2 emails per hour (can be increased in Dashboard)

3. **Check Spam Folder**
   - Confirmation emails might go to spam
   - Check the sender email address

4. **Verify Email Templates**
   - Go to **Authentication** → **Email Templates**
   - Make sure templates are configured correctly

5. **Check Logs**
   - Go to **Logs** → **Auth Logs** in Dashboard
   - Look for email sending errors

### For Production:

1. **Use a Reliable SMTP Provider**
   - SendGrid (recommended)
   - AWS SES
   - Mailgun
   - Postmark

2. **Set Up Custom Domain**
   - Configure SPF, DKIM, and DMARC records
   - Improves email deliverability

3. **Monitor Email Delivery**
   - Check bounce rates
   - Monitor spam complaints
   - Set up webhooks for email events

---

## Quick Checklist

- [ ] Email confirmations enabled in Dashboard
- [ ] SMTP configured (for production)
- [ ] Sender email and name set
- [ ] Test signup and check email
- [ ] Check spam folder if email not received
- [ ] Verify email templates are correct

---

## Additional Resources

- [Supabase Auth Email Documentation](https://supabase.com/docs/guides/auth/auth-email)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)

