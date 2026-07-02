const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/qr.controller');
const { protect, authorize } = require('../middleware/auth');

// Public route for customers to get stops timeline for a route
router.get('/route/:routeId', ctrl.getQRsByRoute);
router.get('/:id', ctrl.getQRById);

// All QR endpoints below are Admin only
router.use(protect, authorize('admin'));

router.get('/', ctrl.getAllQRs);
router.post('/', ctrl.createQR);
router.put('/:id', ctrl.updateQR);
router.delete('/:id', ctrl.deleteQR);

module.exports = router;
