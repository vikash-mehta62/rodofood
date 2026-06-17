const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Route:
 *       type: object
 *       properties:
 *         name: { type: string, example: "Bhopal - Indore" }
 *         slug: { type: string, example: "bhopal-indore" }
 *         waypoints:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat: { type: number }
 *                   lng: { type: number }
 *               order: { type: number }
 */
const waypointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  order: { type: Number, required: true }, // sequence along route
});

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    totalDistanceKm: { type: Number },
    waypoints: [waypointSchema], // ordered list of cities/coords on route
    isActive: { type: Boolean, default: true },
    // GeoJSON LineString for spatial queries
    path: {
      type: { type: String, enum: ['LineString'], default: 'LineString' },
      coordinates: [[Number]], // [[lng, lat], ...]
    },
  },
  { timestamps: true }
);

routeSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  if (this.isModified('waypoints') && this.waypoints && this.waypoints.length > 0) {
    const sortedWaypoints = [...this.waypoints].sort((a, b) => a.order - b.order);
    const coords = sortedWaypoints
      .filter(w => w.coordinates && w.coordinates.lng !== undefined && w.coordinates.lat !== undefined)
      .map(w => [w.coordinates.lng, w.coordinates.lat]);
    
    this.path = {
      type: 'LineString',
      coordinates: coords
    };
  }
  next();
});

routeSchema.index({ path: '2dsphere' });

module.exports = mongoose.model('Route', routeSchema);
