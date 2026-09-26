const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  _id: { type: String },
  refreshToken: { type: String, required: true, select: false },
}, { timestamps: true });

module.exports = mongoose.model('DriveConnection', schema);
