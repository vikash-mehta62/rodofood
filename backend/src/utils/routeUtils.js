/**
 * Route-based filtering utilities
 * Core logic for matching restaurants to a travel route
 */

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns distance in kilometers
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Find the closest waypoint index on a route to a given coordinate
 */
const findClosestWaypointIndex = (waypoints, lat, lng) => {
  let minDist = Infinity;
  let idx = 0;
  waypoints.forEach((wp, i) => {
    const d = haversineDistance(lat, lng, wp.coordinates.lat, wp.coordinates.lng);
    if (d < minDist) { minDist = d; idx = i; }
  });
  return idx;
};

/**
 * Filter and sort restaurants along a route segment
 * @param {Array} restaurants - all restaurants with routeWaypointOrder
 * @param {Object} fromWaypoint - { order: number }
 * @param {Object} toWaypoint - { order: number }
 * @returns sorted restaurants between from and to waypoints
 */
const filterRestaurantsByRoute = (restaurants, fromOrder, toOrder) => {
  const isForward = toOrder >= fromOrder;
  return restaurants
    .filter((r) => {
      const o = r.routeWaypointOrder;
      return isForward
        ? o >= fromOrder && o <= toOrder
        : o <= fromOrder && o >= toOrder;
    })
    .sort((a, b) =>
      isForward
        ? a.routeWaypointOrder - b.routeWaypointOrder
        : b.routeWaypointOrder - a.routeWaypointOrder
    );
};

/**
 * Calculate ETA in minutes given distance (km) and avg speed (km/h)
 */
const calculateETA = (distanceKm, avgSpeedKmh = 60) => {
  return Math.round((distanceKm / avgSpeedKmh) * 60);
};

/**
 * Determine if a restaurant is "ahead" or "passed" based on user's current position
 */
const classifyRestaurantPosition = (userWaypointOrder, restaurantWaypointOrder, isForwardTrip) => {
  if (isForwardTrip) {
    return restaurantWaypointOrder > userWaypointOrder ? 'ahead' : 'passed';
  }
  return restaurantWaypointOrder < userWaypointOrder ? 'ahead' : 'passed';
};

module.exports = {
  haversineDistance,
  findClosestWaypointIndex,
  filterRestaurantsByRoute,
  calculateETA,
  classifyRestaurantPosition,
};
