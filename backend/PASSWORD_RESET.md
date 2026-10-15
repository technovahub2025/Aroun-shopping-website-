# Password reset email setup

Password reset uses the same SMTP account settings as order email. Configure these
environment variables for the backend:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=Your Shop <no-reply@example.com>
FRONTEND_URL=https://your-store.example.com
```

Use the sender address accepted by your SMTP provider. For unauthenticated relays,
omit both `SMTP_USER` and `SMTP_PASSWORD`. Set `FRONTEND_URL` to the deployed
frontend origin so reset links open the correct site; the development fallback is
`http://localhost:5173`. Password-reset links expire after 15 minutes and can only
be used once. New password registrations require an email address.
