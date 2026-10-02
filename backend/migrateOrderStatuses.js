require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const { LEGACY_STATUSES } = require('./utils/orderStatus');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    for (const [oldStatus, status] of Object.entries(LEGACY_STATUSES)) {
      const result = await Order.collection.updateMany({ status: oldStatus }, { $set: { status } });
      console.log(`${oldStatus} -> ${status}: ${result.modifiedCount}`);
    }
    const result = await Order.collection.updateMany({ $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] }, { $set: { status: 'Pending' } });
    console.log(`Missing status -> Pending: ${result.modifiedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

migrate().catch(() => { console.error('Order status migration failed'); process.exitCode = 1; });
