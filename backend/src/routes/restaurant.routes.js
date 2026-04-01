const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/restaurant.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadRestaurant } = require('../config/cloudinary');

// Public
router.get('/by-route', ctrl.getRestaurantsByRoute);

// Restaurant owner
router.get('/owner/me', protect, authorize('restaurant'), ctrl.getMyRestaurant);
router.put('/owner/me', protect, authorize('restaurant'), uploadRestaurant.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 5 }]), ctrl.updateMyRestaurant);
router.patch('/owner/toggle-status', protect, authorize('restaurant'), ctrl.toggleRestaurantStatus);

// Admin
router.get('/', protect, authorize('admin'), ctrl.getAllRestaurants);
router.post('/', protect, authorize('admin'), ctrl.createRestaurant);
router.put('/:id', protect, authorize('admin'), ctrl.updateRestaurant);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteRestaurant);

// Public (must be last)
router.get('/:id', ctrl.getRestaurantById);

module.exports = router;
