const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    // 1️⃣ Check for token in cookies OR Authorization header
    let token = null;
    if (req.cookies?.token) token = req.cookies.token;
    // Accept Bearer token from Authorization header as a fallback (helps when cookie isn't sent)
    if (!token && req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // 3️⃣ Fetch user from DB
    const user = await User.findById(decoded.id).select('-password -otp -otpExpire');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 4️⃣ Attach user and phone to request
    req.user = user;
    req.phone = user.phone;

    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  next();
};
