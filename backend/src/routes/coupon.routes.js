const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/coupon.controller');
const { protect, authorize, checkPortalAccess } = require('../middleware/auth');

// Public — active coupons for homepage display
router.get('/public', ctrl.getPublicCoupons);

// Public validate (requires auth to enforce per-user limit)
router.post('/validate', protect, ctrl.validateCoupon);

// Restaurant owner — portal access checked
router.get('/my', protect, authorize('restaurant'), checkPortalAccess, ctrl.getMyCoupons);
router.post('/my', protect, authorize('restaurant'), checkPortalAccess, ctrl.createMyCoupon);
router.put('/my/:id', protect, authorize('restaurant'), checkPortalAccess, ctrl.updateMyCoupon);
router.delete('/my/:id', protect, authorize('restaurant'), checkPortalAccess, ctrl.deleteMyCoupon);

// Admin — manage all coupons
router.get('/', protect, authorize('admin'), ctrl.getAllCoupons);
router.post('/', protect, authorize('admin'), ctrl.createCoupon);
router.put('/:id', protect, authorize('admin'), ctrl.updateCoupon);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCoupon);

module.exports = router;
