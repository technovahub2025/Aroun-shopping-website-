const express = require('express');
const router = express.Router();
const {
  processPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authmiddleware');

// Protected payment endpoint (dummy)
router.post('/payment/create-order', protect, processPayment);

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyRazorpayPayment);

// Legacy dummy payment endpoint
router.post('/', protect, processPayment);

module.exports = router;
