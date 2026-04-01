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

    // Fetch all restaurants on this route
    const allRestaurants = await Restaurant.find({
      routes: routeId,
      isActive: true,
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
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('routes', 'name slug')
      .lean();
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
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    return successResponse(res, { restaurant });
  } catch (error) {
    next(error);
  }
};

exports.updateMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const updates = { ...req.body };

    // Handle nested address/location from flat fields
    if (req.body['address.street']) updates.address = { ...restaurant.address, street: req.body['address.street'] };
    if (req.body['address.city']) updates['address.city'] = req.body['address.city'];
    if (req.body['address.state']) updates['address.state'] = req.body['address.state'];
    if (req.body['address.pincode']) updates['address.pincode'] = req.body['address.pincode'];

    // Handle location coordinates
    if (req.body.latitude && req.body.longitude) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
      delete updates.latitude;
      delete updates.longitude;
    }

    // Handle cuisines array
    if (req.body.cuisines && typeof req.body.cuisines === 'string') {
      updates.cuisines = req.body.cuisines.split(',').map(c => c.trim()).filter(Boolean);
    }

    // Handle uploaded images (Cloudinary returns full URL in req.file.path)
    if (req.files?.coverImage?.[0]) {
      updates.coverImage = req.files.coverImage[0].path;
    }
    if (req.files?.images?.length) {
      updates.images = req.files.images.map(f => f.path);
    }

    const updated = await Restaurant.findByIdAndUpdate(restaurant._id, updates, { new: true, runValidators: true });
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
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    return successResponse(res, { restaurant }, 'Restaurant updated');
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
