const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    discount: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    category: { type: String, required: true }, 
    images: [String], // Image URLs (including signed Google Drive image routes)
    stock: { type: Number, default: 0 }, 
  },
  { timestamps: true }
);

productSchema.index({ price: 1, _id: 1 });
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ category: 1, _id: 1 });

module.exports = mongoose.model("Product", productSchema);
