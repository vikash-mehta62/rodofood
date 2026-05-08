const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  phone:    { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['customer', 'restaurant'], default: 'customer' },
  otp:      { type: String, required: true },
  createdAt:{ type: Date, default: Date.now, expires: 900 }, // auto-delete after 15 min
});

module.exports = mongoose.model('PendingRegistration', pendingSchema);
