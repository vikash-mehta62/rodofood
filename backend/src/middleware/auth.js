const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Verify JWT and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-otp -otpExpiry -otpAttempts');
    if (!user || !user.isActive) {
      return errorResponse(res, 'User not found or deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please login again.', 401);
    }
    return errorResponse(res, 'Invalid token.', 401);
  }
};

/**
 * Role-based access control
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `Role '${req.user.role}' is not authorized for this action.`, 403);
    }
    next();
  };
};

/**
 * Check restaurant portal access — blocks restaurant owner if portalEnabled=false
 * Note: If no restaurant exists yet (new owner), allow through so they can create one
 */
const checkPortalAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'restaurant') return next();
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).select('portalEnabled isActive');
    // No restaurant yet — new owner setting up profile, allow through
    if (!restaurant) return next();
    if (!restaurant.isActive) {
      return errorResponse(res, 'Your restaurant has been deactivated. Please contact support.', 403);
    }
    if (restaurant.portalEnabled === false) {
      return errorResponse(res, 'Your restaurant portal access has been disabled by admin. Please contact support.', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, authorize, checkPortalAccess };
