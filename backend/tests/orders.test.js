const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/productModel');
const controller = require('../controllers/orderController');
const { ORDER_STATUSES } = require('../utils/orderStatus');
const { protect, admin } = require('../middleware/authmiddleware');
const router = require('../routes/orderRoute');

const id = '507f1f77bcf86cd799439011';
const productId = '507f1f77bcf86cd799439012';
const shipping = { firstName: 'Rahul', lastName: 'K', email: 'customer@example.test', phone: '9876543210', street: '10 Main Street', city: 'Puducherry', state: 'Puducherry', country: 'India', zipcode: '605001' };
const request = (body = {}) => ({ body, params: { id }, user: { _id: id, role: 'admin' } });
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const payload = () => ({ shipping, paymentMethod: 'cod', items: [{ product: productId, name: 'Forged', price: 1, quantity: 2 }] });
afterEach(() => mock.restoreAll());

test('schema defaults to Pending, preserves address, and rejects invalid statuses', async () => {
  const order = new Order({ user: id, totalPrice: 200, shipping });
  assert.equal(order.status, 'Pending');
  assert.equal(order.shipping.state, 'Puducherry');
  assert.equal(order.shipping.country, 'India');
  for (const status of ORDER_STATUSES) { order.status = status; await order.validate(); }
  order.status = 'arbitrary';
  await assert.rejects(order.validate());
});

test('legacy database statuses serialize using the new vocabulary', () => {
  for (const [legacy, expected] of Object.entries({ created: 'Pending', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' })) {
    assert.equal(Order.hydrate({ _id: id, status: legacy }).toJSON().status, expected);
  }


});

test('cart fallback remains supported and cleanup failure does not fail a saved order', async () => {
  mock.method(Cart, 'findOne', async () => ({ items: [{ product: new mongoose.Types.ObjectId(productId), quantity: 1 }] }));
  mock.method(Product, 'find', async () => [{ _id: productId, title: 'T-Shirt', price: 650 }]);
  mock.method(Order, 'create', async data => new Order({ ...data, createdAt: new Date() }));
  mock.method(Cart, 'findOneAndDelete', async () => { throw new Error('cleanup failed'); });
  mock.method(console, 'error', () => {});
  const res = response();
  await controller.createOrder(request({ shipping, paymentMethod: 'cod' }), res);
  assert.equal(res.statusCode, 201);
});

test('invalid shipping, items, product IDs and quantities are rejected before saving', async () => {
  const save = mock.method(Order, 'create', async () => {});
  for (const body of [{ ...payload(), shipping: {} }, { ...payload(), items: {} }, ...[0, -1, 1.5, '2'].map(quantity => ({ ...payload(), items: [{ product: productId, quantity }] })), { ...payload(), items: [{ product: 'invalid', quantity: 1 }] }]) {
    const res = response();
    await controller.createOrder(request(body), res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(save.mock.callCount(), 0);
});

test('all six statuses persist and status endpoint ignores unrelated fields', async () => {
  const order = new Order({ user: id, totalPrice: 100, payment: { status: 'pending' } });
  const saved = [];
  order.save = async () => { await order.validate(); saved.push(order.status); };
  mock.method(Order, 'findById', async () => order);
  for (const status of ORDER_STATUSES) {
    const res = response();
    await controller.updateOrderStatus(request({ status, paymentStatus: 'paid', totalPrice: 1 }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, status);
    assert.equal(order.payment.status, 'pending');
    assert.equal(order.totalPrice, 100);
  }
  assert.deepEqual(saved, ORDER_STATUSES);
});

test('invalid status and ID give 400, missing order gives 404, database failure gives safe 500', async () => {
  const find = mock.method(Order, 'findById', async () => null);
  for (const status of ['created', 'pending', 'invalid', null, undefined, { value: 'Pending' }]) {
    const res = response();
    await controller.updateOrderStatus(request({ status }), res);
    assert.equal(res.statusCode, 400);
  }
  const invalid = request({ status: 'Pending' }); invalid.params.id = 'bad';
  const res = response(); await controller.updateOrderStatus(invalid, res);
  assert.equal(res.statusCode, 400);
  assert.equal(find.mock.callCount(), 0);
  const missing = response(); await controller.updateOrderStatus(request({ status: 'Pending' }), missing);
  assert.equal(missing.statusCode, 404);
  find.mock.mockImplementation(async () => { throw new Error('secret database error'); });
  mock.method(console, 'error', () => {});
  const failed = response(); await controller.updateOrderStatus(request({ status: 'Pending' }), failed);
  assert.equal(failed.statusCode, 500);
  assert.equal(failed.body.message, 'Failed to update order');
});

test('existing list and update routes enforce authentication and admin middleware', async () => {
  for (const [path, method] of [['/', 'get'], ['/:id', 'put']]) {
    const route = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route;
    assert.equal(route.stack[0].handle, protect);
    assert.equal(route.stack[1].handle, admin);
  }
  const unauthenticated = response();
  await protect({ headers: {} }, unauthenticated, () => assert.fail('must not authenticate'));
  assert.equal(unauthenticated.statusCode, 401);
  const customer = response();
  admin({ user: { role: 'user' } }, customer, () => assert.fail('must not authorize'));
  assert.equal(customer.statusCode, 403);
  let authorized = false;
  admin({ user: { role: 'admin' } }, response(), () => { authorized = true; });
  assert.ok(authorized);
});

test('order detail protects ownership and handles deleted customers for admin', async () => {
  mock.method(Order, 'findById', () => ({ populate: async () => ({ _id: id, user: null }) }));
  const res = response(); await controller.getOrder(request(), res);
  assert.equal(res.statusCode, 200);
  const req = request(); req.user.role = 'user';
  const denied = response(); await controller.getOrder(req, denied);
  assert.equal(denied.statusCode, 403);
});

test('customer cancellation supports pending, confirmed and legacy processing orders', async () => {
  for (const status of ['Pending', 'Confirmed', 'processing']) {
    const order = Order.hydrate({ _id: id, user: id, totalPrice: 10, status });
    order.save = async () => order.validate();
    mock.method(Order, 'findOne', async () => order);
    const res = response(); await controller.cancelMyOrder(request(), res);
    assert.equal(res.body.status, 'Cancelled');
  }
});

test('admin and customer lists use the same Order model with correct scope', async () => {
  const filters = [];
  const orders = [{ _id: id, status: 'Pending' }];
  mock.method(Order, 'find', filter => {
    filters.push(filter);
    return { sort: async () => orders, populate() { return this; } };
  });
  const all = response(); await controller.getAllOrders(request(), all);
  const mine = response(); await controller.getMyOrders(request(), mine);
  assert.deepEqual(filters, [undefined, { user: id }]);
  assert.deepEqual(all.body, orders);
  assert.deepEqual(mine.body, orders);
});
