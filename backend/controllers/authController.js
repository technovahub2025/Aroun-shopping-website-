const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../utils/twilio');
const generateToken = require('../utils/jwt');

// 1️⃣ Send OTP
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    if (!phoneRegex.test(phone)) return res.status(400).json({ message: 'Invalid phone number' });

    // Find or create user
    let user = await User.findOne({ phone  });
    if (!user) user = await User.create({ phone });

    // Send OTP via Twilio
    await sendOTP(phone);

    res.json({ message: 'OTP sent successfully via SMS' });
  } catch (err) {
    console.error('Send OTP Error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2️⃣ Verify OTP & login
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ message: 'Phone and OTP required' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify via Twilio
    const twilioRes = await verifyOTP(phone, code);
    if (!twilioRes.valid) return res.status(400).json({ message: 'Invalid or expired OTP' });

    // Generate JWT & set cookie
    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Logged in successfully',
      user: { id: user._id, phone: user.phone, role: user.role },
      token,
    });
  } catch (err) {
    console.error('Verify OTP Error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3️⃣ Logout
exports.logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout Error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};
