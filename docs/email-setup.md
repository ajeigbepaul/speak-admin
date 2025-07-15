# Email Setup Guide

This guide will help you configure real email sending instead of using test services like Mailtrap.

## Option 1: Gmail SMTP (Recommended for Development)

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate an App Password

1. Go to Google Account settings → Security
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Copy the generated 16-character password

### Step 3: Configure Environment Variables

Create or update your `.env.local` file with:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=Speak Admin <your-email@gmail.com>
```

## Option 2: Outlook/Hotmail SMTP

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM=Speak Admin <your-email@outlook.com>
```

## Option 3: Custom SMTP Server

If you have your own domain with email hosting:

```env
EMAIL_HOST=mail.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=Speak Admin <noreply@yourdomain.com>
```

## Option 4: Professional Email Services

### SendGrid

1. Sign up for a SendGrid account
2. Create an API key
3. Use these settings:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=Speak Admin <noreply@yourdomain.com>
```

### Mailgun

1. Sign up for a Mailgun account
2. Get your SMTP credentials
3. Use these settings:

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your-mailgun-password
EMAIL_FROM=Speak Admin <noreply@yourdomain.com>
```

## Testing Your Configuration

1. Restart your development server after updating environment variables
2. Check the console for "Email server is ready to send messages"
3. Try sending an invitation to a test email address
4. Check the recipient's inbox (and spam folder)

## Troubleshooting

### Common Issues:

1. **Authentication Failed**:

   - For Gmail: Make sure you're using an App Password, not your regular password
   - Check that 2FA is enabled

2. **Connection Timeout**:

   - Verify the SMTP host and port are correct
   - Check your firewall settings

3. **Emails Going to Spam**:

   - Use a proper "from" address with your domain
   - Consider setting up SPF/DKIM records for your domain
   - Use a professional email service like SendGrid for production

4. **Port Issues**:
   - Port 587: STARTTLS (recommended)
   - Port 465: SSL/TLS
   - Port 25: Unencrypted (not recommended)

## Production Recommendations

For production applications, consider:

1. **Professional Email Services**: SendGrid, Mailgun, or AWS SES
2. **Domain Authentication**: Set up SPF, DKIM, and DMARC records
3. **Email Templates**: Use proper HTML templates with inline CSS
4. **Rate Limiting**: Implement email sending rate limits
5. **Monitoring**: Set up email delivery monitoring and bounce handling

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment-specific configurations for different deployment environments
- Regularly rotate email passwords and API keys
- Monitor email sending logs for suspicious activity
