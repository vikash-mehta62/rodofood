const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/restaurant.controller');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Restaurant listing and management
 */

// Public
router.get('/by-route', ctrl.getRestaurantsByRoute);
router.get('/:id', ctrl.getRestaurantById);

// Restaurant owner
router.get('/owner/me', protect, authorize('restaurant'), ctrl.getMyRestaurant);
router.patch('/owner/toggle-status', protect, authorize('restaurant'), ctrl.toggleRestaurantStatus);

// Admin
router.get('/', protect, authorize('admin'), ctrl.getAllRestaurants);
router.post('/', protect, authorize('admin'), ctrl.createRestaurant);
router.put('/:id', protect, authorize('admin'), ctrl.updateRestaurant);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteRestaurant);

module.exports = router;
