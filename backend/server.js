const express = require('express');
const mongoose = require('mongoose');

const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoute');
const cartRoutes = require('./routes/cartRoute');
const orderRoutes = require('./routes/orderRoute');
const userRoutes = require('./routes/userRoute');
const paymentRoutes = require('./routes/paymentRoute');
const notificationRoutes = require('./routes/notificationRoute');
const { checkAndNotifyLowStock } = require('./controllers/notificationController');

require('dotenv').config();
const app = express();

// Middleware
app.use(express.json()); 
app.use(cookieParser());
// Enable CORS for all origins
app.use(cors({
  origin: true,         
  credentials: true     
}));

// Connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Check for low stock products every hour
setInterval(checkAndNotifyLowStock, 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.send('Server is running...');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} `));
