# Password reset email setup

Password reset email uses the Resend HTTPS API, which works on hosting plans that
block outbound SMTP. Create a Resend account, verify a sending domain, and create
an API key. Add these environment variables to the backend (including Render's
service environment):

```env
RESEND_API_KEY=re_your_api_key
RESEND_FROM=Aroun Store <no-reply@your-verified-domain.com>
FRONTEND_URL=https://aroun-shopping-website-ysi0.onrender.com
```

Set `RESEND_FROM` to an address on the verified sending domain. Set `FRONTEND_URL`
to the origin that serves the reset page so reset links open the correct site; the
development fallback is `http://localhost:5173`. Password-reset links expire
after 15 minutes and can only be used once. New password registrations require
an email address. The Resend free plan currently includes 3,000 emails per month,
with a 100-email daily limit.

On Render, set `FRONTEND_URL` to the value above in the backend service's
Environment settings and save/redeploy. Render environment variables override
the local `.env` file. Request a new password-reset email after updating the
setting; links in previously sent emails keep their original destination.

The backend serves a standalone form at `GET /reset-password?token=...`, so
the Render backend URL can host the reset page without deploying the React
frontend there. The form submits to `POST /api/auth/reset-password` on the same
origin. Deploy the updated backend code as well as the environment setting.
