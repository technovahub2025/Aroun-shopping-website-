# Password reset email setup

Password reset email uses the Resend HTTPS API, which works on hosting plans that
block outbound SMTP. Create a Resend account, verify a sending domain, and create
an API key. Add these environment variables to the backend (including Render's
service environment):

```env
RESEND_API_KEY=re_your_api_key
RESEND_FROM=Aroun Store <no-reply@your-verified-domain.com>
FRONTEND_URL=https://your-store.example.com
```

Set `RESEND_FROM` to an address on the verified sending domain. Set `FRONTEND_URL`
to the deployed frontend origin so reset links open the correct site; the
development fallback is `http://localhost:5173`. Password-reset links expire
after 15 minutes and can only be used once. New password registrations require
an email address. The Resend free plan currently includes 3,000 emails per month,
with a 100-email daily limit.
