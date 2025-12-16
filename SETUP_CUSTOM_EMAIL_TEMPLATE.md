# How to Set Up Custom Email Confirmation Template

This guide shows you how to set up the custom SecureShare email template for email confirmations when users sign up (including Google OAuth users).

## For Hosted Supabase (Production)

Since you're using hosted Supabase, you need to configure the email template via the Dashboard:

### Step 1: Navigate to Email Templates

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vlxkhqvsvfjjhathgakp
2. Click on **Authentication** in the left sidebar
3. Click on **Email Templates**

### Step 2: Customize Confirmation Email Template

1. Find the **"Confirm signup"** template section
2. Click **"Edit template"** or the edit icon
3. Set the **Subject** to:
   ```
   Welcome to SecureShare - Confirm Your Email
   ```
4. Copy the HTML content from `supabase/templates/confirmation.html`
5. Paste it into the **Body** field
6. Click **"Save"**

### Step 3: Verify Template Variables

Make sure the template uses the correct Supabase template variables:
- `{{ .ConfirmationURL }}` - This will be replaced with the actual confirmation link
- Other available variables:
  - `{{ .SiteURL }}` - Your site URL
  - `{{ .Email }}` - User's email address
  - `{{ .Token }}` - Confirmation token (if needed)
  - `{{ .TokenHash }}` - Hashed token (if needed)

### Step 4: Test the Template

1. Try signing up a new user (or use Google OAuth)
2. Check the email inbox
3. Verify the email looks correct with your custom styling

## For Local Development

If you're running Supabase locally, the `config.toml` file is already configured:

1. The template file is at: `supabase/templates/confirmation.html`
2. The config references it in `supabase/config.toml`:
   ```toml
   [auth.email.template.confirmation]
   subject = "Welcome to SecureShare - Confirm Your Email"
   content_path = "./supabase/templates/confirmation.html"
   ```

3. Restart Supabase:
   ```bash
   supabase stop
   supabase start
   ```

4. View emails in Inbucket: http://localhost:54504

## Template Features

The custom template includes:
- ✅ SecureShare branding with red (#8B0000) header
- ✅ Professional welcome message
- ✅ Large, clickable confirmation button
- ✅ Fallback link for copy/paste
- ✅ Expiration notice (24 hours)
- ✅ Support information
- ✅ Responsive design for mobile devices

## Template Variables Reference

Supabase provides these template variables:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The full URL to confirm the email |
| `{{ .SiteURL }}` | Your site URL from config |
| `{{ .Email }}` | User's email address |
| `{{ .Token }}` | Confirmation token (rarely needed) |
| `{{ .TokenHash }}` | Hashed token (rarely needed) |
| `{{ .RedirectTo }}` | Redirect URL after confirmation |

## Troubleshooting

### Template Not Showing

1. **Clear cache**: Sometimes Supabase caches templates
2. **Check file path**: Make sure the path in Dashboard matches the file location
3. **Verify syntax**: Check for any HTML syntax errors
4. **Test with new signup**: Create a new test account to see the template

### Variables Not Replacing

- Make sure you're using the correct variable syntax: `{{ .VariableName }}`
- Variables are case-sensitive
- Some variables may not be available in all email types

### Email Not Sending

1. **Check SMTP configuration**: Make sure SMTP is set up correctly
2. **Verify email confirmations enabled**: Dashboard → Authentication → Providers → Email → "Confirm email" should be ON
3. **Check spam folder**: Emails might be going to spam
4. **Review logs**: Dashboard → Logs → Auth Logs

## Additional Email Templates

You can also customize:

- **Invite email**: When inviting users
- **Magic link**: For passwordless login
- **Password reset**: When users reset passwords
- **Email change**: When users change their email

Each template can be customized in the same way via Dashboard → Authentication → Email Templates.

## Files Created

- `supabase/templates/confirmation.html` - The custom email template
- `supabase/config.toml` - Updated with template reference (for local dev)
- `SETUP_CUSTOM_EMAIL_TEMPLATE.md` - This guide

## Next Steps

1. ✅ Template file created
2. ⏳ Configure in Supabase Dashboard (for hosted)
3. ⏳ Test with a new signup
4. ⏳ Verify email appearance and functionality

