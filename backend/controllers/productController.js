const Product = require("../models/productModel");
const cloudinary = require("../utils/cloudinary");

// Helper to upload multiple images
const uploadImages = async (files) => {
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: "products" }, (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }).end(file.buffer);
        })
    )
  );
};

// CREATE product
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, rating, categories, stock} = req.body;

    // Upload images
    const imageUrls = req.files && req.files.length > 0 ? await uploadImages(req.files) : [];

    const product = await Product.create({
      title,
      description,
      price,
      rating,
      categories: categories.split(",").map((c) => c.trim()),
      images: imageUrls,
      stock: stock ? Number(stock) : 0,
   
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

// READ all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// READ single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// UPDATE product
exports.updateProduct = async (req, res) => {
  try {
    const { title, description, price, rating, categories, stock } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Update fields if provided
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (rating) product.rating = rating;
    if (categories) product.categories = categories.split(",").map((c) => c.trim());
    if (stock !== undefined) product.stock = Number(stock);
  

    // Append new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImageUrls = await uploadImages(req.files);
      product.images = product.images.concat(newImageUrls);
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product" });
  }
};
