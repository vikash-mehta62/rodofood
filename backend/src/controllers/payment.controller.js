const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const Coupon = require('../models/Coupon');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * POST /api/v1/payments/initiate
 * Validates cart + calculates total, creates a Razorpay order.
 * Does NOT create our DB Order yet — that only happens after payment is verified.
 */
exports.initiatePayment = async (req, res, next) => {
  try {
    const { restaurantId, items, orderType, customerETA, etaMinutes, couponCode, customerLocation, tripRouteId } = req.body;

    if (!restaurantId || !items?.length || !customerETA) {
      return errorResponse(res, 'restaurantId, items and customerETA are required', 400);
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) return errorResponse(res, 'Restaurant not available', 400);
    if (!restaurant.isOpen) return errorResponse(res, 'Restaurant is currently closed', 400);

    // Validate menu items
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, restaurant: restaurantId, isAvailable: true });
    if (menuItems.length !== items.length) return errorResponse(res, 'One or more items are unavailable', 400);

    // Calculate subtotal
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

    const gstRate = restaurant.gstRate || 5;
    const taxableAmount = subtotal - discount;
    const gstAmount = Math.round((taxableAmount * gstRate) / 100 * 100) / 100;
    const totalAmount = Math.round((taxableAmount + gstAmount) * 100) / 100;

    // Return validated cart snapshot + amount for frontend to open Razorpay directly
    // No Razorpay order created here — frontend opens checkout, backend only verifies after
    return successResponse(res, {
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      snapshot: {
        restaurantId, items: orderItems, orderType, customerETA, etaMinutes,
        couponId: couponDoc?._id, couponCode: couponDoc?.code,
        subtotal, discount, gstAmount, gstRate, totalAmount,
        customerLocation, tripRouteId,
      },
    });
  } catch (error) {
    logger.error(`Payment initiate error: ${error?.message || JSON.stringify(error)}`);
    logger.error(`Payment initiate full error: ${JSON.stringify(error)}`);
    // Razorpay API errors come as objects with statusCode
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error?.error?.description || 'Payment gateway error' });
    }
    next(error);
  }
};

/**
 * POST /api/v1/payments/verify
 * Receives payment_id from frontend → creates Order in DB → sends email.
 * Note: When opening Razorpay without a pre-created order_id, only razorpay_payment_id is returned.
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, snapshot } = req.body;

    if (!razorpay_payment_id || !snapshot) {
      return errorResponse(res, 'Missing payment verification fields', 400);
    }

    // Create the order now that payment is done
    const order = await Order.create({
      customer: req.user._id,
      restaurant: snapshot.restaurantId,
      items: snapshot.items,
      subtotal: snapshot.subtotal,
      gstAmount: snapshot.gstAmount,
      gstRate: snapshot.gstRate,
      discount: snapshot.discount,
      totalAmount: snapshot.totalAmount,
      coupon: snapshot.couponId,
      couponCode: snapshot.couponCode,
      orderType: snapshot.orderType || 'takeaway',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentTransactionId: razorpay_payment_id,
      customerETA: snapshot.customerETA,
      etaMinutes: snapshot.etaMinutes,
      customerLocation: snapshot.customerLocation,
      tripRoute: snapshot.tripRouteId,
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    });

    // Increment coupon usage
    if (snapshot.couponId) {
      await Coupon.findByIdAndUpdate(snapshot.couponId, { $inc: { usageCount: 1 } });
    }

    // Emit socket event to restaurant
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant_${snapshot.restaurantId}`).emit('new_order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemCount: snapshot.items.length,
      });
    }

    const populated = await order.populate([
      { path: 'restaurant', select: 'name address location phone' },
      { path: 'items.menuItem', select: 'name image' },
      { path: 'customer', select: 'name email' },
    ]);

    logger.info(`Order ${order.orderNumber} created after payment ${razorpay_payment_id}`);

    // Send confirmation email
    const customer = populated.customer;
    if (customer?.email) {
      sendOrderConfirmationEmail(customer.email, {
        order: populated,
        customerName: customer.name,
      }).catch(() => {});
    }

    return successResponse(res, { order: populated }, 'Payment verified and order placed successfully', 201);
  } catch (error) {
    logger.error(`Payment verify error: ${error.message}`);
    next(error);
  }
};
