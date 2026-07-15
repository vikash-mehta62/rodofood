const Restaurant = require('../models/Restaurant');
const Route = require('../models/Route');
const User = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { haversineDistance, filterRestaurantsByRoute, findClosestWaypointIndex } = require('../utils/routeUtils');

const ROUTE_MATCH_RADIUS_KM = 50;
const portalEnabledFilter = { $ne: false };

const isPortalEnabled = (restaurant) => restaurant.portalEnabled !== false;

const hasRoute = (restaurant, routeId) =>
  Array.isArray(restaurant.routes) && restaurant.routes.some((id) => String(id) === String(routeId));

const getStoredWaypointOrder = (restaurant) => {
  const value = restaurant.routeWaypointOrder;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getClosestWaypoint = (restaurant, waypoints) => {
  const coordinates = restaurant.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const [lng, lat] = coordinates;
  if (lat === undefined || lng === undefined) return null;

  return waypoints.reduce((closest, waypoint) => {
    const distanceKm = haversineDistance(lat, lng, waypoint.coordinates.lat, waypoint.coordinates.lng);
    if (!closest || distanceKm < closest.distanceKm) {
      return { order: waypoint.order, name: waypoint.name, distanceKm };
    }
    return closest;
  }, null);
};

const normalizeForRoute = (restaurant, route) => {
  const assigned = hasRoute(restaurant, route._id);
  const closest = getClosestWaypoint(restaurant, route.waypoints);

  if (!assigned) return null;

  const routeWaypointOrder = getStoredWaypointOrder(restaurant) ?? closest?.order;

  if (typeof routeWaypointOrder !== 'number') return null;

  return {
    ...restaurant,
    routeWaypointOrder,
    routeMatchedBy: 'assigned',
    routeMatchDistanceKm: closest ? Math.round(closest.distanceKm * 10) / 10 : null,
  };
};

const getVisibilityDebug = (restaurants, route, fromOrder, toOrder) => {
  const isForward = toOrder >= fromOrder;

  return restaurants.map((restaurant) => {
    const closest = getClosestWaypoint(restaurant, route.waypoints);
    const assigned = hasRoute(restaurant, route._id);
    const normalizedOrder = getStoredWaypointOrder(restaurant) ?? closest?.order;
    const inSegment = typeof normalizedOrder === 'number'
      ? isForward
        ? normalizedOrder >= fromOrder && normalizedOrder <= toOrder
        : normalizedOrder <= fromOrder && normalizedOrder >= toOrder
      : false;

    const reasons = [];
    if (restaurant.isActive !== true) reasons.push('inactive');
    if (!isPortalEnabled(restaurant)) reasons.push('portalDisabled');
    if (!restaurant.location?.coordinates?.length) reasons.push('missingLocation');
    if (!assigned) reasons.push('notAssignedToSelectedRoute');
    if (typeof normalizedOrder !== 'number') reasons.push('missingRouteWaypointOrder');
    if (typeof normalizedOrder === 'number' && !inSegment) reasons.push('outsideSelectedSegment');

    return {
      id: restaurant._id,
      name: restaurant.name,
      showing: reasons.length === 0,
      reasons,
      isActive: restaurant.isActive === true,
      portalEnabled: isPortalEnabled(restaurant),
      isOpen: restaurant.isOpen === true,
      assignedToRoute: assigned,
      routeMatchedBy: assigned ? 'assigned' : null,
      routeWaypointOrder: normalizedOrder ?? null,
      closestWaypoint: closest?.name ?? null,
      closestDistanceKm: closest ? Math.round(closest.distanceKm * 10) / 10 : null,
      city: restaurant.address?.city ?? null,
    };
  });
};

const normalizeRouteIds = async (input) => {
  const raw = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(',')
      : [];

  const ids = raw
    .map((id) => String(id).trim())
    .filter(Boolean);

  if (ids.length === 0) {
    const fallbackRoute = await Route.findOne({ isActive: true }).sort({ createdAt: 1 });
    return fallbackRoute ? [fallbackRoute._id] : [];
  }

  return ids;
};

const getWaypointOrderForRoute = async (routeId, location) => {
  const route = await Route.findById(routeId);
  if (!route) return null;

  const closest = getClosestWaypoint({ location }, route.waypoints);
  return closest?.order ?? route.waypoints?.[0]?.order ?? 0;
};

const buildRestaurantPayload = async (body, existing = null) => {
  const payload = { ...body };

  delete payload.ownerName;
  delete payload.ownerPhone;

  if (body.latitude !== undefined && body.longitude !== undefined) {
    payload.location = {
      type: 'Point',
      coordinates: [parseFloat(body.longitude), parseFloat(body.latitude)],
    };
    delete payload.latitude;
    delete payload.longitude;
  }

  if (body.routes !== undefined || !existing) {
    payload.routes = await normalizeRouteIds(body.routes);
  }

  const location = payload.location || existing?.location;
  const selectedRoutes = payload.routes || existing?.routes || [];
  const firstRouteId = selectedRoutes[0];
  const parsedOrder = body.routeWaypointOrder !== undefined ? Number(body.routeWaypointOrder) : null;

  if (Number.isFinite(parsedOrder)) {
    payload.routeWaypointOrder = parsedOrder;
  } else if (firstRouteId && location) {
    payload.routeWaypointOrder = await getWaypointOrderForRoute(firstRouteId, location);
  }

  if (payload.avgPrepTimeMinutes !== undefined) {
    payload.avgPrepTimeMinutes = parseInt(payload.avgPrepTimeMinutes, 10);
  }

  if (payload.gstRate !== undefined) {
    payload.gstRate = parseFloat(payload.gstRate);
  }

  if (payload.allowPayAtStore !== undefined) {
    payload.allowPayAtStore = String(payload.allowPayAtStore) === 'true';
  }

  if (payload.requireBookingAmountForPayAtStore !== undefined) {
    payload.requireBookingAmountForPayAtStore = String(payload.requireBookingAmountForPayAtStore) === 'true';
  }

  return payload;
};

const resolveRestaurantOwner = async (body) => {
  if (body.owner) return body.owner;
  if (!body.ownerPhone) return null;

  const owner = await User.findOneAndUpdate(
    { phone: body.ownerPhone },
    {
      phone: body.ownerPhone,
      name: body.ownerName || body.name || 'Restaurant Owner',
      role: 'restaurant',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  return owner._id;
};

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
    const { routeId, fromCity, toCity, userLat, userLng, debug } = req.query;

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
    const visibleRestaurants = await Restaurant.find({
      isActive: true,
      portalEnabled: portalEnabledFilter,
    }).lean();

    const allRestaurants = visibleRestaurants
      .map((restaurant) => normalizeForRoute(restaurant, route))
      .filter(Boolean);

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

    let debugData;
    if (debug === 'true' && process.env.NODE_ENV !== 'production') {
      const debugRestaurants = await Restaurant.find({}).lean();
      const restaurantsDebug = getVisibilityDebug(debugRestaurants, route, fromOrder, toOrder);

      debugData = {
        route: {
          id: route._id,
          name: route.name,
          fromCity: fromCity || route.fromCity,
          toCity: toCity || route.toCity,
          fromOrder,
          toOrder,
          matchRadiusKm: ROUTE_MATCH_RADIUS_KM,
        },
        counts: {
          total: restaurantsDebug.length,
          showing: restaurantsDebug.filter((item) => item.showing).length,
          hidden: restaurantsDebug.filter((item) => !item.showing).length,
        },
        restaurants: restaurantsDebug,
      };

      console.log('[restaurants/by-route debug]', JSON.stringify(debugData, null, 2));
    }

    return successResponse(res, {
      route: { name: route.name, slug: route.slug },
      restaurants: sorted,
      ...(debugData ? { debug: debugData } : {}),
    });
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
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      isActive: true,
      portalEnabled: portalEnabledFilter,
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
    const restaurant = await Restaurant.findOne({ owner: req.user._id })
      .populate('routes', 'name slug fromCity toCity'); // 👈 populate route fields

    if (!restaurant) {
      return successResponse(res, { restaurant: null }, 'No restaurant yet');
    }

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

    // Handle payment settings
    if (req.body.allowPayAtStore !== undefined) {
      updates.allowPayAtStore = String(req.body.allowPayAtStore) === 'true';
    }
    if (req.body.requireBookingAmountForPayAtStore !== undefined) {
      updates.requireBookingAmountForPayAtStore = String(req.body.requireBookingAmountForPayAtStore) === 'true';
    }

    // Handle uploaded images
    if (req.files?.coverImage?.[0]) {
      updates.coverImage = req.files.coverImage[0].path;
    }
    if (req.files?.images?.length) {
      updates.images = req.files.images.map(f => f.path);
    }

    // Handle routes array (comes as routes[] from FormData or routes in json)
    if (req.body['routes[]']) {
      const routesArray = Array.isArray(req.body['routes[]']) ? req.body['routes[]'] : [req.body['routes[]']];
      updates.routes = await normalizeRouteIds(routesArray);
    } else if (req.body.routes) {
      updates.routes = await normalizeRouteIds(req.body.routes);
    } else if (!restaurant) {
      // First time and no routes supplied
      updates.routes = await normalizeRouteIds(undefined);
    }

    // Determine routeWaypointOrder based on route coordinates
    const finalRoutes = updates.routes || restaurant?.routes || [];
    const firstRouteId = finalRoutes[0];
    const finalLocation = updates.location || restaurant?.location;
    if (firstRouteId && finalLocation) {
      updates.routeWaypointOrder = await getWaypointOrderForRoute(firstRouteId, finalLocation);
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
      .populate('routes', 'name fromCity toCity')
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
    const owner = await resolveRestaurantOwner(req.body);
    if (!owner) return errorResponse(res, 'Owner phone is required to create a restaurant.', 400);

    const payload = await buildRestaurantPayload(req.body);
    const restaurant = await Restaurant.create({ ...payload, owner });
    return successResponse(res, { restaurant }, 'Restaurant created', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    const payload = await buildRestaurantPayload(req.body, restaurant);
    Object.assign(restaurant, payload);
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

