const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

// Customer
router.post('/', protect, authorize('customer'), validate(createOrderSchema), ctrl.createOrder);
router.get('/my', protect, authorize('customer'), ctrl.getMyOrders);
router.get('/my/:id', protect, authorize('customer'), ctrl.getOrderById);

// Restaurant owner — specific routes BEFORE parameterized ones
router.get('/restaurant/earnings', protect, authorize('restaurant'), ctrl.getRestaurantEarnings);
router.get('/restaurant', protect, authorize('restaurant'), ctrl.getRestaurantOrders);
router.patch('/restaurant/:id/status', protect, authorize('restaurant'), validate(updateOrderStatusSchema), ctrl.updateOrderStatus);

// Admin
router.get('/', protect, authorize('admin'), ctrl.getAllOrders);

module.exports = router;
