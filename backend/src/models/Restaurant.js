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
  },
  { timestamps: true }
);

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ routes: 1 });
restaurantSchema.index({ isOpen: 1, isActive: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
