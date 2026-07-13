const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Coupon = require('../models/Coupon');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { sendOrderConfirmationEmail, sendNewOrderEmailToRestaurant, sendOrderStatusEmail, sendRefundEmail } = require('../utils/emailService');
const Razorpay = require('razorpay');
const logger = require('../utils/logger');
const Device = require('../models/Device');
const fcmService = require('../services/fcmService');

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
      if (couponDoc.usageLimit && couponDoc.usageCount >= couponDoc.usageLimit) {
        return errorResponse(res, 'Coupon usage limit reached', 400);
      }
      // Per-user limit check
      if (couponDoc.perUserLimit) {
        const userUsageCount = await Order.countDocuments({
          customer: req.user._id,
          coupon: couponDoc._id,
          status: { $nin: ['cancelled', 'rejected'] },
        });
        if (userUsageCount >= couponDoc.perUserLimit) {
          return errorResponse(res, `You have already used this coupon ${couponDoc.perUserLimit} time(s)`, 400);
        }
      }
      if (couponDoc.discountType === 'percentage') {
        discount = (subtotal * couponDoc.discountValue) / 100;
        if (couponDoc.maxDiscountAmount) discount = Math.min(discount, couponDoc.maxDiscountAmount);
      } else {
        discount = couponDoc.discountValue;
      }
    }

    const platformFee = 5; // Default platform fee
    const gstRate = restaurant.gstRate || 0;
    const taxableAmount = subtotal - discount;
    const gstAmount = Math.round((taxableAmount * gstRate) / 100 * 100) / 100;
    const totalAmount = Math.round((taxableAmount + gstAmount + platformFee) * 100) / 100;

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      subtotal,
      gstAmount,
      gstRate,
      discount,
      platformFee,
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
    if (paymentMethod !== 'online' && req.user.email) {
      await populated.populate({ path: 'customer', select: 'name email' });
      sendOrderConfirmationEmail(req.user.email, {
        order: populated,
        customerName: req.user.name,
      }).catch(() => {});
    }

    // Send new order notification to restaurant owner
    const restaurantDoc = await Restaurant.findById(restaurantId).populate('owner', 'email name');
    if (restaurantDoc?.owner?.email) {
      sendNewOrderEmailToRestaurant(restaurantDoc.owner.email, {
        order: populated,
        restaurantName: restaurantDoc.name,
      }).catch(() => {});
    }

    // Send Push Notification to Customer
    Device.find({ userId: req.user._id }).then((devices) => {
      devices.forEach(d => {
        if (d.fcmToken) fcmService.sendToDevice(d.fcmToken, 'Order Placed!', `Your order #${order.orderNumber} has been placed successfully.`).catch(() => {});
      });
    }).catch(() => {});

    // Send Push Notification to Restaurant
    if (restaurantDoc?.owner?._id) {
      Device.find({ vendorId: restaurantDoc.owner._id }).then((devices) => {
        devices.forEach(d => {
          if (d.fcmToken) fcmService.sendToDevice(d.fcmToken, 'New Order!', `You have received a new order #${order.orderNumber}.`).catch(() => {});
        });
      }).catch(() => {});
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
    const { status, rejectionReason, cancellationImages } = req.body;
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return errorResponse(res, 'Restaurant not found', 404);

    const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });
    if (!order) return errorResponse(res, 'Order not found', 404);

    // Validate status transitions
    const validTransitions = {
      pending:   ['confirmed', 'rejected'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready:     ['completed', 'cancelled'],
    };
    if (validTransitions[order.status] && !validTransitions[order.status].includes(status)) {
      return errorResponse(res, `Cannot change status from ${order.status} to ${status}`, 400);
    }

    const isCancelling = ['cancelled', 'rejected'].includes(status);

    order.status = status;
    if (rejectionReason) order.rejectionReason = rejectionReason;
    if (cancellationImages?.length) order.cancellationImages = cancellationImages;
    order.statusHistory.push({ status, timestamp: new Date(), note: rejectionReason || undefined });
    await order.save();

    // ── Auto-refund for online paid orders when cancelled/rejected ──────────
    let refundResult = null;
    if (isCancelling && order.paymentMethod === 'online' && order.paymentStatus === 'paid' && order.paymentTransactionId) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const refund = await razorpay.payments.refund(order.paymentTransactionId, {
          amount: Math.round(order.totalAmount * 100), // full refund in paise
          notes: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            reason: rejectionReason || `Order ${status} by restaurant`,
          },
        });
        order.paymentStatus = 'refunded';
        order.refundId = refund.id;
        await order.save();
        refundResult = { refundId: refund.id, amount: order.totalAmount };
        logger.info(`Refund initiated: ${refund.id} for order ${order.orderNumber}`);
      } catch (refundErr) {
        logger.error(`Razorpay refund failed for order ${order.orderNumber}: ${refundErr.message}`);
        // Don't block the cancellation — just log the error
      }
    }

    // Notify customer via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.customer}`).emit('order_status_update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status,
        refund: refundResult,
      });
    }

    // Send Push Notification to Customer
    Device.find({ userId: order.customer }).then((devices) => {
      devices.forEach(d => {
        if (d.fcmToken) fcmService.sendToDevice(d.fcmToken, 'Order Update', `Your order #${order.orderNumber} is now ${status}.`).catch(() => {});
      });
    }).catch(() => {});

    // Send status update email to customer
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('restaurant', 'name');
    if (populatedOrder?.customer?.email) {
      sendOrderStatusEmail(populatedOrder.customer.email, {
        order: populatedOrder,
        customerName: populatedOrder.customer.name,
        status,
      }).catch(() => {});

      // Send refund email if refund was initiated
      if (refundResult) {
        sendRefundEmail(populatedOrder.customer.email, {
          order: populatedOrder,
          customerName: populatedOrder.customer.name,
          refundAmount: refundResult.amount,
          refundId: refundResult.refundId,
        }).catch(() => {});
      }
    }

    return successResponse(res, {
      order,
      refund: refundResult ? { initiated: true, refundId: refundResult.refundId, amount: refundResult.amount } : null,
    }, `Order ${status}${refundResult ? ' — Refund initiated' : ''}`);
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

    const groupStage = { 
      _id: null, 
      total: { $sum: '$totalAmount' }, 
      subtotal: { $sum: '$subtotal' },
      gstAmount: { $sum: '$gstAmount' },
      platformFee: { $sum: '$platformFee' },
      discount: { $sum: '$discount' },
      count: { $sum: 1 } 
    };

    const [todayStats, monthStats, allTime] = await Promise.all([
      Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'completed', createdAt: { $gte: today } } },
        { $group: groupStage },
      ]),
      Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'completed', createdAt: { $gte: monthStart } } },
        { $group: groupStage },
      ]),
      Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'completed' } },
        { $group: groupStage },
      ]),
    ]);

    const defaultStats = { total: 0, subtotal: 0, gstAmount: 0, platformFee: 0, discount: 0, count: 0 };
    const responseData = {
      today: todayStats[0] || defaultStats,
      thisMonth: monthStats[0] || defaultStats,
      allTime: allTime[0] || defaultStats,
    };

    if (req.query.timeframe === 'custom' && req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      
      const customStats = await Order.aggregate([
        { $match: { restaurant: restaurant._id, status: 'completed', createdAt: { $gte: start, $lte: end } } },
        { $group: groupStage },
      ]);
      responseData.custom = customStats[0] || defaultStats;
    }

    return successResponse(res, responseData);
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

    // Auto-refund if online paid
    let refundResult = null;
    if (order.paymentMethod === 'online' && order.paymentStatus === 'paid' && order.paymentTransactionId) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const refund = await razorpay.payments.refund(order.paymentTransactionId, {
          amount: Math.round(order.totalAmount * 100),
          notes: { orderId: order._id.toString(), reason: 'Cancelled by customer' },
        });
        order.paymentStatus = 'refunded';
        order.refundId = refund.id;
        await order.save();
        refundResult = { refundId: refund.id, amount: order.totalAmount };
        logger.info(`Customer cancel refund: ${refund.id} for order ${order.orderNumber}`);
      } catch (refundErr) {
        logger.error(`Refund failed on customer cancel: ${refundErr.message}`);
      }
    }

    // Send Push Notification to Restaurant
    const restaurantDoc = await Restaurant.findById(order.restaurant);
    if (restaurantDoc?.owner) {
      Device.find({ vendorId: restaurantDoc.owner }).then((devices) => {
        devices.forEach(d => {
          if (d.fcmToken) fcmService.sendToDevice(d.fcmToken, 'Order Cancelled', `Customer cancelled order #${order.orderNumber}.`).catch(() => {});
        });
      }).catch(() => {});
    }

    return successResponse(res, {
      order,
      refund: refundResult ? { initiated: true, refundId: refundResult.refundId, amount: refundResult.amount } : null,
    }, 'Order cancelled' + (refundResult ? ' — Refund initiated' : ''));
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
