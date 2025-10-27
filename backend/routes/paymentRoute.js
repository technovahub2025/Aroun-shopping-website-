const express = require('express');
const router = express.Router();
const { processPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authmiddleware');

// Protected payment endpoint (dummy)
router.post('/', protect, processPayment);

module.exports = router;
