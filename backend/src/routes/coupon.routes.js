const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middleware/auth');

// Public validate
router.post('/validate', protect, ctrl.validateCoupon);

// Restaurant owner — manage their own coupons
router.get('/my', protect, authorize('restaurant'), ctrl.getMyCoupons);
router.post('/my', protect, authorize('restaurant'), ctrl.createMyCoupon);
router.put('/my/:id', protect, authorize('restaurant'), ctrl.updateMyCoupon);
router.delete('/my/:id', protect, authorize('restaurant'), ctrl.deleteMyCoupon);

// Admin — manage all coupons
router.get('/', protect, authorize('admin'), ctrl.getAllCoupons);
router.post('/', protect, authorize('admin'), ctrl.createCoupon);
router.put('/:id', protect, authorize('admin'), ctrl.updateCoupon);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCoupon);

module.exports = router;
