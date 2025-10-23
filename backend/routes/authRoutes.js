const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, logout } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authmiddleware')

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', logout);

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.get('/admin/dashboard', protect, admin, (req, res) => {
  res.json({ success: true, message: 'Welcome Admin!' });
});

module.exports = router;
    