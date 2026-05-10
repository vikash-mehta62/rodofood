const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  foodType: { type: String, enum: ['veg', 'non-veg', 'egg'] },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [orderItemSchema],
    // Pricing
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    // Coupon
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String },
    // Order type
    orderType: { type: String, enum: ['dine-in', 'takeaway'], default: 'takeaway' },
    // ETA
    customerETA: { type: Date, required: true }, // when customer expects to arrive
    etaMinutes: { type: Number }, // 30, 45, custom
    // Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    // Payment
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi_at_restaurant', 'online'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentTransactionId: { type: String }, // Razorpay payment_id
    razorpayOrderId: { type: String },      // Razorpay order_id   // razorpay_payment_id
    razorpayOrderId:      { type: String },   // rzp order id
    razorpayPaymentId:    { type: String },   // rzp payment id
    razorpaySignature:    { type: String },   // rzp signature (for audit)
    // Customer location at time of order
    customerLocation: {
      lat: Number,
      lng: Number,
      distanceFromRestaurantKm: Number,
    },
    // Trip info
    tripRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    // Rejection reason
    rejectionReason: { type: String },
    // Rating (customer gives after completion)
    rating: {
      stars: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 300 },
      ratedAt: { type: Date },
    },
    // Admin manual order flag
    isManualOrder: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `RF${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
