async function sendOrderCompletionEmail(order) {
  const { RESEND_API_KEY, RESEND_FROM } = process.env;
  if (!RESEND_API_KEY || !RESEND_FROM) {
    throw Object.assign(new Error('Order email configuration is incomplete'), { code: 'EMAIL_CONFIG' });
  }

  const customerName = [order.shipping?.firstName, order.shipping?.lastName].filter(Boolean).join(' ') || 'Customer';
  const orderId = String(order._id);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [order.shipping.email],
      subject: `Your order ${orderId} is complete`,
      text: `Hi ${customerName},\n\nYour order has been delivered successfully. Thank you for shopping with Aroun Store!\n\nOrder ID: ${orderId}`,
      html: `<p>Hi ${escapeHtml(customerName)},</p><p>Your order has been delivered successfully. Thank you for shopping with Aroun Store!</p><p>Order ID: ${escapeHtml(orderId)}</p>`,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const details = await response.text();
    throw Object.assign(new Error(`Email API request failed (${response.status}): ${details.slice(0, 500)}`), {
      code: 'EMAIL_API_ERROR',
    });
  }

  return response.json();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

module.exports = { sendOrderCompletionEmail };
