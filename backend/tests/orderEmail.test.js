const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { sendAdminOrderEmail } = require('../utils/orderEmail');

test('SMTP config is read at send time and delivery uses only environment addresses', async () => {
  const names = ['ADMIN_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
  const original = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const order = { _id: 'order-1', items: [], totalPrice: 100, status: 'Pending', createdAt: new Date() };
  try {
    for (const name of names) delete process.env[name];
    await assert.rejects(sendAdminOrderEmail(order), { code: 'EMAIL_CONFIG' });
    Object.assign(process.env, { ADMIN_EMAIL: 'admin@example.test', SMTP_HOST: 'smtp.example.test', SMTP_PORT: '465', SMTP_USER: 'smtp-user', SMTP_PASSWORD: 'test-only', SMTP_FROM: 'shop@example.test' });
    let message;
    const create = mock.method(nodemailer, 'createTransport', options => {
      assert.equal(options.secure, true);
      assert.equal(options.host, process.env.SMTP_HOST);
      assert.equal(options.auth.pass, process.env.SMTP_PASSWORD);
      return { sendMail: async mail => { message = mail; return { messageId: 'test-message' }; } };
    });
    assert.equal((await sendAdminOrderEmail(order)).messageId, 'test-message');
    assert.equal(message.to, process.env.ADMIN_EMAIL);
    assert.equal(message.from, process.env.SMTP_FROM);
    assert.equal(create.mock.callCount(), 1);
  } finally {
    mock.restoreAll();
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
