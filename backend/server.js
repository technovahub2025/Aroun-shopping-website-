require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
// Initialize indexes explicitly after connecting; model imports happen before Mongo is ready.
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);

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
app.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = body => json(res.statusCode >= 400 && body && typeof body === 'object' && !body.code ? { ...body, code: ({ 400: 'VALIDATION_ERROR', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 503: 'STORAGE_UNAVAILABLE' })[res.statusCode] || 'REQUEST_FAILED' } : body);
  next();
});
// Enable CORS for all origins
app.use(cors({
  origin: true,         
  credentials: true     
}));

app.use(async (req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && process.env.DRIVE_STATE_DIR) {
    const fs = require('node:fs/promises');
    if (await fs.stat(require('node:path').join(process.env.DRIVE_STATE_DIR, 'migrating')).then(() => true, () => false)) return res.status(503).json({ message: 'Storage migration is in progress.', code: 'STORAGE_UNAVAILABLE' });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/storage', require('./routes/storageRoute'));
app.use('/api/products', productRoutes);
app.use('/api/drive-images', require('./routes/driveImageRoute'));
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Check for low stock products every hour
app.use((err, req, res, next) => require('./storage/errors').respond(res, err));

// Start server
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.send('Server is running...');
});

async function start() {
  const { provider } = require('./storage/repositories');
  if (provider() === 'google-drive') {
    if (process.env.DRIVE_DEPLOYMENT_MODE !== 'single-host' || process.env.WEB_CONCURRENCY !== '1' || (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE !== '0') || !process.env.DRIVE_STATE_DIR || !require('node:path').isAbsolute(process.env.DRIVE_STATE_DIR)) throw new Error('Unsupported Drive deployment configuration.');
  }
  if (process.env.DRIVE_STATE_DIR) {
    const fs = require('node:fs');
    const path = require('node:path');
    fs.mkdirSync(process.env.DRIVE_STATE_DIR, { recursive: true, mode: 0o700 });
    const lease = path.join(process.env.DRIVE_STATE_DIR, 'server.lock');
    try { fs.mkdirSync(lease); } catch { throw new Error('Single-writer lease unavailable. Stop other instances and follow recovery instructions.'); }
    process.on('exit', () => { try { fs.rmdirSync(lease); } catch {} });
  }
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await require('./models/Order').createIndexes();
    await require('./models/Cart').createIndexes();
    if (provider() === 'mongodb') await require('./models/User').createIndexes();
  }
  setInterval(checkAndNotifyLowStock, 60 * 60 * 1000).unref();
  return app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
if (require.main === module) start().catch(() => { console.error('Startup failed. Check storage configuration and the single-writer lease.'); process.exitCode = 1; });
module.exports = { app, start };
