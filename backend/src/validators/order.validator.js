const Joi = require('joi');

const createOrderSchema = Joi.object({
  restaurantId: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        menuItemId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
  orderType: Joi.string().valid('dine-in', 'takeaway').default('takeaway'),
  paymentMethod: Joi.string().valid('cash', 'upi_at_restaurant', 'online').required(),
  customerETA: Joi.date().iso().required(),
  etaMinutes: Joi.number().integer().min(0).allow(null).optional(),
  couponCode: Joi.string().uppercase().optional(),
  customerLocation: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).optional(),
  tripRouteId: Joi.string().optional(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'rejected')
    .required(),
  rejectionReason: Joi.string().when('status', {
    is: Joi.valid('rejected', 'cancelled'),
    then: Joi.optional(),
    otherwise: Joi.optional(),
  }),
  cancellationImages: Joi.array().items(Joi.string().uri()).max(5).optional(),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
