const SupportTicket = require('../models/SupportTicket');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

exports.createTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.create({
      ...req.body,
      user: req.user?._id,
    });
    return successResponse(res, { ticket }, 'Support ticket created', 201);
  } catch (error) {
    next(error);
  }
};

exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, { tickets });
  } catch (error) {
    next(error);
  }
};

// Admin
exports.getAllTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const total = await SupportTicket.countDocuments(filter);
    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, tickets, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.updateTicket = async (req, res, next) => {
  try {
    const { status, adminNotes, priority } = req.body;
    const update = { status, adminNotes, priority };
    if (status === 'resolved') {
      update.resolvedAt = new Date();
      update.resolvedBy = req.user._id;
    }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);
    return successResponse(res, { ticket }, 'Ticket updated');
  } catch (error) {
    next(error);
  }
};
