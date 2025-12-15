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
    // Use sameSite='none' in production so cross-site cookies work when frontend and backend are on different domains
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.sameSite = 'none';
    } else {
      cookieOptions.sameSite = 'lax';
    }

    res.cookie('token', token, cookieOptions);

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
    // Clear cookie using same options so browser removes it correctly in production
    const clearOptions = { httpOnly: true };
    if (process.env.NODE_ENV === 'production') {
      clearOptions.sameSite = 'none';
      clearOptions.secure = true;
    }
    res.clearCookie('token', clearOptions);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout Error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

/// for development purpose only
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      street,
      city,
      zipcode,
      role,
    } = req.body;

    // Check for required fields
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Create new user object
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // hashing will depend on your model/middleware
      phone,
      address: {
        street: street || "",
        city: city || "",
        zipcode: zipcode || "",
      },
    });

    // Save to database
    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role } = req.body;

    const users = await User.findById(req.params.id);
    if (!users) {
      return res.status(404).json({ message: "User not found" });
    }

    if (role !== undefined) users.role = role;
    await users.save();

    res.json({
      message: "User updated successfully",
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude password for security

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No users found",
      });
    }
    res.status(200).json({
      message: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

