const Product = require("../models/productModel");
const cloudinary = require("../utils/cloudinary");

const drive = require("../utils/googleDrive");

const uploadProductImages = async (req, uploadedDriveIds) => {
  const files = req.files || [];
  const provider = req.body.imageStorage || 'cloudinary';
  if (!['google-drive', 'cloudinary'].includes(provider)) {
    throw Object.assign(new Error('Unknown image storage provider.'), { status: 400, expose: true });
  }
  files.forEach(drive.validateImage);
  let urls;
  if (provider === 'google-drive') {
    urls = [];
    for (const file of files) {
      const image = await drive.uploadImage(file);
      uploadedDriveIds.push(image.id);
      urls.push(image.url);
    }
  } else {
    urls = await uploadImages(files);
  }
  // Preserve the interleaved order of existing URLs and newly selected files.
  if (req.body.imageOrder !== undefined) {
    let order;
    try { order = JSON.parse(req.body.imageOrder); } catch { order = null; }
    if (!Array.isArray(order) || order.some((item) =>
      !(item && ((item.type === 'file' && Number.isInteger(item.index) && urls[item.index]) ||
        (item.type === 'url' && typeof item.url === 'string' && /^https?:\/\//.test(item.url)))))) {
      throw Object.assign(new Error('Invalid image order.'), { status: 400, expose: true });
    }
    return order.map((item) => item.type === 'file' ? urls[item.index] : item.url);
  }
  return [...collectImageUrls(req.body), ...urls];
};

const cleanupDriveImages = async (ids) => {
  const results = await Promise.allSettled(ids.map(drive.deleteImage));
  if (results.some((result) => result.status === 'rejected')) {
    console.error('Could not clean up some unsaved Google Drive images.');
  }
};

const toNumber = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseListField(item));
  }

  return String(value)
    .split(/[\n,|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const collectImageUrls = (body) => {
  const existing = parseListField(body.existingImages);
  const inlineUrls = parseListField(body.imageUrls);
  const directImages = parseListField(body.images);

  return [...existing, ...inlineUrls, ...directImages];
};

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

// CREATE Product
exports.createProduct = async (req, res) => {
  const uploadedDriveIds = [];
  try {
    const {
      title,
      description,
      price,
      rating,
      category,
      stock,
      mrp,
      discount,
      type,
    } = req.body;

    const imageUrls = await uploadProductImages(req, uploadedDriveIds);

    const product = await Product.create({
      title,
      description,
      price: toNumber(price, 0),
      rating: toNumber(rating, 0),
      category,
      images: imageUrls,
      mrp: toNumber(mrp, 0),
      discount: toNumber(discount, 0),
      stock: toNumber(stock, 0),
      type,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    await cleanupDriveImages(uploadedDriveIds);
    res.status(err.status || 500).json({ message: err.expose ? err.message : "Failed to create product" });
  }
};

// READ All Products (with optional category filter)
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// READ Single Product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// UPDATE Product
exports.updateProduct = async (req, res) => {
  const uploadedDriveIds = [];
  try {
    const {
      title,
      description,
      price,
      rating,
      category,
      stock,
      mrp,
      discount,
      type,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined && price !== "") {
      product.price = toNumber(price, product.price);
    }
    if (rating !== undefined && rating !== "") {
      product.rating = toNumber(rating, product.rating);
    }
    if (category !== undefined) product.category = category;
    if (type !== undefined) product.type = type;
    if (mrp !== undefined && mrp !== "") {
      product.mrp = toNumber(mrp, product.mrp);
    }
    if (discount !== undefined && discount !== "") {
      product.discount = toNumber(discount, product.discount);
    }
    if (stock !== undefined && stock !== "") {
      product.stock = toNumber(stock, product.stock);
    }

    const images = await uploadProductImages(req, uploadedDriveIds);
    if (req.body.imageOrder !== undefined || images.length > 0) {
      product.images = images;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    await cleanupDriveImages(uploadedDriveIds);
    res.status(err.status || 500).json({ message: err.expose ? err.message : "Failed to update product" });
  }
};

// DELETE Product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
};
