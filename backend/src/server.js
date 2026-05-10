require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const routeRoutes = require('./routes/route.routes');
const couponRoutes = require('./routes/coupon.routes');
const supportRoutes = require('./routes/support.routes');
const cmsRoutes = require('./routes/cms.routes');
const adminRoutes = require('./routes/admin.routes');
const restaurantAuthRoutes = require('./routes/restaurantAuth.routes');
const notificationRoutes = require('./routes/notification.routes');
const customerAuthRoutes = require('./routes/customerAuth.routes');
const restaurantAuthNewRoutes = require('./routes/restaurantAuthNew.routes');
const adminAuthRoutes = require('./routes/adminAuth.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Join room based on role
  socket.on('join_restaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    logger.info(`Socket ${socket.id} joined restaurant_${restaurantId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// Trust proxy — required for Render/Heroku/Railway deployments
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ['https://rodofood.vercel.app', 'https://www.rodofood.com','https://rodofood.com','http://localhost:3000'], credentials: true }));

// Global rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter limiter for OTP
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests.' },
});
app.use('/api/v1/auth/send-otp', otpLimiter);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/restaurants`, restaurantRoutes);
app.use(`${API}/menu`, menuRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/routes`, routeRoutes);
app.use(`${API}/coupons`, couponRoutes);
app.use(`${API}/support`, supportRoutes);
app.use(`${API}/cms`, cmsRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/restaurant-auth`, restaurantAuthRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/customer`, customerAuthRoutes);
app.use(`${API}/restaurant`, restaurantAuthNewRoutes);
app.use(`${API}/admin-auth`, adminAuthRoutes);
app.use(`${API}/payments`, paymentRoutes);

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  try {
    const swaggerOutput = require('./swagger-output.json');
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerOutput, {
        explorer: true,
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
        customSiteTitle: 'Rodo API Docs',
      })
    );
    console.log(`Swagger UI  → http://localhost:${process.env.PORT || 5000}/api-docs`);
  } catch (_) {
    console.warn('swagger-output.json not found, skipping Swagger UI. Run `npm run swagger` to generate.');
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`🚀 Rodofood API running on port ${PORT}`);
    logger.info(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
};

start();

module.exports = { app, server };
