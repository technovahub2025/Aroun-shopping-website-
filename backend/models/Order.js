const mongoose = require('mongoose');

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
    zipcode: String,
    phone: String,
  },
  payment: {
    method: { type: String, default: 'dummy' },
    status: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
    transactionId: String,
  },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['created','processing','shipped','delivered','cancelled'], default: 'created' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
