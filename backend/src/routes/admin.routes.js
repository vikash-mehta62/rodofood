const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = [protect, authorize('admin')];

router.get('/dashboard', ...adminOnly, ctrl.getDashboardStats);
router.get('/users', ...adminOnly, ctrl.getAllUsers);
router.patch('/users/:id/toggle', ...adminOnly, ctrl.toggleUserStatus);
router.get('/analytics/revenue', ...adminOnly, ctrl.getRevenueAnalytics);

module.exports = router;
