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
