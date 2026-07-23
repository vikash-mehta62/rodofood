const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      pendingOrders,
      openTickets,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Restaurant.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing'] } }),
      require('../models/SupportTicket').countDocuments({ status: 'open' }),
    ]);

    return successResponse(res, {
      users: totalUsers,
      restaurants: totalRestaurants,
      orders: { total: totalOrders, today: todayOrders, pending: pendingOrders },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
      },
      openTickets,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    if (role) filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, users, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    user.isActive = !user.isActive;
    await user.save();
    return successResponse(res, { isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const groupBy = period === 'daily'
      ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }
      : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };

    const data = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: groupBy, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 },
    ]);

    return successResponse(res, { analytics: data });
  } catch (error) {
    next(error);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file provided', 400);
    }
    return successResponse(res, { imageUrl: req.file.path });
  } catch (error) {
    next(error);
  }
};

exports.getRestaurantRevenue = async (req, res, next) => {
  try {
    const { timeframe = 'monthly' } = req.query; // day, week, month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let matchStage = { status: 'completed' };
    
    if (timeframe === 'day') {
      matchStage.createdAt = { $gte: today };
    } else if (timeframe === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchStage.createdAt = { $gte: weekAgo };
    } else if (timeframe === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchStage.createdAt = { $gte: monthAgo };
    } else if (timeframe === 'custom' && req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    }

    const data = await Order.aggregate([
      { $match: matchStage },
      { $group: { 
          _id: '$restaurant', 
          revenue: { $sum: '$totalAmount' }, 
          subtotal: { $sum: '$subtotal' }, 
          gstAmount: { $sum: '$gstAmount' }, 
          platformFee: { $sum: '$platformFee' }, 
          discount: { $sum: '$discount' }, 
          orders: { $sum: 1 } 
        } 
      },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurantInfo' } },
      { $unwind: '$restaurantInfo' },
      { $project: {
          _id: 1,
          revenue: 1,
          subtotal: 1,
          gstAmount: 1,
          platformFee: 1,
          discount: 1,
          orders: 1,
          restaurantName: '$restaurantInfo.name'
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    return successResponse(res, { revenueByRestaurant: data });
  } catch (error) {
    next(error);
  }
};

exports.makeAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    user.role = 'admin';
    if (!user.password && req.body?.password) {
      user.password = await bcrypt.hash(req.body.password, 12);
    } else if (!user.password) {
      user.password = await bcrypt.hash('Admin@12345', 12);
    }
    await user.save();
    return successResponse(res, { message: 'User role updated to admin', user });
  } catch (error) {
    next(error);
  }
};

exports.createAdminUser = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!phone || phone.length !== 10) {
      return errorResponse(res, 'Valid 10-digit mobile number is required', 400);
    }
    const rawPassword = password && password.trim() ? password.trim() : 'Admin@12345';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const existing = await User.findOne({ phone });
    if (existing) {
      existing.role = 'admin';
      if (name) existing.name = name;
      if (email) existing.email = email;
      existing.password = hashedPassword;
      await existing.save();
      return successResponse(res, { user: existing }, 'User updated and assigned admin access');
    }
    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      role: 'admin',
      isPhoneVerified: true,
      isActive: true,
    });
    return successResponse(res, { user }, 'New admin user created successfully', 201);
  } catch (error) {
    next(error);
  }
};
