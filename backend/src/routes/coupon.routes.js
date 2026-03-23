const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middleware/auth');

router.post('/validate', protect, ctrl.validateCoupon);
router.get('/', protect, authorize('admin'), ctrl.getAllCoupons);
router.post('/', protect, authorize('admin'), ctrl.createCoupon);
router.put('/:id', protect, authorize('admin'), ctrl.updateCoupon);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteCoupon);

module.exports = router;
