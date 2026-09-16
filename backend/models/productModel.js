const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0 },
    category: { type: String, required: true }, 
    images: [String], // Image URLs (including signed Google Drive image routes)
    stock: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
    type: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true, optimisticConcurrency: true }
);

module.exports = mongoose.model("Product", productSchema);
