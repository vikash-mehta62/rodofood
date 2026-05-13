/**
 * One-time script: mark all existing active orders as completed
 * Run: node src/utils/markOrdersCompleted.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready'];

  const result = await Order.updateMany(
    { status: { $in: activeStatuses } },
    {
      $set: { status: 'completed', paymentStatus: 'paid' },
      $push: {
        statusHistory: {
          status: 'completed',
          timestamp: new Date(),
          note: 'Bulk marked as completed by admin',
        },
      },
    }
  );

  console.log(`✅ Marked ${result.modifiedCount} orders as completed`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
