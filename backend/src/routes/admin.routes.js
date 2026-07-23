const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = [protect, authorize('admin')];

const { uploadAdmin } = require('../config/cloudinary');

router.get('/dashboard', ...adminOnly, ctrl.getDashboardStats);
router.get('/users', ...adminOnly, ctrl.getAllUsers);
router.patch('/users/:id/toggle', ...adminOnly, ctrl.toggleUserStatus);
router.get('/analytics/revenue', ...adminOnly, ctrl.getRevenueAnalytics);
router.get('/analytics/restaurant-revenue', ...adminOnly, ctrl.getRestaurantRevenue);
router.patch('/users/:id/make-admin', ...adminOnly, ctrl.makeAdmin);
router.post('/users/create-admin', ...adminOnly, ctrl.createAdminUser);

router.post('/upload', ...adminOnly, uploadAdmin.single('image'), ctrl.uploadImage);

module.exports = router;
