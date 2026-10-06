const mongoose = require('mongoose');
module.exports = mongoose.model('PushDevice', new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true }));
