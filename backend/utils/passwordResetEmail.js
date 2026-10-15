async function sendPasswordResetEmail(email, token) {
  const { RESEND_API_KEY, RESEND_FROM } = process.env;
  if (!RESEND_API_KEY || !RESEND_FROM) {
    throw Object.assign(new Error('Password reset email configuration is incomplete'), { code: 'EMAIL_CONFIG' });
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = new URL(`/reset-password?token=${encodeURIComponent(token)}`, frontendUrl).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email],
        subject: 'Reset your password',
        text: `We received a request to reset your password. Use this link within 15 minutes:\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>We received a request to reset your password.</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw Object.assign(new Error(`Email API request failed (${response.status}): ${details.slice(0, 500)}`), {
        code: 'EMAIL_API_ERROR',
      });
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('Email API request timed out'), { code: 'EMAIL_API_TIMEOUT' });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { sendPasswordResetEmail };
