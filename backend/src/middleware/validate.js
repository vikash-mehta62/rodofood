const { errorResponse } = require('../utils/apiResponse');

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return errorResponse(res, 'Validation failed', 422, errors);
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
