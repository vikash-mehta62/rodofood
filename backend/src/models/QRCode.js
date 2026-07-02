const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    stops: [
      {
        stopNumber: { type: Number, required: true },
        restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        stopTime: { type: String },
        stopDuration: { type: String }
      }
    ],
    url: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QRCode', qrCodeSchema);
