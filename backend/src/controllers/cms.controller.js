const CmsContent = require('../models/CmsContent');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getAllContent = async (req, res, next) => {
  try {
    const { section } = req.query;
    const filter = section ? { section } : {};
    const content = await CmsContent.find(filter);

    // Return as key-value map for easy frontend consumption
    const map = content.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return successResponse(res, { content: map, raw: content });
  } catch (error) {
    next(error);
  }
};

exports.upsertContent = async (req, res, next) => {
  try {
    const { key, section, type, value, label } = req.body;
    const content = await CmsContent.findOneAndUpdate(
      { key },
      { key, section, type, value, label, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    return successResponse(res, { content }, 'Content updated');
  } catch (error) {
    next(error);
  }
};

exports.deleteContent = async (req, res, next) => {
  try {
    await CmsContent.findByIdAndDelete(req.params.id);
    return successResponse(res, {}, 'Content deleted');
  } catch (error) {
    next(error);
  }
};
