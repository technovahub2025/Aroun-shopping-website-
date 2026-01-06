const Product = require("../models/productModel");
const cloudinary = require("../utils/cloudinary");

// Helper function to upload multiple images
const uploadImages = async (files) => {
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          ).end(file.buffer);
        })
    )
  );
};

const extractPublicId = (url) => {
  const uploadIndex = url.indexOf("/upload/");
  const publicPath = url.substring(uploadIndex + 8); // after /upload/
  const withoutVersion = publicPath.replace(/v\d+\//, "");
  const publicId = withoutVersion.substring(
    0,
    withoutVersion.lastIndexOf(".")
  );
  return publicId;
};

// ✅ CREATE Product
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, rating, category, stock ,mrp,discount} = req.body;

    // Upload images to Cloudinary
    const imageUrls =
      req.files && req.files.length > 0 ? await uploadImages(req.files) : [];

    const product = await Product.create({
      title,
      description,
      price,
      rating,
      category, // single category
      images: imageUrls,
      mrp: mrp ? Number(mrp) : 0,
      discount: discount ? Number(discount) : 0,
      stock: stock ? Number(stock) : 0,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

// ✅ READ All Products (with optional category filter)
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query; // optional filter
    const query = category ? { category } : {};
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// ✅ READ Single Product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// ✅ UPDATE Product
exports.updateProduct = async (req, res) => {
  try {
    const { title, description, price, rating, category, stock ,mrp,discount} = req.body;

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    // Update only provided fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (rating) product.rating = rating;
    if (category) product.category = category;
    if(mrp) product.mrp = Number(mrp);
    if(discount) product.discount = Number(discount);
    if (stock !== undefined) product.stock = Number(stock);

    // Append new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImageUrls = await uploadImages(req.files);
      product.images = product.images.concat(newImageUrls);
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// ✅ DELETE Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;


    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.images.includes(imageUrl)) {
      return res.status(400).json({
        success: false,
        message: "Image not found in product",
      });
    }

    // 🗑️ Delete from Cloudinary
    const publicId = extractPublicId(imageUrl);
    await cloudinary.uploader.destroy(publicId);

    // 🗑️ Remove from MongoDB
    product.images = product.images.filter(
      (img) => img !== imageUrl
    );

    await product.save();

    res.status(200).json({
      success: true,
      message: "Image deleted from Cloudinary and database",
      images: product.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
