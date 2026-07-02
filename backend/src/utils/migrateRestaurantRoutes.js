const Restaurant = require('../models/Restaurant');
const Route = require('../models/Route');
const logger = require('./logger');
const { haversineDistance } = require('./routeUtils');

const getClosestWaypointOrder = (restaurant, route) => {
  const coordinates = restaurant.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return route.waypoints?.[0]?.order ?? 0;

  const [lng, lat] = coordinates;
  if (lat === undefined || lng === undefined) return route.waypoints?.[0]?.order ?? 0;

  let closestOrder = route.waypoints?.[0]?.order ?? 0;
  let closestDistance = Infinity;

  for (const waypoint of route.waypoints || []) {
    const distance = haversineDistance(lat, lng, waypoint.coordinates.lat, waypoint.coordinates.lng);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestOrder = waypoint.order;
    }
  }

  return closestOrder;
};

const migrateRestaurantRoutes = async () => {
  try {
    const defaultRoute = await Route.findOne({ isActive: true }).sort({ createdAt: 1 });
    if (!defaultRoute) {
      logger.info('No active route found for restaurant route migration.');
      return;
    }

    const activeRoutes = await Route.find({ isActive: true }).sort({ createdAt: 1 });
    const activeRouteIds = new Set(activeRoutes.map((route) => String(route._id)));

    const restaurants = await Restaurant.find({});
    if (restaurants.length === 0) {
      return;
    }

    logger.info(`Ensuring restaurants have valid route assignments. Default route: ${defaultRoute.name}.`);

    let updatedCount = 0;
    for (const restaurant of restaurants) {
      const routes = [defaultRoute._id];
      const nextWaypointOrder = getClosestWaypointOrder(restaurant, defaultRoute);
      
      const routesChanged = !restaurant.routes || restaurant.routes.length !== 1 || String(restaurant.routes[0]) !== String(defaultRoute._id);
      const orderChanged = restaurant.routeWaypointOrder !== nextWaypointOrder;

      if (routesChanged || orderChanged) {
        restaurant.routes = routes;
        restaurant.routeWaypointOrder = nextWaypointOrder;
        await restaurant.save();
        updatedCount++;
      }
    }

    logger.info(`Restaurant route migration updated ${updatedCount} restaurants.`);
  } catch (error) {
    logger.error(`Error in migrateRestaurantRoutes: ${error.message}`);
    throw error;
  }
};

module.exports = migrateRestaurantRoutes;

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');

  mongoose.connect(process.env.MONGO_URI)
    .then(() => migrateRestaurantRoutes())
    .then(() => mongoose.disconnect())
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}
