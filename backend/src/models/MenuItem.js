const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, required: true }, // e.g. "Starters", "Main Course"
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number },
    image: { type: String },
    foodType: { type: String, enum: ['veg', 'non-veg', 'egg'], required: true },
    isAvailable: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 15 }, // minutes
    tags: [{ type: String }], // e.g. ["spicy", "bestseller"]
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
