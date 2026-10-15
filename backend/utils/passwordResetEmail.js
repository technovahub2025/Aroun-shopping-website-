const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(email, token) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT || 587);
  if (!SMTP_HOST || !SMTP_FROM || !Number.isInteger(port) || port < 1 || port > 65535 || Boolean(SMTP_USER) !== Boolean(SMTP_PASSWORD)) {
    throw Object.assign(new Error('Password reset email configuration is incomplete'), { code: 'EMAIL_CONFIG' });
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = new URL(`/reset-password?token=${encodeURIComponent(token)}`, frontendUrl).toString();
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port, secure: port === 465,
    ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {}),
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  return transport.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Reset your password',
    text: `We received a request to reset your password. Use this link within 15 minutes:\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendPasswordResetEmail };
