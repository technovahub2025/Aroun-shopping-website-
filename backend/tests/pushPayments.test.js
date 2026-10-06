const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const Attempt = require('../models/PaymentAttempt');
const Order = require('../models/Order');
const Product = require('../models/productModel');
const Event = require('../models/PushEvent');
const push = require('../services/pushService');
const { confirmCaptured, snapshotForFlutter } = require('../services/paymentConfirmation');
const controller = require('../controllers/paymentController');
const Device = require('../models/PushDevice');
const deviceRouter = require('../routes/pushRoute');
const { protect } = require('../middleware/authmiddleware');
const user = '507f1f77bcf86cd799439011';
const product = '507f1f77bcf86cd799439012';
const payment = { id: 'pay_test', order_id: 'order_test', amount: 10000, currency: 'INR', status: 'captured' };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, sendStatus(code) { this.code = code; return this; } });
afterEach(() => { mock.restoreAll(); delete process.env.PUSH_ENABLED; delete process.env.RAZORPAY_WEBHOOK_SECRET; });

test('device endpoints require authentication and bind/delete using the logged-in user', async () => {
  assert.equal(deviceRouter.stack[0].handle, protect);
  const register = deviceRouter.stack.find(layer => layer.route?.methods.post).route.stack[0].handle;
  const unregister = deviceRouter.stack.find(layer => layer.route?.methods.delete).route.stack[0].handle;
  const update = mock.method(Device, 'findOneAndUpdate', async () => ({}));
  const remove = mock.method(Device, 'deleteOne', async () => ({}));
  const token = 'a'.repeat(150);
  const req = { user: { _id: user }, body: { token, user: product } };
  const next = error => { throw error; };
  await register(req, response(), next);
  await unregister(req, response(), next);
  assert.equal(update.mock.calls[0].arguments[1].$set.user, user);
  assert.deepEqual(remove.mock.calls[0].arguments[0], { token, user });
});

test('payment must belong to the authenticated customer and be captured for the recorded amount', async () => {
  mock.method(Attempt, 'findOne', async () => ({ user, amount: 10000, currency: 'INR' }));
  const enqueue = mock.method(push, 'enqueue', async () => {});
  for (const invalid of [{ ...payment, status: 'authorized' }, { ...payment, amount: 1 }, { ...payment, currency: 'USD' }]) {
    await assert.rejects(confirmCaptured(invalid, user));
  }
  await assert.rejects(confirmCaptured(payment, product));
  assert.equal(enqueue.mock.callCount(), 0);
});

test('captured payment upserts one server order and queues stable event keys on retries', async () => {
  mock.method(Attempt, 'findOne', async () => ({ user, amount: 10000, currency: 'INR', orderSnapshot: { items: [], totalPrice: 100 } }));
  const upsert = mock.method(Order, 'findOneAndUpdate', async () => ({ _id: product }));
  const enqueue = mock.method(push, 'enqueue', async () => {});
  await confirmCaptured(payment, user);
  await confirmCaptured(payment, user);
  assert.deepEqual(upsert.mock.calls[0].arguments[0], { razorpayOrderId: 'order_test' });
  assert.equal(upsert.mock.calls[0].arguments[1].$setOnInsert.payment.status, 'paid');
  assert.deepEqual(enqueue.mock.calls.map(call => call.arguments[0].key),
    [`order-confirmed:${product}`, 'payment:pay_test', `order-confirmed:${product}`, 'payment:pay_test']);
});

test('cart amount is checked against catalog prices instead of client prices', async () => {
  mock.method(Product, 'find', async () => [{ _id: product, price: 100, title: 'Product' }]);
  const body = { amount: 1, currency: 'INR', cartItems: [{ id: product, quantity: 1, price: 0.01 }],
    shippingDetails: { customer: { name: 'Customer', contact: '1234567890' }, shippingAddress: { line1: 'Street', city: 'City', state: 'State', pincode: '123456', country: 'India' } } };
  await assert.rejects(snapshotForFlutter(body), /Cart total changed/);
  const snapshot = await snapshotForFlutter({ ...body, amount: 10000 });
  assert.equal(snapshot.totalPrice, 100);
  assert.equal(snapshot.items[0].price, 100);
});

test('queue uses setOnInsert and tolerates a concurrent duplicate event', async () => {
  process.env.PUSH_ENABLED = 'true';
  const update = mock.method(Event, 'updateOne', async () => { throw Object.assign(new Error('duplicate'), { code: 11000 }); });
  await push.enqueue({ key: 'payment:pay_test', user, title: 'Payment received', body: 'Received', data: {} });
  assert.deepEqual(update.mock.calls[0].arguments[0], { key: 'payment:pay_test' });
  assert.ok(update.mock.calls[0].arguments[1].$setOnInsert);
});

test('webhook rejects altered raw payload and processes authentic captured payment', async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test-secret';
  mock.method(Attempt, 'findOne', async () => ({ user, amount: 10000, currency: 'INR' }));
  const enqueue = mock.method(push, 'enqueue', async () => {});
  const body = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: payment } } }));
  const signature = crypto.createHmac('sha256', 'test-secret').update(body).digest('hex');
  const invalid = response();
  await controller.razorpayWebhook({ body: Buffer.concat([body, Buffer.from(' ')]), headers: { 'x-razorpay-signature': signature } }, invalid);
  assert.equal(invalid.code, 400);
  assert.equal(enqueue.mock.callCount(), 0);
  const valid = response();
  await controller.razorpayWebhook({ body, headers: { 'x-razorpay-signature': signature } }, valid);
  assert.equal(valid.code, 200);
  assert.equal(enqueue.mock.callCount(), 1);
});
