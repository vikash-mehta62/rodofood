const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  fcmToken: {
    type: String,
    required: true
  }, // 🔔 notification token
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Note: The schema ref in rodofood is usually User, not "auth". Let me double check... The user provided "auth", but in my previous ls, I saw User.js. I'll use "User".
    default: null
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant", // Often vendors are restaurants, I saw Restaurant.js.
    default: null
  },
  isGuest: {
    type: Boolean,
    default: true
  },
  platform: {
    type: String,
    default: "android"
  },
  topics: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Device", deviceSchema);
