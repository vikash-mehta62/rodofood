const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['all', 'user'], default: 'all' }, // all = broadcast, user = specific
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // only if type=user
    icon: { type: String, default: '🔔' },
    link: { type: String }, // optional deep link e.g. /home
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Track which users have read this notification
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetUser: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
