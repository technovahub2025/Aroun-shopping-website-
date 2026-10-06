const mongoose = require('mongoose');
module.exports = mongoose.model('PaymentAttempt', new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: Number,
  currency: String,
  orderSnapshot: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));
