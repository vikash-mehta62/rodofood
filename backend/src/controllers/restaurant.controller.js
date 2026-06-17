const Restaurant = require('../models/Restaurant');
const Route = require('../models/Route');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { haversineDistance, filterRestaurantsByRoute, findClosestWaypointIndex } = require('../utils/routeUtils');

/**
 * @swagger
 * /restaurants/by-route:
 *   get:
 *     summary: Get restaurants along a route
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: routeId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: fromCity
 *         schema: { type: string }
 *       - in: query
 *         name: toCity
 *         schema: { type: string }
 *       - in: query
 *         name: userLat
 *         schema: { type: number }
 *       - in: query
 *         name: userLng
 *         schema: { type: number }
 */
exports.getRestaurantsByRoute = async (req, res, next) => {
  try {
    const { routeId, fromCity, toCity, userLat, userLng } = req.query;

    const route = await Route.findById(routeId);
    if (!route) return errorResponse(res, 'Route not found', 404);

    // Find from/to waypoint orders
    const fromWp = route.waypoints.find(
      (w) => w.name.toLowerCase() === (fromCity || '').toLowerCase()
    );
    const toWp = route.waypoints.find(
      (w) => w.name.toLowerCase() === (toCity || '').toLowerCase()
    );

    const fromOrder = fromWp ? fromWp.order : 0;
    const toOrder = toWp ? toWp.order : route.waypoints.length - 1;

    // Fetch all restaurants on this route — only active AND portal enabled
    const allRestaurants = await Restaurant.find({
      routes: routeId,
      isActive: true,
      portalEnabled: true,
    }).lean();

    const filtered = filterRestaurantsByRoute(allRestaurants, fromOrder, toOrder);

    // Enrich with distance from user if location provided
    const enriched = filtered.map((r) => {
      const [lng, lat] = r.location.coordinates;
      const distanceKm = userLat && userLng
        ? haversineDistance(parseFloat(userLat), parseFloat(userLng), lat, lng)
        : null;

      // Determine if ahead or passed
      let position = 'ahead';
      if (userLat && userLng) {
        const userWpIdx = findClosestWaypointIndex(
          route.waypoints,
          parseFloat(userLat),
          parseFloat(userLng)
        );
        const isForward = toOrder >= fromOrder;
        position =
          isForward
            ? r.routeWaypointOrder > userWpIdx ? 'ahead' : 'passed'
            : r.routeWaypointOrder < userWpIdx ? 'ahead' : 'passed';
      }

      return { ...r, distanceKm: distanceKm ? Math.round(distanceKm * 10) / 10 : null, position };
    });

    // Sort: if user location provided → sort by distance (nearest first, ahead before passed)
    // Otherwise sort by routeWaypointOrder
    const sorted = userLat && userLng
      ? enriched.sort((a, b) => {
          // Ahead restaurants first
          if (a.position === 'ahead' && b.position === 'passed') return -1;
          if (a.position === 'passed' && b.position === 'ahead') return 1;
          // Then by distance
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        })
      : enriched.sort((a, b) => (a.routeWaypointOrder ?? 0) - (b.routeWaypointOrder ?? 0));

    return successResponse(res, { route: { name: route.name, slug: route.slug }, restaurants: sorted });  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Get restaurant details
 *     tags: [Restaurants]
 */
exports.getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      isActive: true,
      portalEnabled: true,
    }).populate('routes', 'name slug').lean();
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    return successResponse(res, { restaurant });
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant Owner Controllers ────────────────────────────────────────────

exports.getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return successResponse(res, { restaurant: null }, 'No restaurant yet');
    return successResponse(res, { restaurant });
  } catch (error) {
    next(error);
  }
};

exports.updateMyRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findOne({ owner: req.user._id });

    const updates = {};

    // Basic fields
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.foodType) updates.foodType = req.body.foodType;
    if (req.body.avgPrepTimeMinutes) updates.avgPrepTimeMinutes = parseInt(req.body.avgPrepTimeMinutes);

    // Handle nested address fields
    if (req.body['address.street'] || req.body['address.city'] || req.body['address.state'] || req.body['address.pincode']) {
      updates.address = {
        street: req.body['address.street'] || restaurant?.address?.street || '',
        city: req.body['address.city'] || restaurant?.address?.city || '',
        state: req.body['address.state'] || restaurant?.address?.state || '',
        pincode: req.body['address.pincode'] || restaurant?.address?.pincode || '',
      };
    }

    // Handle location coordinates
    if (req.body.latitude && req.body.longitude) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    // Handle cuisines array (comes as cuisines[]=X&cuisines[]=Y from FormData)
    if (req.body['cuisines[]']) {
      const cuisinesArray = Array.isArray(req.body['cuisines[]']) ? req.body['cuisines[]'] : [req.body['cuisines[]']];
      updates.cuisines = cuisinesArray.filter(Boolean);
    } else if (req.body.cuisines) {
      if (Array.isArray(req.body.cuisines)) {
        updates.cuisines = req.body.cuisines.filter(Boolean);
      } else if (typeof req.body.cuisines === 'string') {
        updates.cuisines = req.body.cuisines.split(',').map(c => c.trim()).filter(Boolean);
      }
    }

    // Handle opening hours
    if (req.body['openingHours.open'] || req.body['openingHours.close']) {
      updates.openingHours = {
        open: req.body['openingHours.open'] || restaurant?.openingHours?.open || '08:00',
        close: req.body['openingHours.close'] || restaurant?.openingHours?.close || '22:00',
      };
    }

    // Handle uploaded images
    if (req.files?.coverImage?.[0]) {
      updates.coverImage = req.files.coverImage[0].path;
    }
    if (req.files?.images?.length) {
      updates.images = req.files.images.map(f => f.path);
    }

    let updated;
    if (!restaurant) {
      // First time — create restaurant for this owner
      updated = await Restaurant.create({ ...updates, owner: req.user._id });
    } else {
      Object.assign(restaurant, updates);
      updated = await restaurant.save();
    }

    return successResponse(res, { restaurant: updated }, 'Restaurant updated');
  } catch (error) {
    next(error);
  }
};

exports.toggleRestaurantStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();
    return successResponse(
      res,
      { isOpen: restaurant.isOpen },
      `Restaurant is now ${restaurant.isOpen ? 'Open' : 'Closed'}`
    );
  } catch (error) {
    next(error);
  }
};

// ─── Admin Controllers ────────────────────────────────────────────────────────

exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive, isVerified } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const total = await Restaurant.countDocuments(filter);
    const restaurants = await Restaurant.find(filter)
      .populate('owner', 'name phone')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return paginatedResponse(res, restaurants, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.create(req.body);
    return successResponse(res, { restaurant }, 'Restaurant created', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    Object.assign(restaurant, req.body);
    await restaurant.save();
    return successResponse(res, { restaurant }, 'Restaurant updated');
  } catch (error) {
    next(error);
  }
};

exports.togglePortalAccess = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    // Treat undefined as true (default enabled), then toggle
    const current = restaurant.portalEnabled !== false;
    restaurant.portalEnabled = !current;
    await restaurant.save();
    return successResponse(
      res,
      { portalEnabled: restaurant.portalEnabled },
      `Portal access ${restaurant.portalEnabled ? 'enabled' : 'disabled'}`
    );
  } catch (error) {
    next(error);
  }
};

exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    return successResponse(res, {}, 'Restaurant deactivated');
  } catch (error) {
    next(error);
  }
};
