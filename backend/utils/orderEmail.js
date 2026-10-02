const nodemailer = require('nodemailer');
let transport;

function buildOrderEmail(order) {
  const shipping = order.shipping || {};
  const name = [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || 'Not provided';
  const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalPrice);
  return {
    subject: `New Order Received - Order #${order._id}`,
    text: [
      'New Order Received', '', `Order ID: #${order._id}`, '',
      `Customer Name: ${name}`, `Customer Email: ${shipping.email || 'Not provided'}`,
      `Customer Phone: ${shipping.phone || 'Not provided'}`, '', 'Products:',
      ...order.items.map(item => `${item.name} × ${item.quantity}`), '',
      `Total Amount: ${amount}`, `Payment Status: ${order.payment?.status || 'pending'}`, '',
      'Delivery Address:',
      [shipping.street, shipping.city, shipping.state, shipping.zipcode, shipping.country].filter(Boolean).join(', '), '',
      `Order Date: ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
      `Order Status: ${order.status}`,
    ].join('\n'),
  };
}

async function sendAdminOrderEmail(order) {
  const { ADMIN_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT || 587);
  if (!ADMIN_EMAIL || !SMTP_HOST || !SMTP_FROM || !Number.isInteger(port) || port < 1 || port > 65535 || Boolean(SMTP_USER) !== Boolean(SMTP_PASSWORD)) {
    throw Object.assign(new Error('Admin order email configuration is incomplete'), { code: 'EMAIL_CONFIG' });
  }
  if (!transport) {
    transport = nodemailer.createTransport({
      host: SMTP_HOST, port, secure: port === 465,
      ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {}),
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true,
    });
  }
  return transport.sendMail({ from: SMTP_FROM, to: ADMIN_EMAIL, ...buildOrderEmail(order) });
}

module.exports = { buildOrderEmail, sendAdminOrderEmail };
