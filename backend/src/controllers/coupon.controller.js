const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount, restaurantId } = req.body;
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) return errorResponse(res, 'Invalid or expired coupon', 400);
    if (orderAmount < coupon.minOrderAmount) {
      return errorResponse(res, `Minimum order ₹${coupon.minOrderAmount} required`, 400);
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return errorResponse(res, 'Coupon usage limit reached', 400);
    }
    if (coupon.applicableTo === 'restaurant' && coupon.restaurant?.toString() !== restaurantId) {
      return errorResponse(res, 'Coupon not valid for this restaurant', 400);
    }

    // Per-user limit check
    if (coupon.perUserLimit && req.user) {
      const userUsageCount = await Order.countDocuments({
        customer: req.user._id,
        coupon: coupon._id,
        status: { $nin: ['cancelled', 'rejected'] },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        return errorResponse(res, `You have already used this coupon ${coupon.perUserLimit} time(s)`, 400);
      }
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
    } else {
      discount = coupon.discountValue;
    }

    return successResponse(res, {
      coupon: { code: coupon.code, description: coupon.description, discountType: coupon.discountType, discountValue: coupon.discountValue },
      discount: Math.round(discount * 100) / 100,
    }, 'Coupon applied successfully');
  } catch (error) {
    next(error);
  }
};

// Public — active coupons for homepage banner display
exports.getPublicCoupons = async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      applicableTo: 'all', // only show global coupons publicly
    })
      .select('code description discountType discountValue maxDiscountAmount minOrderAmount validUntil')
      .sort({ createdAt: -1 })
      .limit(6);
    return successResponse(res, { coupons });
  } catch (error) {
    next(error);
  }
};

// Admin CRUD
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return successResponse(res, { coupons });
  } catch (error) {
    next(error);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    return successResponse(res, { coupon }, 'Coupon created', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);
    return successResponse(res, { coupon }, 'Coupon updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    return successResponse(res, {}, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant Owner Coupon Management ──────────────────────────────────────

const Restaurant = require('../models/Restaurant');

const getOwnerRestaurant = async (userId) => Restaurant.findOne({ owner: userId });

exports.getMyCoupons = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    const coupons = await Coupon.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });
    return successResponse(res, { coupons });
  } catch (error) { next(error); }
};

exports.createMyCoupon = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    // Restaurant coupons are always scoped to their restaurant only
    const coupon = await Coupon.create({
      ...req.body,
      applicableTo: 'restaurant',
      restaurant: restaurant._id,
      createdBy: req.user._id,
    });
    return successResponse(res, { coupon }, 'Coupon created', 201);
  } catch (error) { next(error); }
};

exports.updateMyCoupon = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      { ...req.body, applicableTo: 'restaurant', restaurant: restaurant._id },
      { new: true }
    );
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);
    return successResponse(res, { coupon }, 'Coupon updated');
  } catch (error) { next(error); }
};

exports.deleteMyCoupon = async (req, res, next) => {
  try {
    const restaurant = await getOwnerRestaurant(req.user._id);
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);
    await Coupon.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
    return successResponse(res, {}, 'Coupon deleted');
  } catch (error) { next(error); }
};
