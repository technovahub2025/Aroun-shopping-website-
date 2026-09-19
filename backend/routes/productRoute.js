const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const { 
  createProduct, getProducts, getProduct, updateProduct, deleteProduct, getCategoryCounts,
  getDriveImageProductCount
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authmiddleware");
const { getCatalog, getCategoryPreviews, getCatalogFacets } = require("../controllers/catalogList");

// CRUD routes
router.get("/admin/list", protect, admin, require("../controllers/adminProductList"));
router.get("/catalog", getCatalog);
router.get("/category-previews", getCategoryPreviews);
router.get("/catalog-facets", getCatalogFacets);
router.post("/", protect, admin, upload.array("images", 5), createProduct);
router.get("/", getProducts); // keep public
router.get("/category-counts", getCategoryCounts);
router.get("/drive-image-count", getDriveImageProductCount);
router.get("/:id", getProduct); // keep public
router.put("/:id", protect, admin, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;

router.use((err, req, res, next) => {
  if (err.name === "MulterError" || err.status === 400) {
    return res.status(400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 10 MB or smaller."
          : "Choose up to 5 JPEG, PNG, WebP, or GIF images (10 MB each).",
    });
  }

  next(err);
});

module.exports = router;
