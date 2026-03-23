const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/route.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.getAllRoutes);
router.get('/:id', ctrl.getRouteById);
router.post('/', protect, authorize('admin'), ctrl.createRoute);
router.put('/:id', protect, authorize('admin'), ctrl.updateRoute);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteRoute);

module.exports = router;
