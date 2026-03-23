const Coupon = require('../models/Coupon');
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
