const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    categories: [String],
    images: [String], // Cloudinary URLs
    stock: { type: Number, default: 0 }, // Available quantity
  
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
