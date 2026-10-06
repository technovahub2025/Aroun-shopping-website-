const mongoose = require('mongoose');
module.exports = mongoose.model('PushEvent', new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  body: String,
  data: { type: Map, of: String },
  sent: { type: Boolean, default: false },
  nextAttempt: { type: Date, default: Date.now, index: true },
}, { timestamps: true }));
