const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { sendOverdueOrderAlert } = require('../utils/emailService');
const logger = require('../utils/logger');

// Track which orders we've already alerted to avoid spam
const alertedOrders = new Set();

/**
 * Check for orders where customer ETA has passed by 20+ minutes
 * and order is still in active status — alert restaurant
 */
async function checkOverdueOrders() {
  try {
    const now = new Date();
    const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);

    // Find orders where:
    // - customerETA was 20+ minutes ago
    // - status is still active (not completed/cancelled/rejected)
    // - we haven't already alerted for this order
    const overdueOrders = await Order.find({
      status: { $in: ['confirmed', 'preparing', 'ready'] },
      customerETA: { $lte: twentyMinsAgo },
    })
      .populate('restaurant', 'name email owner')
      .populate('customer', 'name');

    for (const order of overdueOrders) {
      const orderId = order._id.toString();
      if (alertedOrders.has(orderId)) continue;

      const minutesOverdue = Math.round((now - new Date(order.customerETA)) / 60000);
      const restaurant = order.restaurant;

      // Get restaurant owner email
      const restaurantDoc = await Restaurant.findById(restaurant._id).populate('owner', 'email');
      const ownerEmail = restaurantDoc?.owner?.email || restaurant?.email;

      if (ownerEmail) {
        await sendOverdueOrderAlert(ownerEmail, {
          order,
          restaurantName: restaurant.name,
          minutesOverdue,
        });
        alertedOrders.add(orderId);
        logger.info(`Overdue alert sent for order ${order.orderNumber} (${minutesOverdue} min overdue)`);
      }
    }
  } catch (error) {
    logger.error(`Cron checkOverdueOrders error: ${error.message}`);
  }
}

/**
 * Start all cron jobs
 */
function startCronJobs() {
  // Check every 5 minutes for overdue orders
  setInterval(checkOverdueOrders, 5 * 60 * 1000);

  // Run once on startup after 30s delay
  setTimeout(checkOverdueOrders, 30 * 1000);

  logger.info('⏰ Cron jobs started — overdue order check every 5 minutes');
}

module.exports = { startCronJobs, checkOverdueOrders };
