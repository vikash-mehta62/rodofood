const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Coupon = require('../models/Coupon');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// ─── Customer ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { restaurantId, items, orderType, paymentMethod, customerETA, etaMinutes, couponCode, customerLocation, tripRouteId } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) return errorResponse(res, 'Restaurant not available', 400);
    if (!restaurant.isOpen) return errorResponse(res, 'Restaurant is currently closed', 400);

    // Fetch and validate menu items
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, restaurant: restaurantId, isAvailable: true });

    if (menuItems.length !== items.length) {
      return errorResponse(res, 'One or more items are unavailable', 400);
    }

    // Build order items and calculate subtotal
    let subtotal = 0;
    const orderItems = items.map((i) => {
      const mi = menuItems.find((m) => m._id.toString() === i.menuItemId);
      const price = mi.discountedPrice || mi.price;
      subtotal += price * i.quantity;
      return { menuItem: mi._id, name: mi.name, price, quantity: i.quantity, foodType: mi.foodType };
    });

    // Apply coupon
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });
      if (!couponDoc) return errorResponse(res, 'Invalid or expired coupon', 400);
      if (subtotal < couponDoc.minOrderAmount) {
        return errorResponse(res, `Minimum order amount for this coupon is ₹${couponDoc.minOrderAmount}`, 400);
      }
      if (couponDoc.discountType === 'percentage') {
        discount = (subtotal * couponDoc.discountValue) / 100;
        if (couponDoc.maxDiscountAmount) discount = Math.min(discount, couponDoc.maxDiscountAmount);
      } else {
        discount = couponDoc.discountValue;
      }
    }

    const gstRate = restaurant.gstRate;
    const taxableAmount = subtotal - discount;
    const gstAmount = Math.round((taxableAmount * gstRate) / 100 * 100) / 100;
    const totalAmount = Math.round((taxableAmount + gstAmount) * 100) / 100;

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      subtotal,
      gstAmount,
      gstRate,
      discount,
      totalAmount,
      coupon: couponDoc?._id,
      couponCode: couponDoc?.code,
      orderType,
      paymentMethod,
      customerETA,
      etaMinutes,
      customerLocation,
      tripRoute: tripRouteId,
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    });

    // Increment coupon usage
    if (couponDoc) {
      await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usageCount: 1 } });
    }

    // Emit socket event to restaurant
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant_${restaurantId}`).emit('new_order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemCount: orderItems.length,
      });
    }

    const populated = await order.populate([
      { path: 'restaurant', select: 'name address location phone' },
      { path: 'items.menuItem', select: 'name image' },
    ]);

    // Send order confirmation email for non-online payment methods
    // (online payment orders get email after Razorpay verification)
    if (paymentMethod !== 'online' && req.user.email) {
      await populated.populate({ path: 'customer', select: 'name email' });
      sendOrderConfirmationEmail(req.user.email, {
        order: populated,
        customerName: req.user.name,
      }).catch(() => {}); // fire-and-forget
    }

    return successResponse(res, { order: populated }, 'Order placed successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Order.countDocuments({ customer: req.user._id });
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name coverImage address')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginatedResponse(res, orders, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id })
      .populate('restaurant', 'name address location phone coverImage')
      .populate('items.menuItem', 'name image');
    if (!order) return errorResponse(res, 'Order not found', 404);
    return successResponse(res, { order });
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant Owner ─────────────────────────────────────────────────────────

exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const { status, page = 1, limit = 20, date } = req.query;
    const filter = { restaurant: restaurant._id };
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, orders, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });
    if (!order) return errorResponse(res, 'Order not found', 404);

    order.status = status;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    order.statusHistory.push({ status, timestamp: new Date() });
    await order.save();

    // Notify customer via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.customer}`).emit('order_status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status,
      });
    }

    return successResponse(res, { order }, `Order ${status}`);
  } catch (error) {
    next(error);
  }
};

exports.getRestaurantEarnings = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayStats, monthStats, allTime] = await Promise.all([
      Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'completed', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'completed', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
    ]);

    return successResponse(res, {
      today: todayStats[0] || { total: 0, count: 0 },
      thisMonth: monthStats[0] || { total: 0, count: 0 },
      allTime: allTime[0] || { total: 0, count: 0 },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Customer Cancel ──────────────────────────────────────────────────────────

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) return errorResponse(res, 'Order not found', 404);
    if (!['pending'].includes(order.status)) {
      return errorResponse(res, 'Only pending orders can be cancelled', 400);
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Cancelled by customer' });
    await order.save();
    return successResponse(res, { order }, 'Order cancelled');
  } catch (error) {
    next(error);
  }
};

// ─── Rating ───────────────────────────────────────────────────────────────────

exports.rateOrder = async (req, res, next) => {
  try {
    const { stars, comment } = req.body;
    if (!stars || stars < 1 || stars > 5) return errorResponse(res, 'Rating must be between 1 and 5', 400);

    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) return errorResponse(res, 'Order not found', 404);
    if (order.status !== 'completed') return errorResponse(res, 'You can only rate completed orders', 400);
    if (order.rating?.stars) return errorResponse(res, 'You have already rated this order', 400);

    order.rating = { stars, comment: comment?.trim() || '', ratedAt: new Date() };
    await order.save();

    // Recalculate restaurant rating
    const allRatings = await Order.find({
      restaurant: order.restaurant,
      'rating.stars': { $exists: true },
    }).select('rating.stars');

    const total = allRatings.length;
    const avg = allRatings.reduce((sum, o) => sum + o.rating.stars, 0) / total;

    await Restaurant.findByIdAndUpdate(order.restaurant, {
      rating: Math.round(avg * 10) / 10,
      totalRatings: total,
    });

    return successResponse(res, { order }, 'Rating submitted successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, restaurantId, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (restaurantId) filter.restaurant = restaurantId;
    if (userId) filter.customer = userId;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, orders, total, page, limit);
  } catch (error) {
    next(error);
  }
};
