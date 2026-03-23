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

    return successResponse(res, { route: { name: route.name, slug: route.slug }, restaurants: enriched });
  } catch (error) {
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
