const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    images: [{ type: String }],
    coverImage: { type: String },
    // Location
    address: {
      street: String,
      city: { type: String, required: true },
      state: String,
      pincode: String,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    // Route association
    routes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
    routeWaypointOrder: { type: Number }, // position on route for sorting
    // Food type
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'both'],
      default: 'both',
    },
    cuisines: [{ type: String }],
    // Ratings
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    // Operational
    isOpen: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // admin control
    isVerified: { type: Boolean, default: false },
    openingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
    },
    // Financials
    gstNumber: { type: String },
    gstRate: { type: Number, default: 5 }, // percentage
    // Prep time
    avgPrepTimeMinutes: { type: Number, default: 20 },
    // Stats
    totalOrders: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    // Admin portal access control
    portalEnabled: { type: Boolean, default: true }, // false = restaurant owner cannot login
  },
  { timestamps: true }
);

restaurantSchema.pre('save', async function (next) {
  // Only auto-assign if location has changed, is new, or routes is empty, and they haven't explicitly modified routes
  if ((this.isModified('location') || !this.routes || this.routes.length === 0) && !this.isModified('routes')) {
    try {
      const Route = mongoose.model('Route');
      const { haversineDistance } = require('../utils/routeUtils');

      if (this.location && this.location.coordinates && this.location.coordinates.length >= 2) {
        const [lng, lat] = this.location.coordinates;
        if (lat !== undefined && lng !== undefined) {
          const routes = await Route.find({ isActive: true });
          let matchedRoutes = [];
          let bestOrder = null;
          let minDistance = Infinity;

          for (const route of routes) {
            let closestWaypoint = null;
            let closestDist = Infinity;

            route.waypoints.forEach((wp) => {
              const dist = haversineDistance(lat, lng, wp.coordinates.lat, wp.coordinates.lng);
              if (dist < closestDist) {
                closestDist = dist;
                closestWaypoint = wp;
              }
            });

            // If the restaurant is within 50 km of any waypoint of the route
            if (closestDist < 50) {
              matchedRoutes.push(route._id);
              if (closestDist < minDistance) {
                minDistance = closestDist;
                bestOrder = closestWaypoint.order;
              }
            }
          }

          if (matchedRoutes.length > 0) {
            this.routes = matchedRoutes;
            this.routeWaypointOrder = bestOrder;
          }
        }
      }
    } catch (err) {
      console.error('Error auto-assigning routes to restaurant:', err);
    }
  }
  next();
});

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ routes: 1 });
restaurantSchema.index({ isOpen: 1, isActive: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
