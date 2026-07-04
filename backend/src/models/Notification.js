const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    
    imageUrl: {
      type: String,
      default: ""
    },
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null
    },
    
    isForGuest: {
      type: Boolean,
      default: false
    },
    
    type: {
      type: String, // offer, booking, system, topic, etc.
      default: "system"
    },
    
    data: {
      type: Object // optional extra payload for deep links
    },
    
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
