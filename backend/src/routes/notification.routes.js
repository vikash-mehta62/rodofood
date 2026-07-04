const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth');

// Customer
router.get('/my', protect, authorize('customer', 'restaurant'), ctrl.getMyNotifications);
router.patch('/:id/read', protect, authorize('customer','restaurant'), ctrl.markRead);
router.patch('/read-all', protect, authorize('customer','restaurant'), ctrl.markAllRead);

// Admin
router.get('/', protect, authorize('admin'), ctrl.getAllNotifications);
router.post('/', protect, authorize('admin'), ctrl.sendNotification);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteNotification);

module.exports = router;
