const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/productModel');
const mongoose = require('mongoose');
const { ORDER_STATUSES } = require('../utils/orderStatus');
const orderEmail = require('../utils/orderEmail');
const validId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

// Create order from cart or items passed in body
exports.createOrder = async (req, res) => {
  try {
    const { items, shipping, paymentMethod } = req.body || {};
    if (!shipping || !['firstName', 'lastName', 'email', 'street', 'city', 'zipcode', 'phone'].every(key =>
      typeof shipping[key] === 'string' && shipping[key].trim() && shipping[key].length <= 500
    ) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email) || ['state', 'country'].some(key =>
      shipping[key] !== undefined && (typeof shipping[key] !== 'string' || shipping[key].length > 500)
    )) {
      return res.status(400).json({ message: 'Please provide valid customer and delivery details' });
    }
    if (items !== undefined && !Array.isArray(items)) return res.status(400).json({ message: 'Invalid order items' });
    if (paymentMethod !== undefined && !['cod', 'razorpay', 'dummy', 'card', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // If items not provided, use user's cart
    let orderItems = items;
    if (!orderItems || orderItems.length === 0) {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });
      orderItems = cart.items.map((i) => ({
        product: i.product,
        name: i.name,
        price: i.price,
        image: i.image,
        quantity: i.quantity,
      }));
    }

    if (orderItems.length > 200 || orderItems.some(item => !item || !mongoose.isObjectIdOrHexString(item.product) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000)) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }
    // Snapshot trusted catalog data rather than accepting client prices and names.
    const products = await Product.find({ _id: { $in: orderItems.map(item => item.product) } });
    const catalog = new Map(products.map(product => [String(product._id), product]));
    if (orderItems.some(item => !catalog.has(String(item.product)))) {
      return res.status(400).json({ message: 'An ordered product is no longer available' });
    }
    orderItems = orderItems.map(item => {
      const product = catalog.get(String(item.product));
      return { product: product._id, name: product.title, price: product.price, image: product.images?.[0], quantity: item.quantity };
    });
    const totalPrice = Math.round(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
    if (!Number.isFinite(totalPrice) || totalPrice < 0) return res.status(400).json({ message: 'Invalid order total' });

    const orderData = {
      user: req.user._id,
      items: orderItems,
      shipping: Object.fromEntries(['firstName', 'lastName', 'email', 'street', 'city', 'zipcode', 'phone', 'state', 'country']
        .filter(key => shipping[key] !== undefined).map(key => [key, shipping[key].trim()])),
      payment: { method: paymentMethod || 'dummy', status: 'pending' },
      totalPrice,
      status: 'Pending',
    };

    // If caller provided paymentResult (from dummy gateway), mark as paid
    if (req.body.paymentResult) {
      orderData.payment.status = 'paid';
      orderData.payment.transactionId = req.body.paymentResult.id || req.body.paymentResult.transactionId;
    }

    const order = await Order.create(orderData);

    // Optionally clear cart
    try {
      await Cart.findOneAndDelete({ user: req.user._id });
    } catch {
      console.error('Cart cleanup failed after saving order', String(order._id));
    }

    res.status(201).json(order);
    // Email failure must never turn a saved order into a failed checkout.
    void orderEmail.sendAdminOrderEmail(order).catch(error => {
      console.error('Admin order email failed', { orderId: String(order._id), code: error.code || 'EMAIL_SEND_FAILED' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// Get orders for current user
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Get single order (user or admin)
exports.getOrder = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // ensure user owns it or is admin
    if (req.user.role !== 'admin' && order.user?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

// Admin: list all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'firstName lastName email phone').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// A customer may cancel only before the order has been handed to shipping.
exports.cancelMyOrder = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['Pending', 'Confirmed', 'Processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Only new or processing orders can be cancelled' });
    }

    order.status = 'Cancelled';
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

// Admin status updates cannot change payment or customer data.
exports.updateOrderStatus = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const { status } = req.body || {};
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid order status' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order' });
  }
};
