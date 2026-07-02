const QRCode = require('../models/QRCode');
const Route = require('../models/Route');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getAllQRs = async (req, res, next) => {
  try {
    const qrs = await QRCode.find({})
      .populate('route', 'name fromCity toCity')
      .populate('stops.restaurant', 'name')
      .sort({ createdAt: -1 });

    return successResponse(res, { qrs });
  } catch (error) {
    next(error);
  }
};

exports.getQRById = async (req, res, next) => {
  try {
    const qr = await QRCode.findById(req.params.id)
      .populate('route', 'name fromCity toCity')
      .populate('stops.restaurant', 'name cuisines coverImage avgPrepTimeMinutes isOpen rating totalRatings address foodType');

    if (!qr) {
      return errorResponse(res, 'QR Code config not found.', 404);
    }
    return successResponse(res, { qr });
  } catch (error) {
    next(error);
  }
};

exports.getQRsByRoute = async (req, res, next) => {
  try {
    const qrs = await QRCode.find({ route: req.params.routeId, isActive: true })
      .populate('route', 'name fromCity toCity')
      .populate('stops.restaurant', 'name cuisines coverImage avgPrepTimeMinutes isOpen rating totalRatings address foodType')
      .sort({ createdAt: 1 });

    return successResponse(res, { qrs });
  } catch (error) {
    next(error);
  }
};

exports.createQR = async (req, res, next) => {
  try {
    const { title, routeId, stops } = req.body;

    if (!title || !routeId || !stops || !Array.isArray(stops) || stops.length === 0) {
      return errorResponse(res, 'Title, Route, and at least one Stop are required.', 400);
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return errorResponse(res, 'Route not found.', 404);
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    // Create the parent QR config first (placeholder URL)
    const qr = await QRCode.create({
      title,
      route: routeId,
      stops: stops.map((s, idx) => ({
        stopNumber: s.stopNumber || (idx + 1),
        restaurant: s.restaurantId,
        stopTime: s.stopTime,
        stopDuration: s.stopDuration ? `${s.stopDuration.toString().replace(/\s*mins?/i, '')} mins` : undefined,
      })),
      url: `${clientUrl}/qr-landing?qrId=temp`,
    });

    // Generate consolidated redirection URL using the newly created qr._id
    const redirectUrl = `${clientUrl}/qr-landing?qrId=${qr._id}`;
    qr.url = redirectUrl;
    await qr.save();

    return successResponse(res, { qr }, 'QR Code config generated successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateQR = async (req, res, next) => {
  try {
    const { title, routeId, stops } = req.body;

    const qr = await QRCode.findById(req.params.id);
    if (!qr) {
      return errorResponse(res, 'QR Code not found.', 404);
    }

    if (title) qr.title = title;
    if (routeId) qr.route = routeId;
    if (stops && Array.isArray(stops)) {
      qr.stops = stops.map((s, idx) => ({
        stopNumber: s.stopNumber || (idx + 1),
        restaurant: s.restaurantId,
        stopTime: s.stopTime,
        stopDuration: s.stopDuration ? `${s.stopDuration.toString().replace(/\s*mins?/i, '')} mins` : undefined,
      }));
    }

    await qr.save();
    return successResponse(res, { qr }, 'QR Code config updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteQR = async (req, res, next) => {
  try {
    const qr = await QRCode.findByIdAndDelete(req.params.id);
    if (!qr) {
      return errorResponse(res, 'QR Code not found.', 404);
    }
    return successResponse(res, {}, 'QR Code deleted successfully');
  } catch (error) {
    next(error);
  }
};
