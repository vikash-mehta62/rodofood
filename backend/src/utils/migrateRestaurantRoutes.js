const Restaurant = require('../models/Restaurant');
const logger = require('./logger');

const migrateRestaurantRoutes = async () => {
  try {
    const restaurants = await Restaurant.find({
      isActive: true,
      $or: [
        { routes: { $exists: false } },
        { routes: { $size: 0 } },
        { routeWaypointOrder: { $exists: false } }
      ]
    });

    if (restaurants.length === 0) {
      return;
    }

    logger.info(`Found ${restaurants.length} restaurants needing route auto-assignment migration.`);

    let updatedCount = 0;
    for (const restaurant of restaurants) {
      // Force trigger the pre-save hook by calling save()
      await restaurant.save();
      updatedCount++;
    }

    logger.info(`Successfully migrated ${updatedCount} restaurants with auto-assigned routes.`);
  } catch (error) {
    logger.error(`Error in migrateRestaurantRoutes: ${error.message}`);
    throw error;
  }
};

module.exports = migrateRestaurantRoutes;
