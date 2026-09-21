const Product = require("../models/productModel");
const drive = require("../utils/googleDrive");

// Upload product images to Google Drive
const uploadProductImages = async (req, uploadedDriveIds) => {
  const files = req.files || [];

  // Validate every uploaded file
  files.forEach(drive.validateImage);

  const urls = [];

  for (const file of files) {
    const image = await drive.uploadImage(file);

    uploadedDriveIds.push(image.id);
    urls.push(image.url);
  }

  // Preserve the interleaved order of existing URLs and newly uploaded files.
  if (req.body.imageOrder !== undefined) {
    let order;

    try {
      order = JSON.parse(req.body.imageOrder);
    } catch {
      order = null;
    }

    if (
      !Array.isArray(order) ||
      order.some(
        (item) =>
          !(
            item &&
            (
              (
                item.type === "file" &&
                Number.isInteger(item.index) &&
                urls[item.index]
              ) ||
              (
                item.type === "url" &&
                typeof item.url === "string" &&
                /^https?:\/\//.test(item.url)
              )
            )
          )
      )
    ) {
      throw Object.assign(
        new Error("Invalid image order."),
        {
          status: 400,
          expose: true,
        }
      );
    }

    return order.map((item) =>
      item.type === "file"
        ? urls[item.index]
        : item.url
    );
  }

  return [...collectImageUrls(req.body), ...urls];
};

// Delete Drive images when something fails
const cleanupDriveImages = async (ids) => {
  if (!ids.length) return;

  const results = await Promise.allSettled(
    ids.map((id) => drive.deleteImage(id))
  );

  if (
    results.some(
      (result) => result.status === "rejected"
    )
  ) {
    console.error(
      "Could not clean up some unsaved Google Drive images."
    );
  }
};

const toNumber = (value, fallback = undefined) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const parsed = Number(
    String(value).replace(/,/g, "")
  );

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const parseListField = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      parseListField(item)
    );
  }

  return String(value)
    .split(/[\n,|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const collectImageUrls = (body) => {
  const existing = parseListField(
    body.existingImages
  );

  const inlineUrls = parseListField(
    body.imageUrls
  );

  const directImages = parseListField(
    body.images
  );

  return [
    ...existing,
    ...inlineUrls,
    ...directImages,
  ];
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

    // Upload images directly to Google Drive
    const imageUrls = await uploadProductImages(
      req,
      uploadedDriveIds
    );

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
    console.error(
      "Error creating product:",
      err
    );

    await cleanupDriveImages(
      uploadedDriveIds
    );

    res.status(err.status || 500).json({
      message: err.expose
        ? err.message
        : "Failed to create product",
    });
  }
};

// READ All Products
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;

    const query = category
      ? { category }
      : {};

    const products = await Product.find(query);

    res.json(products);
  } catch (err) {
    console.error(
      "Error fetching products:",
      err
    );

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

// Count each product once, even when it references multiple Drive images.
// This checks saved image URLs; it does not verify file availability in Drive.
exports.getDriveImageProductCount = async (req, res) => {
  try {
    const driveImageFilter = {
      images: {
        $regex: /^(?:https?:\/\/[^/]+\/api\/drive-images\/[A-Za-z0-9_-]+(?:\?|$)|\/api\/drive-images\/[A-Za-z0-9_-]+(?:\?|$)|https?:\/\/drive\.google\.com\/(?:file\/d\/[A-Za-z0-9_-]+|(?:uc|thumbnail|open)\?[^#]*\bid=[A-Za-z0-9_-]+))/,
      },
    };
    const [totalProductsWithDriveImages, pendingProducts] = await Promise.all([
      Product.countDocuments(driveImageFilter),
      Product.find({ $nor: [driveImageFilter] })
        .select("_id title category")
        .sort({ category: 1, title: 1, _id: 1 })
        .lean(),
    ]);
    const remainingProducts = pendingProducts.length;
    const totalProducts = totalProductsWithDriveImages + remainingProducts;
    const categoryMap = new Map();
    for (const product of pendingProducts) {
      const category = product.category || "Uncategorized";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { category, count: 0, products: [] });
      }
      const group = categoryMap.get(category);
      group.count += 1;
      group.products.push({ _id: product._id, title: product.title });
    }
    const pendingCategories = [...categoryMap.values()]
      .sort((a, b) => a.category.localeCompare(b.category));
    const completed = remainingProducts === 0;

    res.json({
      totalProducts,
      totalProductsWithDriveImages,
      remainingProducts,
      pendingCategories,
      status: completed ? "completed" : "pending",
      message: completed
        ? "completed"
        : `${remainingProducts} product${remainingProducts === 1 ? "" : "s"} need${remainingProducts === 1 ? "s" : ""} to complete`,
    });
  } catch (err) {
    console.error("Error counting products with Drive images:", err);
    res.status(500).json({ message: "Failed to count products with Drive images" });
  }
};

// Count product listings (not stock units) in each category.
exports.getCategoryCounts = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, category: "$_id", count: 1 } },
    ]);
    res.json({
      categories,
      total: categories.reduce((sum, row) => sum + row.count, 0),
    });
  } catch (err) {
    console.error("Error fetching category counts:", err);
    res.status(500).json({ message: "Failed to fetch category counts" });
  }
};

// READ Single Product
exports.getProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (err) {
    console.error(
      "Error fetching product:",
      err
    );

    res.status(500).json({
      message: "Failed to fetch product",
    });
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

    const product =
      await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (title !== undefined) {
      product.title = title;
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (
      price !== undefined &&
      price !== ""
    ) {
      product.price = toNumber(
        price,
        product.price
      );
    }

    if (
      rating !== undefined &&
      rating !== ""
    ) {
      product.rating = toNumber(
        rating,
        product.rating
      );
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (type !== undefined) {
      product.type = type;
    }

    if (
      mrp !== undefined &&
      mrp !== ""
    ) {
      product.mrp = toNumber(
        mrp,
        product.mrp
      );
    }

    if (
      discount !== undefined &&
      discount !== ""
    ) {
      product.discount = toNumber(
        discount,
        product.discount
      );
    }

    if (
      stock !== undefined &&
      stock !== ""
    ) {
      product.stock = toNumber(
        stock,
        product.stock
      );
    }

    const oldImages = Array.isArray(
      product.images
    )
      ? [...product.images]
      : [];

    const images =
      await uploadProductImages(
        req,
        uploadedDriveIds
      );

    if (
      req.body.imageOrder !== undefined ||
      images.length > 0
    ) {
      product.images = images;
    }

    await product.save();

    // Delete old Drive images only after
    // the new product data was successfully saved.
    if (
      req.body.imageOrder !== undefined ||
      uploadedDriveIds.length > 0
    ) {
      await deleteDriveImagesFromUrls(
        oldImages,
        product.images
      );
    }

    res.json(product);
  } catch (err) {
    console.error(
      "Error updating product:",
      err
    );

    await cleanupDriveImages(
      uploadedDriveIds
    );

    res.status(err.status || 500).json({
      message: err.expose
        ? err.message
        : "Failed to update product",
    });
  }
};

// Extract Drive file ID from our generated URL
const getDriveIdFromUrl = (url) => {
  if (
    typeof url !== "string" ||
    !url.includes("/api/drive-images/")
  ) {
    return null;
  }

  const match = url.match(
    /\/api\/drive-images\/([a-zA-Z0-9_-]+)/
  );

  return match ? match[1] : null;
};

// Delete Drive images that are no longer used
const deleteDriveImagesFromUrls = async (
  oldImages,
  newImages
) => {
  const oldIds = oldImages
    .map(getDriveIdFromUrl)
    .filter(Boolean);

  const newIds = new Set(
    newImages
      .map(getDriveIdFromUrl)
      .filter(Boolean)
  );

  const idsToDelete = oldIds.filter(
    (id) => !newIds.has(id)
  );

  if (!idsToDelete.length) return;

  const results = await Promise.allSettled(
    idsToDelete.map((id) =>
      drive.deleteImage(id)
    )
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to delete Drive image ${idsToDelete[index]}:`,
        result.reason
      );
    }
  });
};

// DELETE Product
exports.deleteProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Get Drive IDs before deleting product
    const driveIds = (
      Array.isArray(product.images)
        ? product.images
        : []
    )
      .map(getDriveIdFromUrl)
      .filter(Boolean);

    // Delete product from MongoDB
    await Product.findByIdAndDelete(
      req.params.id
    );

    // Delete associated Drive images
    if (driveIds.length) {
      const results =
        await Promise.allSettled(
          driveIds.map((id) =>
            drive.deleteImage(id)
          )
        );

      results.forEach(
        (result, index) => {
          if (
            result.status ===
            "rejected"
          ) {
            console.error(
              `Failed to delete Drive image ${driveIds[index]}:`,
              result.reason
            );
          }
        }
      );
    }

    res.json({
      message:
        "Product deleted successfully",
    });
  } catch (err) {
    console.error(
      "Error deleting product:",
      err
    );

    res.status(500).json({
      message:
        "Failed to delete product",
    });
  }
};
