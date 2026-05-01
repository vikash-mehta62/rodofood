const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/order.controller');
const { protect, authorize, checkPortalAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

// Customer
router.post('/', protect, authorize('customer'), validate(createOrderSchema), ctrl.createOrder);
router.get('/my', protect, authorize('customer'), ctrl.getMyOrders);
router.get('/my/:id', protect, authorize('customer'), ctrl.getOrderById);
router.post('/my/:id/rate', protect, authorize('customer'), ctrl.rateOrder);

// Restaurant owner — portal access checked
router.get('/restaurant/earnings', protect, authorize('restaurant'), checkPortalAccess, ctrl.getRestaurantEarnings);
router.get('/restaurant', protect, authorize('restaurant'), checkPortalAccess, ctrl.getRestaurantOrders);
router.patch('/restaurant/:id/status', protect, authorize('restaurant'), checkPortalAccess, validate(updateOrderStatusSchema), ctrl.updateOrderStatus);

// Admin
router.get('/', protect, authorize('admin'), ctrl.getAllOrders);

module.exports = router;
