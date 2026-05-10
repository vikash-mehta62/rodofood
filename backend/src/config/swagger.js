const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const fs = require('fs');

const doc = {
    info: {
        title: 'Rodofood API',
        version: '1.0.0',
        description: 'Auto-generated API documentation for the Rodofood food delivery platform',
        contact: { name: 'API Support' },
    },
    servers: [
        { url: 'http://localhost:5000', description: 'Development Server' },
        { url: 'https://your-production-url.com', description: 'Production Server' },
    ],

    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
            // ── Auth ──────────────────────────────────────────────────────────
            SendOtp: {
                type: 'object',
                required: ['phone'],
                properties: {
                    phone: { type: 'string', example: '9876543210' }
                }
            },
            VerifyOtp: {
                type: 'object',
                required: ['phone', 'otp'],
                properties: {
                    phone: { type: 'string', example: '9876543210' },
                    otp: { type: 'string', example: '123456' }
                }
            },
            AuthRegister: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password'],
                properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    phone: { type: 'string', example: '9876543210' },
                    password: { type: 'string', example: 'Strong@123' }
                }
            },
            AuthLogin: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'Strong@123' }
                }
            },
            UserUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string' },
                    address: { type: 'string' }
                }
            },
            ChangePassword: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                    currentPassword: { type: 'string', example: 'OldPass@1' },
                    newPassword: { type: 'string', example: 'NewPass@2' }
                }
            },

            // ── Restaurants ───────────────────────────────────────────────────
            RestaurantCreate: {
                type: 'object',
                required: ['name', 'cuisine', 'address', 'phone'],
                properties: {
                    name: { type: 'string', example: 'Spice Garden' },
                    cuisine: { type: 'array', items: { type: 'string' }, example: ['Indian', 'Chinese'] },
                    description: { type: 'string' },
                    phone: { type: 'string', example: '9876543210' },
                    email: { type: 'string', example: 'restaurant@example.com' },
                    address: {
                        type: 'object',
                        properties: {
                            street: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            pincode: { type: 'string' },
                            coordinates: {
                                type: 'object',
                                properties: {
                                    lat: { type: 'number' },
                                    lng: { type: 'number' }
                                }
                            }
                        }
                    },
                    openingHours: { type: 'object' },
                    isActive: { type: 'boolean', example: true }
                }
            },
            RestaurantUpdate: { $ref: '#/components/schemas/RestaurantCreate' },

            // ── Restaurant Auth ───────────────────────────────────────────────
            RestaurantAuthRegister: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password'],
                properties: {
                    name: { type: 'string', example: 'Spice Garden' },
                    email: { type: 'string', example: 'owner@spicegarden.com' },
                    phone: { type: 'string', example: '9876543210' },
                    password: { type: 'string', example: 'Strong@123' }
                }
            },
            RestaurantAuthLogin: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', example: 'owner@spicegarden.com' },
                    password: { type: 'string', example: 'Strong@123' }
                }
            },
            RestaurantAuthSendOtp: {
                type: 'object',
                required: ['phone'],
                properties: {
                    phone: { type: 'string', example: '9876543210' }
                }
            },
            RestaurantAuthVerifyOtp: {
                type: 'object',
                required: ['phone', 'otp'],
                properties: {
                    phone: { type: 'string', example: '9876543210' },
                    otp: { type: 'string', example: '123456' }
                }
            },
            RestaurantProfileUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    email: { type: 'string' },
                    description: { type: 'string' },
                    openingHours: { type: 'object' }
                }
            },

            // ── Menu ─────────────────────────────────────────────────────────
            MenuItemCreate: {
                type: 'object',
                required: ['name', 'price', 'category', 'restaurant'],
                properties: {
                    name: { type: 'string', example: 'Butter Chicken' },
                    description: { type: 'string' },
                    price: { type: 'number', example: 299 },
                    discountedPrice: { type: 'number', example: 249 },
                    category: { type: 'string', example: 'Main Course' },
                    restaurant: { type: 'string', example: '65f0c1...' },
                    isVeg: { type: 'boolean', example: false },
                    isAvailable: { type: 'boolean', example: true },
                    image: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } }
                }
            },
            MenuItemUpdate: { $ref: '#/components/schemas/MenuItemCreate' },

            // ── Orders ────────────────────────────────────────────────────────
            OrderCreate: {
                type: 'object',
                required: ['restaurant', 'items', 'deliveryAddress', 'paymentMethod'],
                properties: {
                    restaurant: { type: 'string', example: '65f0c1...' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                menuItem: { type: 'string', example: '65f0c2...' },
                                quantity: { type: 'number', example: 2 },
                                customizations: { type: 'object' }
                            }
                        }
                    },
                    deliveryAddress: {
                        type: 'object',
                        properties: {
                            street: { type: 'string' },
                            city: { type: 'string' },
                            pincode: { type: 'string' },
                            coordinates: {
                                type: 'object',
                                properties: {
                                    lat: { type: 'number' },
                                    lng: { type: 'number' }
                                }
                            }
                        }
                    },
                    paymentMethod: { type: 'string', enum: ['cod', 'online', 'wallet'], example: 'online' },
                    couponCode: { type: 'string', example: 'SAVE20' },
                    specialInstructions: { type: 'string' }
                }
            },
            OrderStatusUpdate: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: {
                        type: 'string',
                        enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
                    }
                }
            },

            // ── Routes (Delivery) ─────────────────────────────────────────────
            RouteCreate: {
                type: 'object',
                required: ['name', 'deliveryAgent', 'orders'],
                properties: {
                    name: { type: 'string', example: 'Route A - Downtown' },
                    deliveryAgent: { type: 'string', example: '65f0c3...' },
                    orders: { type: 'array', items: { type: 'string' }, example: ['65f0c4...'] },
                    estimatedDuration: { type: 'number', example: 45 }
                }
            },

            // ── Coupons ───────────────────────────────────────────────────────
            CouponCreate: {
                type: 'object',
                required: ['code', 'discountType', 'discountValue'],
                properties: {
                    code: { type: 'string', example: 'SAVE20' },
                    description: { type: 'string' },
                    discountType: { type: 'string', enum: ['percentage', 'fixed'], example: 'percentage' },
                    discountValue: { type: 'number', example: 20 },
                    minOrderValue: { type: 'number', example: 200 },
                    maxDiscount: { type: 'number', example: 100 },
                    expiryDate: { type: 'string', format: 'date', example: '2026-12-31' },
                    usageLimit: { type: 'number', example: 500 },
                    isActive: { type: 'boolean', example: true }
                }
            },
            CouponApply: {
                type: 'object',
                required: ['code', 'orderAmount'],
                properties: {
                    code: { type: 'string', example: 'SAVE20' },
                    orderAmount: { type: 'number', example: 500 }
                }
            },

            // ── Support ───────────────────────────────────────────────────────
            SupportTicketCreate: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                    subject: { type: 'string', example: 'Order not delivered' },
                    message: { type: 'string', example: 'My order #12345 was not delivered.' },
                    orderId: { type: 'string', example: '65f0c5...' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' }
                }
            },
            SupportTicketReply: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string', example: 'We are looking into this.' }
                }
            },

            // ── CMS ───────────────────────────────────────────────────────────
            CmsPageUpdate: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    isPublished: { type: 'boolean' }
                }
            },

            // ── Admin ─────────────────────────────────────────────────────────
            PlatformSettingsUpdate: {
                type: 'object',
                properties: {
                    deliveryFee: { type: 'number', example: 30 },
                    gstRate: { type: 'number', example: 5 },
                    platformFeeType: { type: 'string', enum: ['fixed', 'percentage'], example: 'percentage' },
                    platformFeeValue: { type: 'number', example: 5 },
                    minOrderValue: { type: 'number', example: 100 }
                }
            },

            // ── Admin Auth ────────────────────────────────────────────────────
            AdminAuthLogin: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', example: 'admin@rodofood.com' },
                    password: { type: 'string', example: 'AdminPass@1' }
                }
            },
            AdminAuthRegister: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: 'Super Admin' },
                    email: { type: 'string', example: 'admin@rodofood.com' },
                    password: { type: 'string', example: 'AdminPass@1' },
                    role: { type: 'string', enum: ['admin', 'superadmin'], example: 'admin' }
                }
            },
            AdminChangePassword: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                    currentPassword: { type: 'string', example: 'OldAdmin@1' },
                    newPassword: { type: 'string', example: 'NewAdmin@2' }
                }
            },

            // ── Customer Auth ─────────────────────────────────────────────────
            CustomerRegister: {
                type: 'object',
                required: ['name', 'phone'],
                properties: {
                    name: { type: 'string', example: 'Jane Doe' },
                    phone: { type: 'string', example: '9876543210' },
                    email: { type: 'string', example: 'jane@example.com' }
                }
            },
            CustomerLogin: {
                type: 'object',
                required: ['phone', 'otp'],
                properties: {
                    phone: { type: 'string', example: '9876543210' },
                    otp: { type: 'string', example: '123456' }
                }
            },
            CustomerSendOtp: {
                type: 'object',
                required: ['phone'],
                properties: {
                    phone: { type: 'string', example: '9876543210' }
                }
            },
            CustomerProfileUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    addresses: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string', example: 'Home' },
                                street: { type: 'string' },
                                city: { type: 'string' },
                                pincode: { type: 'string' },
                                coordinates: {
                                    type: 'object',
                                    properties: {
                                        lat: { type: 'number' },
                                        lng: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            // ── Notifications ─────────────────────────────────────────────────
            NotificationMarkRead: {
                type: 'object',
                required: ['notificationIds'],
                properties: {
                    notificationIds: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['65f0c6...', '65f0c7...']
                    }
                }
            },
        },
    },

    security: [{ bearerAuth: [] }],

    tags: [
        { name: 'Auth', description: 'Authentication & user management' },
        { name: 'Restaurants', description: 'Restaurant listing & management' },
        { name: 'Restaurant Auth', description: 'Restaurant owner authentication (legacy)' },
        { name: 'Restaurant Auth New', description: 'Restaurant owner authentication (new)' },
        { name: 'Menu', description: 'Menu item management' },
        { name: 'Orders', description: 'Order placement & tracking' },
        { name: 'Routes', description: 'Delivery route management' },
        { name: 'Coupons', description: 'Coupon & discount management' },
        { name: 'Support', description: 'Customer support tickets' },
        { name: 'CMS', description: 'Content management (pages, banners)' },
        { name: 'Admin', description: 'Admin panel operations' },
        { name: 'Admin Auth', description: 'Admin authentication' },
        { name: 'Customer', description: 'Customer authentication & profile' },
        { name: 'Notifications', description: 'In-app notifications' },
    ],
};

// ─── Prefix → Tag (longest first to avoid partial matches) ───────────────────
const TAG_MAP = [
    { prefix: '/api/v1/restaurant-auth', tag: 'Restaurant Auth' },
    { prefix: '/api/v1/restaurant', tag: 'Restaurant Auth New' },  // must come after restaurant-auth
    { prefix: '/api/v1/restaurants', tag: 'Restaurants' },
    { prefix: '/api/v1/notifications', tag: 'Notifications' },
    { prefix: '/api/v1/orders', tag: 'Orders' },
    { prefix: '/api/v1/routes', tag: 'Routes' },
    { prefix: '/api/v1/coupons', tag: 'Coupons' },
    { prefix: '/api/v1/support', tag: 'Support' },
    { prefix: '/api/v1/admin-auth', tag: 'Admin Auth' },
    { prefix: '/api/v1/admin', tag: 'Admin' },           // must come after admin-auth
    { prefix: '/api/v1/customer', tag: 'Customer' },
    { prefix: '/api/v1/menu', tag: 'Menu' },
    { prefix: '/api/v1/auth', tag: 'Auth' },
    { prefix: '/api/v1/cms', tag: 'CMS' },
];

function assignTagsFromPaths(outputFile) {
    const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

    for (const [routePath, methods] of Object.entries(spec.paths || {})) {
        const match = TAG_MAP.find(({ prefix }) => routePath.startsWith(prefix));
        if (!match) continue;

        for (const operation of Object.values(methods)) {
            if (typeof operation !== 'object' || Array.isArray(operation)) continue;
            operation.tags = [match.tag];
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
    console.log('🏷️   Tags auto-assigned from URL prefixes');
}

function augmentSpec(outputFile) {
    const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

    // Public endpoints (no auth required)
    const publicEndpoints = new Set([
        // User auth
        'post /api/v1/auth/send-otp',
        'post /api/v1/auth/verify-otp',
        'post /api/v1/auth/register',
        'post /api/v1/auth/login',
        // Customer auth
        'post /api/v1/customer/send-otp',
        'post /api/v1/customer/verify-otp',
        'post /api/v1/customer/register',
        'post /api/v1/customer/login',
        // Restaurant auth (both variants)
        'post /api/v1/restaurant-auth/register',
        'post /api/v1/restaurant-auth/login',
        'post /api/v1/restaurant-auth/send-otp',
        'post /api/v1/restaurant-auth/verify-otp',
        'post /api/v1/restaurant/register',
        'post /api/v1/restaurant/login',
        'post /api/v1/restaurant/send-otp',
        'post /api/v1/restaurant/verify-otp',
        // Admin auth
        'post /api/v1/admin-auth/login',
        // Public browsing
        'get /api/v1/restaurants',
        'get /api/v1/restaurants/{id}',
        'get /api/v1/menu',
        'get /api/v1/menu/{id}',
        'get /api/v1/cms',
        'get /api/v1/cms/{slug}',
        'get /health',
    ]);

    // Operation summaries and request bodies
    const opMap = {
        // ── Auth ──────────────────────────────────────────────────────────────
        'post /api/v1/auth/send-otp': { summary: 'Send OTP to phone', requestBody: { $ref: '#/components/schemas/SendOtp' } },
        'post /api/v1/auth/verify-otp': { summary: 'Verify OTP', requestBody: { $ref: '#/components/schemas/VerifyOtp' } },
        'post /api/v1/auth/register': { summary: 'Register new user', requestBody: { $ref: '#/components/schemas/AuthRegister' } },
        'post /api/v1/auth/login': { summary: 'Login user', requestBody: { $ref: '#/components/schemas/AuthLogin' } },
        'put /api/v1/auth/update-profile': { summary: 'Update user profile', requestBody: { $ref: '#/components/schemas/UserUpdate' } },
        'put /api/v1/auth/change-password': { summary: 'Change password', requestBody: { $ref: '#/components/schemas/ChangePassword' } },

        // ── Restaurant Auth (legacy) ───────────────────────────────────────────
        'post /api/v1/restaurant-auth/register': { summary: 'Register restaurant owner', requestBody: { $ref: '#/components/schemas/RestaurantAuthRegister' } },
        'post /api/v1/restaurant-auth/login': { summary: 'Login restaurant owner', requestBody: { $ref: '#/components/schemas/RestaurantAuthLogin' } },
        'post /api/v1/restaurant-auth/send-otp': { summary: 'Send OTP to restaurant phone', requestBody: { $ref: '#/components/schemas/RestaurantAuthSendOtp' } },
        'post /api/v1/restaurant-auth/verify-otp': { summary: 'Verify restaurant OTP', requestBody: { $ref: '#/components/schemas/RestaurantAuthVerifyOtp' } },
        'put /api/v1/restaurant-auth/profile': { summary: 'Update restaurant owner profile', requestBody: { $ref: '#/components/schemas/RestaurantProfileUpdate' } },
        'put /api/v1/restaurant-auth/change-password': { summary: 'Change restaurant owner password', requestBody: { $ref: '#/components/schemas/ChangePassword' } },

        // ── Restaurant Auth (new) ─────────────────────────────────────────────
        'post /api/v1/restaurant/register': { summary: 'Register restaurant owner (new)', requestBody: { $ref: '#/components/schemas/RestaurantAuthRegister' } },
        'post /api/v1/restaurant/login': { summary: 'Login restaurant owner (new)', requestBody: { $ref: '#/components/schemas/RestaurantAuthLogin' } },
        'post /api/v1/restaurant/send-otp': { summary: 'Send OTP (new)', requestBody: { $ref: '#/components/schemas/RestaurantAuthSendOtp' } },
        'post /api/v1/restaurant/verify-otp': { summary: 'Verify OTP (new)', requestBody: { $ref: '#/components/schemas/RestaurantAuthVerifyOtp' } },
        'put /api/v1/restaurant/profile': { summary: 'Update restaurant profile (new)', requestBody: { $ref: '#/components/schemas/RestaurantProfileUpdate' } },
        'put /api/v1/restaurant/change-password': { summary: 'Change restaurant password (new)', requestBody: { $ref: '#/components/schemas/ChangePassword' } },

        // ── Admin Auth ────────────────────────────────────────────────────────
        'post /api/v1/admin-auth/login': { summary: 'Admin login', requestBody: { $ref: '#/components/schemas/AdminAuthLogin' } },
        'post /api/v1/admin-auth/register': { summary: 'Register admin user', requestBody: { $ref: '#/components/schemas/AdminAuthRegister' } },
        'put /api/v1/admin-auth/change-password': { summary: 'Change admin password', requestBody: { $ref: '#/components/schemas/AdminChangePassword' } },

        // ── Customer Auth ─────────────────────────────────────────────────────
        'post /api/v1/customer/send-otp': { summary: 'Send OTP to customer phone', requestBody: { $ref: '#/components/schemas/CustomerSendOtp' } },
        'post /api/v1/customer/verify-otp': { summary: 'Verify customer OTP', requestBody: { $ref: '#/components/schemas/CustomerLogin' } },
        'post /api/v1/customer/register': { summary: 'Register customer', requestBody: { $ref: '#/components/schemas/CustomerRegister' } },
        'post /api/v1/customer/login': { summary: 'Customer login via OTP', requestBody: { $ref: '#/components/schemas/CustomerLogin' } },
        'put /api/v1/customer/profile': { summary: 'Update customer profile', requestBody: { $ref: '#/components/schemas/CustomerProfileUpdate' } },

        // ── Notifications ─────────────────────────────────────────────────────
        'get /api/v1/notifications': { summary: 'Get all notifications for current user' },
        'put /api/v1/notifications/mark-read': { summary: 'Mark notifications as read', requestBody: { $ref: '#/components/schemas/NotificationMarkRead' } },
        'delete /api/v1/notifications/{id}': { summary: 'Delete a notification' },

        // ── Restaurants ───────────────────────────────────────────────────────
        'post /api/v1/restaurants': { summary: 'Create restaurant', requestBody: { $ref: '#/components/schemas/RestaurantCreate' } },
        'put /api/v1/restaurants/{id}': { summary: 'Update restaurant', requestBody: { $ref: '#/components/schemas/RestaurantUpdate' } },

        // ── Menu ─────────────────────────────────────────────────────────────
        'post /api/v1/menu': { summary: 'Create menu item', requestBody: { $ref: '#/components/schemas/MenuItemCreate' } },
        'put /api/v1/menu/{id}': { summary: 'Update menu item', requestBody: { $ref: '#/components/schemas/MenuItemUpdate' } },

        // ── Orders ────────────────────────────────────────────────────────────
        'post /api/v1/orders': { summary: 'Place new order', requestBody: { $ref: '#/components/schemas/OrderCreate' } },
        'put /api/v1/orders/{id}/status': { summary: 'Update order status', requestBody: { $ref: '#/components/schemas/OrderStatusUpdate' } },

        // ── Routes ────────────────────────────────────────────────────────────
        'post /api/v1/routes': { summary: 'Create delivery route', requestBody: { $ref: '#/components/schemas/RouteCreate' } },

        // ── Coupons ───────────────────────────────────────────────────────────
        'post /api/v1/coupons': { summary: 'Create coupon', requestBody: { $ref: '#/components/schemas/CouponCreate' } },
        'post /api/v1/coupons/apply': { summary: 'Apply coupon to order', requestBody: { $ref: '#/components/schemas/CouponApply' } },

        // ── Support ───────────────────────────────────────────────────────────
        'post /api/v1/support': { summary: 'Create support ticket', requestBody: { $ref: '#/components/schemas/SupportTicketCreate' } },
        'post /api/v1/support/{id}/reply': { summary: 'Reply to support ticket', requestBody: { $ref: '#/components/schemas/SupportTicketReply' } },

        // ── CMS ───────────────────────────────────────────────────────────────
        'put /api/v1/cms/{id}': { summary: 'Update CMS page', requestBody: { $ref: '#/components/schemas/CmsPageUpdate' } },

        // ── Admin ─────────────────────────────────────────────────────────────
        'put /api/v1/admin/platform-settings': { summary: 'Update platform settings', requestBody: { $ref: '#/components/schemas/PlatformSettingsUpdate' } },
    };

    for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [method, operation] of Object.entries(methods)) {
            if (typeof operation !== 'object' || Array.isArray(operation)) continue;
            const key = `${method.toLowerCase()} ${path}`;

            // Remove security for public endpoints
            if (publicEndpoints.has(key)) {
                operation.security = [];
            }

            // Add summary & requestBody
            const conf = opMap[key];
            if (conf) {
                if (conf.summary) operation.summary = conf.summary;
                if (conf.requestBody) {
                    operation.requestBody = {
                        required: true,
                        content: {
                            'application/json': {
                                schema: conf.requestBody
                            }
                        }
                    };
                }
            }
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
    console.log('🧩  Spec augmented with summaries, request bodies and security rules');
}

// ─────────────────────────────────────────────────────────────────────────────

const outputFile = './src/swagger-output.json';
const routes = ['./src/server.js'];

swaggerAutogen(outputFile, routes, doc).then(() => {
    assignTagsFromPaths(outputFile);
    augmentSpec(outputFile);
    console.log('✅  swagger-output.json generated successfully');
}); 