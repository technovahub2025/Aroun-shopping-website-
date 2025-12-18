const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  password: { type: String },
  otp: { type: String },
  otpExpire: { type: Date },
  address: {
    street: { type: String },
    city: { type: String },
    zipcode: { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
