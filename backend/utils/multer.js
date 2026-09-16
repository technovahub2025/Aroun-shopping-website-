const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB max per image
  fileFilter: (req, file, cb) => {
    if (!require('./googleDrive').imageTypes.includes(file.mimetype)) {
      return cb(Object.assign(new Error('Choose JPEG, PNG, WebP, or GIF images.'), { status: 400 }));
    }
    cb(null, true);
  },
});

module.exports = upload;
