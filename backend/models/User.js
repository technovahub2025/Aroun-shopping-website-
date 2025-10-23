const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  
  phone: { type: String, unique: true, sparse: true },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  otp: { type: String },
  otpExpire: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
