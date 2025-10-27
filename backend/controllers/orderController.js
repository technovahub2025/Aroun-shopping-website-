const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/productModel');

// Create order from cart or items passed in body
exports.createOrder = async (req, res) => {
  try {
    const { items, shipping, paymentMethod } = req.body;

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

    // compute total
    const totalPrice = orderItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);

    const orderData = {
      user: req.user._id,
      items: orderItems,
      shipping: shipping || {},
      payment: { method: paymentMethod || 'dummy', status: 'pending' },
      totalPrice,
    };

    // If caller provided paymentResult (from dummy gateway), mark as paid
    if (req.body.paymentResult) {
      orderData.payment.status = 'paid';
      orderData.payment.transactionId = req.body.paymentResult.id || req.body.paymentResult.transactionId;
    }

    const order = await Order.create(orderData);

    // Optionally clear cart
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json(order);
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
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // ensure user owns it or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
    const orders = await Order.find().populate('user', 'firstName lastName email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Update order status / payment
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus, transactionId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) order.payment.status = paymentStatus;
    if (transactionId) order.payment.transactionId = transactionId;

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update order' });
  }
};
