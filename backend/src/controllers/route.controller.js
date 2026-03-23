const Route = require('../models/Route');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getAllRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find({ isActive: true }).select('name slug fromCity toCity totalDistanceKm');
    return successResponse(res, { routes });
  } catch (error) {
    next(error);
  }
};

exports.getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return errorResponse(res, 'Route not found', 404);
    return successResponse(res, { route });
  } catch (error) {
    next(error);
  }
};

exports.createRoute = async (req, res, next) => {
  try {
    const route = await Route.create(req.body);
    return successResponse(res, { route }, 'Route created', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) return errorResponse(res, 'Route not found', 404);
    return successResponse(res, { route }, 'Route updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteRoute = async (req, res, next) => {
  try {
    await Route.findByIdAndUpdate(req.params.id, { isActive: false });
    return successResponse(res, {}, 'Route deactivated');
  } catch (error) {
    next(error);
  }
};
