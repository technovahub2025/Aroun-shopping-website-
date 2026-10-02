const mongoose = require('mongoose');
const { ORDER_STATUSES, normalizeOrderStatus } = require('../utils/orderStatus');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  image: String,
  quantity: { type: Number, default: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shipping: {
    firstName: String,
    lastName: String,
    email: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zipcode: String,
    phone: String,
  },
  payment: {
    method: { type: String, default: 'dummy' },
    status: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
    transactionId: String,
  },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ORDER_STATUSES, default: 'Pending', get: normalizeOrderStatus },
}, { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } });

module.exports = mongoose.model('Order', orderSchema);
