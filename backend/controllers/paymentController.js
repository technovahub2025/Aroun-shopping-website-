const crypto = require('crypto');
const Attempt = require('../models/PaymentAttempt');
const { snapshotForFlutter, confirmCaptured } = require('../services/paymentConfirmation');

const razorpayRequest = async (path, body) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured on the server');
    error.status = 503;
    throw error;
  }

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.description || 'Razorpay request failed');
    error.status = response.status >= 500 ? 502 : response.status;
    throw error;
  }
  return data;
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive integer in paise' });
    }
    const orderSnapshot = await snapshotForFlutter({ ...req.body, currency });
    const order = await razorpayRequest('/orders', {
      amount,
      currency,
      ...(receipt ? { receipt: String(receipt).slice(0, 40) } : {}),
      ...(notes && typeof notes === 'object' ? { notes } : {}),
    });
    await Attempt.create({ razorpayOrderId: order.id, user: req.user._id,
      amount: order.amount, currency: order.currency, orderSnapshot });
    return res.json({ order });
  } catch (err) {
    console.error('Razorpay order creation failed:', err.message);
    return res.status(err.status || 502).json({ message: err.message || 'Unable to create payment order' });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ message: 'Razorpay is not configured on the server' });
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing Razorpay payment details' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest();
  let received;
  try {
    received = Buffer.from(razorpay_signature, 'hex');
  } catch {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(400).json({ message: 'Payment verification failed' });
  }
  try {
    const payment = await razorpayRequest(`/payments/${encodeURIComponent(razorpay_payment_id)}`);
    if (payment.order_id !== razorpay_order_id) return res.status(400).json({ message: 'Payment order mismatch' });
    const order = await confirmCaptured(payment, req.user._id);
    return res.json({ success: true, orderId: order?._id,
      payment: { id: razorpay_payment_id, orderId: razorpay_order_id, verified: true } });
  } catch (error) {
    return res.status(error.status || 502).json({ message: error.message || 'Unable to confirm payment' });
  }
};

exports.razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.sendStatus(503);
  const signature = req.headers['x-razorpay-signature'];
  if (!Buffer.isBuffer(req.body) || typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return res.sendStatus(400);
  const expected = crypto.createHmac('sha256', secret).update(req.body).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return res.sendStatus(400);
  try {
    const event = JSON.parse(req.body.toString('utf8'));
    if (event.event === 'payment.captured') {
      await confirmCaptured(event.payload.payment.entity);
    }
    return res.sendStatus(200);
  } catch (error) {
    // Non-2xx lets Razorpay retry transient DB/queue failures.
    console.error('Payment webhook failed:', error.name);
    return res.sendStatus(500);
  }
};

// Legacy dummy payment controller to simulate payment gateway
exports.processPayment = async (req, res) => {
  try {
    const { amount, currency = 'INR', paymentMethod = 'card', simulate = 'success' } = req.body;

    // Basic validation
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // Simulate delay
    await new Promise((r) => setTimeout(r, 500));

    if (simulate === 'fail') {
      return res.status(402).json({ status: 'failed', message: 'Payment declined (simulated)' });
    }

    // Return dummy transaction data
    const transaction = {
      id: 'tx_' + Math.random().toString(36).slice(2, 10),
      amount,
      currency,
      method: paymentMethod,
      status: 'success',
      createdAt: new Date(),
    };

    res.json({ status: 'success', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Payment processing failed' });
  }
};
