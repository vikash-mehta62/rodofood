const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @swagger
 * /menu/{restaurantId}:
 *   get:
 *     summary: Get menu for a restaurant (grouped by category)
 *     tags: [Menu]
 */
exports.getMenu = async (req, res, next) => {
  try {
    // Check restaurant is active and portal enabled before showing menu
    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurantId,
      isActive: true,
      portalEnabled: true,
    }).select('_id');
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const items = await MenuItem.find({
      restaurant: req.params.restaurantId,
      isAvailable: true,
    }).sort({ category: 1, sortOrder: 1 });

    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return successResponse(res, { menu: grouped });
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant Owner ─────────────────────────────────────────────────────────

const getOwnerRestaurant = async (userId) => {
  return Restaurant.findOne({ owner: userId });
};

// Owner gets ALL items (available + unavailable) for management
exports.getOwnerMenu = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const items = await MenuItem.find({ restaurant: restaurant._id })
      .sort({ category: 1, sortOrder: 1 });

    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return successResponse(res, { menu: grouped });
  } catch (error) {
    next(error);
  }
};

exports.addMenuItem = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const data = { ...req.body, restaurant: restaurant._id };
    if (req.file) data.image = req.file.path; // Cloudinary returns full URL in path

    const item = await MenuItem.create(data);
    return successResponse(res, { item }, 'Menu item added', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.path; // Cloudinary full URL

    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!item) return errorResponse(res, 'Menu item not found', 404);
    return successResponse(res, { item }, 'Menu item updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
    return successResponse(res, {}, 'Menu item deleted');
  } catch (error) {
    next(error);
  }
};

exports.toggleItemAvailability = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const item = await MenuItem.findOne({ _id: req.params.id, restaurant: restaurant._id });
    if (!item) return errorResponse(res, 'Menu item not found', 404);

    item.isAvailable = !item.isAvailable;
    await item.save();
    return successResponse(res, { isAvailable: item.isAvailable });
  } catch (error) {
    next(error);
  }
};
