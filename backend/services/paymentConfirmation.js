const Order = require('../models/Order');
const Attempt = require('../models/PaymentAttempt');
const Product = require('../models/productModel');
const push = require('./pushService');

async function snapshotForFlutter(body) {
  if (!Array.isArray(body.cartItems)) return undefined; // Existing web checkout saves orders separately.
  const { cartItems, shippingDetails } = body;
  if (!cartItems.length || cartItems.length > 200 || cartItems.some(item =>
    !item || !/^[a-f\d]{24}$/i.test(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000)) {
    throw Object.assign(new Error('Invalid cart items'), { status: 400 });
  }
  const customer = shippingDetails?.customer;
  const address = shippingDetails?.shippingAddress;
  if (![customer?.name, customer?.contact, address?.line1, address?.city, address?.state, address?.pincode, address?.country]
    .every(value => typeof value === 'string' && value.trim() && value.length <= 500)) {
    throw Object.assign(new Error('Invalid shipping details'), { status: 400 });
  }
  const products = await Product.find({ _id: { $in: cartItems.map(item => item.id) } });
  const items = cartItems.map(item => {
    const product = products.find(value => String(value._id) === item.id);
    if (!product) throw Object.assign(new Error('Product no longer available'), { status: 400 });
    return { product: product._id, name: product.title, image: product.images?.[0], price: product.price, quantity: item.quantity };
  });
  // Matches Flutter's current zero shipping charge. Never trust client prices.
  const amount = Math.round(items.reduce((total, item) => total + item.price * item.quantity, 0) * 100);
  if (body.currency !== 'INR' || !Number.isSafeInteger(amount) || amount <= 0 || amount !== body.amount) {
    throw Object.assign(new Error('Cart total changed; refresh your cart before paying'), { status: 400 });
  }
  return {
    items, totalPrice: amount / 100,
    shipping: { firstName: customer.name.trim(), phone: customer.contact.trim(),
      street: [address.line1, typeof address.line2 === 'string' ? address.line2.slice(0, 500) : ''].filter(Boolean).join(', '),
      city: address.city, state: address.state, zipcode: address.pincode, country: address.country },
  };
}

async function confirmCaptured(payment, userId) {
  const attempt = await Attempt.findOne({ razorpayOrderId: payment.order_id });
  if (!attempt || (userId && String(attempt.user) !== String(userId))) {
    throw Object.assign(new Error('Payment order not found for this customer'), { status: 404 });
  }
  if (payment.status !== 'captured' || payment.amount !== attempt.amount || payment.currency !== attempt.currency) {
    throw Object.assign(new Error('Payment has not been captured for the expected amount'), { status: 409 });
  }
  let order;
  if (attempt.orderSnapshot) {
    const data = { ...attempt.orderSnapshot, user: attempt.user, status: 'Confirmed',
      payment: { method: 'razorpay', status: 'paid', transactionId: payment.id } };
    try {
      order = await Order.findOneAndUpdate({ razorpayOrderId: payment.order_id },
        { $setOnInsert: data }, { upsert: true, new: true, runValidators: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      order = await Order.findOne({ razorpayOrderId: payment.order_id });
    }
    await push.enqueue({ key: `order-confirmed:${order._id}`, user: attempt.user,
      title: 'Order confirmed', body: 'Your order has been confirmed.',
      data: { type: 'order_confirmed', orderId: String(order._id) } });
  }
  await push.enqueue({ key: `payment:${payment.id}`, user: attempt.user,
    title: 'Payment received', body: 'Your payment was received successfully.',
    data: { type: 'payment_received', paymentId: payment.id, orderId: String(order?._id || payment.order_id) } });
  return order;
}
module.exports = { snapshotForFlutter, confirmCaptured };
