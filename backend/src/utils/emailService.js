const nodemailer = require('nodemailer');
const logger = require('./logger');

const generateEmailOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4, // force IPv4
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

const sendEmailOTP = async (email, otp, name = '') => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Rodofood" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify your email — Rodofood',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="color:#FF6B35;margin:0;">Rodo<span style="color:#1a1a2e">food</span></h2>
            <p style="color:#666;font-size:13px;margin-top:4px;">Highway Food Pre-Ordering</p>
          </div>
          <p style="color:#333;font-size:15px;">Hi ${name || 'there'},</p>
          <p style="color:#555;font-size:14px;line-height:1.6;">Use the OTP below to verify your email address. It is valid for <strong>10 minutes</strong>.</p>
          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:#FFF7ED;border:2px dashed #FF6B35;border-radius:12px;padding:16px 40px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#FF6B35;">${otp}</span>
            </div>
          </div>
          <p style="color:#999;font-size:12px;text-align:center;">Do not share this OTP with anyone. Rodofood will never ask for your OTP.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;">© 2026 Rodofood · India's First Highway Food Network</p>
        </div>
      `,
    });
    logger.info(`Email OTP sent to ${email} - OTP: ${otp}`);
    console.log(`[OTP] Sent to ${email}: ${otp}`);
    return { success: true };
  } catch (error) {
    logger.error(`Email OTP failed for ${email}: ${error.message}`);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

const EMAIL_OTP_EXPIRY_MINUTES = 10;

/**
 * Send order confirmation email with summary and payment details
 */
const sendOrderConfirmationEmail = async (email, { order, customerName }) => {
  try {
    const transporter = createTransporter();

    const paymentLabels = {
      cash: '💵 Cash at Restaurant',
      upi_at_restaurant: '📱 UPI at Restaurant',
      online: '💳 Online (Razorpay)',
    };

    const statusColors = {
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      preparing: '#8B5CF6',
      ready: '#10B981',
      completed: '#059669',
    };

    const itemRows = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;font-size:13px;text-align:center;">x${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:13px;text-align:right;font-weight:600;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const restaurantName =
      typeof order.restaurant === 'object' ? order.restaurant.name : 'Restaurant';

    const etaText = order.customerETA
      ? new Date(order.customerETA).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'N/A';

    await transporter.sendMail({
      from: `"Rodofood" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Order Confirmed #${order.orderNumber} — Rodofood`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee;">
          <!-- Header -->
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#FF6B35;margin:0;">Rodo<span style="color:#1a1a2e">food</span></h2>
            <p style="color:#666;font-size:12px;margin-top:4px;">Highway Food Pre-Ordering</p>
          </div>

          <!-- Status Badge -->
          <div style="text-align:center;margin-bottom:20px;">
            <span style="background:${statusColors[order.status] || '#6B7280'};color:#fff;padding:6px 18px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
              ✅ Order Placed Successfully
            </span>
          </div>

          <p style="color:#333;font-size:15px;margin-bottom:4px;">Hi ${customerName || 'there'},</p>
          <p style="color:#555;font-size:13px;line-height:1.6;margin-bottom:20px;">
            Your order has been placed at <strong>${restaurantName}</strong>. Here's your order summary:
          </p>

          <!-- Order Info -->
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#92400E;font-size:12px;font-weight:600;">Order Number</span>
              <span style="color:#1a1a2e;font-size:13px;font-weight:800;">#${order.orderNumber}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#92400E;font-size:12px;font-weight:600;">Order Type</span>
              <span style="color:#1a1a2e;font-size:13px;font-weight:700;">${order.orderType === 'dine-in' ? '🍽️ Dine-in' : '🥡 Takeaway'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#92400E;font-size:12px;font-weight:600;">Your ETA</span>
              <span style="color:#1a1a2e;font-size:13px;font-weight:700;">${etaText}</span>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr>
                <th style="text-align:left;font-size:11px;color:#9CA3AF;font-weight:600;padding-bottom:8px;border-bottom:2px solid #F3F4F6;text-transform:uppercase;">Item</th>
                <th style="text-align:center;font-size:11px;color:#9CA3AF;font-weight:600;padding-bottom:8px;border-bottom:2px solid #F3F4F6;text-transform:uppercase;">Qty</th>
                <th style="text-align:right;font-size:11px;color:#9CA3AF;font-weight:600;padding-bottom:8px;border-bottom:2px solid #F3F4F6;text-transform:uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <!-- Bill Summary -->
          <div style="background:#F9FAFB;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#6B7280;font-size:13px;">Item Total</span>
              <span style="color:#111827;font-size:13px;font-weight:600;">₹${order.subtotal.toFixed(2)}</span>
            </div>
            ${
              order.discount > 0
                ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#059669;font-size:13px;">Coupon Discount${order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span style="color:#059669;font-size:13px;font-weight:600;">− ₹${order.discount.toFixed(2)}</span>
            </div>`
                : ''
            }
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
              <span style="color:#6B7280;font-size:13px;">GST (${order.gstRate}%)</span>
              <span style="color:#111827;font-size:13px;font-weight:600;">₹${order.gstAmount.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;border-top:2px dashed #E5E7EB;padding-top:10px;">
              <span style="color:#111827;font-size:15px;font-weight:800;">Total Paid</span>
              <span style="color:#FF6B35;font-size:16px;font-weight:900;">₹${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Method -->
          <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">💳</span>
            <div>
              <p style="margin:0;font-size:11px;color:#1E40AF;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Payment Method</p>
              <p style="margin:4px 0 0;font-size:14px;color:#1E3A8A;font-weight:700;">${paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
              ${
                order.paymentStatus === 'paid'
                  ? `<p style="margin:2px 0 0;font-size:11px;color:#059669;font-weight:600;">✅ Payment Confirmed</p>`
                  : `<p style="margin:2px 0 0;font-size:11px;color:#D97706;font-weight:600;">⏳ Payment Pending</p>`
              }
            </div>
          </div>

          <p style="color:#999;font-size:12px;text-align:center;line-height:1.6;">
            Show this email or your order number at the restaurant.<br/>
            For support, reply to this email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;">© 2026 Rodofood · India's First Highway Food Network</p>
        </div>
      `,
    });

    logger.info(`Order confirmation email sent to ${email} for order ${order.orderNumber}`);
    return { success: true };
  } catch (error) {
    logger.error(`Order confirmation email failed for ${email}: ${error.message}`);
    // Don't throw — email failure shouldn't break order placement
    return { success: false };
  }
};

/**
 * Send new order notification to restaurant owner
 */
const sendNewOrderEmailToRestaurant = async (restaurantEmail, { order, restaurantName }) => {
  try {
    const transporter = createTransporter();
    const itemRows = order.items.map(item =>
      `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;">${item.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6B7280;font-size:13px;text-align:center;">x${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:13px;text-align:right;font-weight:600;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    const etaText = order.customerETA
      ? new Date(order.customerETA).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'N/A';

    await transporter.sendMail({
      from: `"Rodofood" <${process.env.GMAIL_USER}>`,
      to: restaurantEmail,
      subject: `🔔 New Order #${order.orderNumber} — ₹${order.totalAmount.toFixed(2)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee;">
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#FF6B35;margin:0;">Rodo<span style="color:#1a1a2e">food</span></h2>
          </div>
          <div style="background:#FFF7ED;border:2px solid #FF6B35;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:900;color:#FF6B35;">🔔 New Order Received!</p>
            <p style="margin:6px 0 0;font-size:13px;color:#92400E;">Order #${order.orderNumber} · ₹${order.totalAmount.toFixed(2)}</p>
          </div>
          <div style="background:#F9FAFB;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#6B7280;font-size:12px;font-weight:600;">Restaurant</span>
              <span style="color:#111827;font-size:13px;font-weight:700;">${restaurantName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#6B7280;font-size:12px;font-weight:600;">Order Type</span>
              <span style="color:#111827;font-size:13px;font-weight:700;">${order.orderType === 'dine-in' ? '🍽️ Dine-in' : '🥡 Takeaway'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#6B7280;font-size:12px;font-weight:600;">Customer ETA</span>
              <span style="color:#FF6B35;font-size:13px;font-weight:800;">${etaText}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#6B7280;font-size:12px;font-weight:600;">Payment</span>
              <span style="color:#111827;font-size:13px;font-weight:700;">${order.paymentMethod === 'cash' ? '💵 Cash' : order.paymentMethod === 'upi_at_restaurant' ? '📱 UPI' : '💳 Online (Paid)'}</span>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr>
                <th style="text-align:left;font-size:11px;color:#9CA3AF;padding-bottom:8px;border-bottom:2px solid #F3F4F6;">Item</th>
                <th style="text-align:center;font-size:11px;color:#9CA3AF;padding-bottom:8px;border-bottom:2px solid #F3F4F6;">Qty</th>
                <th style="text-align:right;font-size:11px;color:#9CA3AF;padding-bottom:8px;border-bottom:2px solid #F3F4F6;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="background:#FFF7ED;border-radius:10px;padding:12px 16px;text-align:center;">
            <p style="margin:0;font-size:15px;font-weight:900;color:#FF6B35;">Total: ₹${order.totalAmount.toFixed(2)}</p>
          </div>
          <p style="color:#bbb;font-size:11px;text-align:center;margin-top:20px;">© 2026 Rodofood · Login to your dashboard to manage this order</p>
        </div>
      `,
    });
    logger.info(`New order email sent to restaurant ${restaurantEmail} for order ${order.orderNumber}`);
    return { success: true };
  } catch (error) {
    logger.error(`Restaurant order email failed: ${error.message}`);
    return { success: false };
  }
};

/**
 * Send order status update email to customer
 */
const sendOrderStatusEmail = async (email, { order, customerName, status }) => {
  try {
    const transporter = createTransporter();
    const statusConfig = {
      confirmed: { emoji: '✅', title: 'Order Confirmed!', msg: 'Your order has been confirmed by the restaurant. They will start preparing it soon.', color: '#3B82F6' },
      preparing: { emoji: '👨‍🍳', title: 'Being Prepared!', msg: 'Your food is being prepared right now. Get ready to arrive!', color: '#8B5CF6' },
      ready:     { emoji: '🎉', title: 'Ready for Pickup!', msg: 'Your food is ready! Head to the restaurant now.', color: '#10B981' },
      completed: { emoji: '✅', title: 'Order Completed!', msg: 'Your order has been completed. We hope you enjoyed your meal!', color: '#059669' },
      cancelled: { emoji: '❌', title: 'Order Cancelled', msg: 'Your order has been cancelled.', color: '#EF4444' },
      rejected:  { emoji: '❌', title: 'Order Rejected', msg: `Your order was rejected by the restaurant. Reason: ${order.rejectionReason || 'Not specified'}.`, color: '#EF4444' },
    };
    const cfg = statusConfig[status] || { emoji: '📋', title: `Order ${status}`, msg: `Your order status has been updated to ${status}.`, color: '#6B7280' };
    const restaurantName = typeof order.restaurant === 'object' ? order.restaurant.name : 'Restaurant';

    await transporter.sendMail({
      from: `"Rodofood" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${cfg.emoji} Order #${order.orderNumber} — ${cfg.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee;">
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#FF6B35;margin:0;">Rodo<span style="color:#1a1a2e">food</span></h2>
          </div>
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:48px;margin-bottom:12px;">${cfg.emoji}</div>
            <h3 style="color:${cfg.color};margin:0;font-size:20px;">${cfg.title}</h3>
          </div>
          <p style="color:#333;font-size:15px;">Hi ${customerName || 'there'},</p>
          <p style="color:#555;font-size:14px;line-height:1.6;">${cfg.msg}</p>
          <div style="background:#F9FAFB;border-radius:10px;padding:14px 16px;margin:20px 0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#6B7280;font-size:12px;">Order Number</span>
              <span style="color:#111827;font-size:13px;font-weight:800;">#${order.orderNumber}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#6B7280;font-size:12px;">Restaurant</span>
              <span style="color:#111827;font-size:13px;font-weight:700;">${restaurantName}</span>
            </div>
          </div>
          ${status === 'ready' ? `<div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:20px;"><p style="margin:0;color:#065F46;font-weight:700;font-size:14px;">🏃 Head to the restaurant now — your food is waiting!</p></div>` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;">© 2026 Rodofood · India's First Highway Food Network</p>
        </div>
      `,
    });
    logger.info(`Status email (${status}) sent to ${email} for order ${order.orderNumber}`);
    return { success: true };
  } catch (error) {
    logger.error(`Status email failed for ${email}: ${error.message}`);
    return { success: false };
  }
};

/**
 * Send overdue order alert to restaurant
 */
const sendOverdueOrderAlert = async (restaurantEmail, { order, restaurantName, minutesOverdue }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Rodofood" <${process.env.GMAIL_USER}>`,
      to: restaurantEmail,
      subject: `⚠️ Order #${order.orderNumber} — Customer has arrived (${minutesOverdue} min overdue)`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:2px solid #F59E0B;">
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#FF6B35;margin:0;">Rodo<span style="color:#1a1a2e">food</span></h2>
          </div>
          <div style="background:#FFFBEB;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
            <p style="margin:0;font-size:32px;">⚠️</p>
            <p style="margin:8px 0 0;font-size:16px;font-weight:900;color:#92400E;">Order Overdue by ${minutesOverdue} minutes!</p>
            <p style="margin:4px 0 0;font-size:13px;color:#B45309;">Order #${order.orderNumber} · ₹${order.totalAmount.toFixed(2)}</p>
          </div>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            The customer's ETA was <strong>${new Date(order.customerETA).toLocaleString('en-IN', { timeStyle: 'short' })}</strong> but the order is still <strong>${order.status}</strong>.
          </p>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Please update the order status on your dashboard. If the order has been served, mark it as <strong>Completed</strong>.
          </p>
          <div style="background:#F9FAFB;border-radius:10px;padding:12px 16px;margin:16px 0;">
            <p style="margin:0;font-size:12px;color:#6B7280;">Restaurant: <strong>${restaurantName}</strong></p>
            <p style="margin:4px 0 0;font-size:12px;color:#6B7280;">Order Type: <strong>${order.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</strong></p>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;">© 2026 Rodofood · Login to your dashboard to update this order</p>
        </div>
      `,
    });
    logger.info(`Overdue alert sent to ${restaurantEmail} for order ${order.orderNumber}`);
    return { success: true };
  } catch (error) {
    logger.error(`Overdue alert failed: ${error.message}`);
    return { success: false };
  }
};

/**
 * Send refund initiated email to customer
 */
const sendRefundEmail = async (email, { order, customerName, refundAmount, refundId }) => {
  try {
    const transporter = createTransporter();
    const restaurantName = typeof order.restaurant === 'object' ? order.restaurant.name : 'Restaurant';
    await transporter.sendMail({
      from: `"Rodofood" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `💰 Refund Initiated — Order #${order.orderNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee;">
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#FF6B35;margin:0;">Rodo<span style="color:#1a1a2e">food</span></h2>
          </div>
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:48px;margin-bottom:12px;">💰</div>
            <h3 style="color:#059669;margin:0;font-size:20px;">Refund Initiated!</h3>
          </div>
          <p style="color:#333;font-size:15px;">Hi ${customerName || 'there'},</p>
          <p style="color:#555;font-size:14px;line-height:1.6;">
            Your order <strong>#${order.orderNumber}</strong> from <strong>${restaurantName}</strong> was cancelled.
            A refund of <strong style="color:#059669;">₹${refundAmount.toFixed(2)}</strong> has been initiated to your original payment method.
          </p>
          <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:10px;padding:14px 16px;margin:20px 0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#065F46;font-size:12px;font-weight:600;">Refund Amount</span>
              <span style="color:#059669;font-size:15px;font-weight:900;">₹${refundAmount.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#065F46;font-size:12px;font-weight:600;">Refund ID</span>
              <span style="color:#111827;font-size:12px;font-family:monospace;">${refundId}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#065F46;font-size:12px;font-weight:600;">Timeline</span>
              <span style="color:#111827;font-size:12px;font-weight:600;">3–5 business days</span>
            </div>
          </div>
          ${order.rejectionReason ? `<p style="color:#555;font-size:13px;background:#FFF7ED;border-radius:8px;padding:10px 14px;"><strong>Reason:</strong> ${order.rejectionReason}</p>` : ''}
          <p style="color:#999;font-size:12px;text-align:center;line-height:1.6;">
            Refunds typically appear within 3–5 business days depending on your bank.<br/>
            For queries, contact support@rodofood.in
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
          <p style="color:#bbb;font-size:11px;text-align:center;">© 2026 Rodofood · India's First Highway Food Network</p>
        </div>
      `,
    });
    logger.info(`Refund email sent to ${email} for order ${order.orderNumber}, refund ${refundId}`);
    return { success: true };
  } catch (error) {
    logger.error(`Refund email failed: ${error.message}`);
    return { success: false };
  }
};

module.exports = {
  generateEmailOTP,
  sendEmailOTP,
  EMAIL_OTP_EXPIRY_MINUTES,
  sendOrderConfirmationEmail,
  sendNewOrderEmailToRestaurant,
  sendOrderStatusEmail,
  sendOverdueOrderAlert,
  sendRefundEmail,
};
