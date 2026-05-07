const Notification = require('../models/Notification');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── Admin ────────────────────────────────────────────────────────────────────

// Send notification to all customers or a specific user
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetPhone, icon, link } = req.body;
    if (!title || !message) return errorResponse(res, 'Title and message are required', 400);

    let targetUser = null;
    if (type === 'user') {
      if (!targetPhone) return errorResponse(res, 'Phone number required for user notification', 400);
      targetUser = await User.findOne({ phone: targetPhone, role: 'customer' });
      if (!targetUser) return errorResponse(res, 'Customer not found with this phone number', 404);
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'all',
      targetUser: targetUser?._id,
      icon: icon || '🔔',
      link,
      createdBy: req.user._id,
    });

    return successResponse(res, { notification }, 'Notification sent successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get all notifications (admin view)
exports.getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .populate('targetUser', 'name phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    return successResponse(res, { notifications });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return successResponse(res, {}, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};

// ─── Customer ─────────────────────────────────────────────────────────────────

// Get notifications for logged-in customer
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch broadcast (all) + user-specific notifications
    const notifications = await Notification.find({
      $or: [
        { type: 'all' },
        { type: 'user', targetUser: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Mark which ones are unread
    const withReadStatus = notifications.map(n => ({
      ...n,
      isRead: n.readBy?.some(id => id.toString() === userId.toString()) ?? false,
    }));

    const unreadCount = withReadStatus.filter(n => !n.isRead).length;

    return successResponse(res, { notifications: withReadStatus, unreadCount });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: req.user._id },
    });
    return successResponse(res, {}, 'Marked as read');
  } catch (error) {
    next(error);
  }
};

// Mark all as read
exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      {
        $or: [{ type: 'all' }, { type: 'user', targetUser: userId }],
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );
    return successResponse(res, {}, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
