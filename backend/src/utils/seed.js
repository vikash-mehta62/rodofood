/**
 * Seed script - creates initial Bhopal-Indore route and sample data
 * Run: node src/utils/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('../models/Route');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const CmsContent = require('../models/CmsContent');

const BHOPAL_INDORE_WAYPOINTS = [
  { name: 'Bhopal', coordinates: { lat: 23.2599, lng: 77.4126 }, order: 0 },
  { name: 'Obaidullaganj', coordinates: { lat: 23.1167, lng: 77.5167 }, order: 1 },
  { name: 'Sehore', coordinates: { lat: 23.2, lng: 77.0833 }, order: 2 },
  { name: 'Ashta', coordinates: { lat: 23.0167, lng: 76.7167 }, order: 3 },
  { name: 'Dewas', coordinates: { lat: 22.9676, lng: 76.0534 }, order: 4 },
  { name: 'Indore', coordinates: { lat: 22.7196, lng: 75.8577 }, order: 5 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create route
  const route = await Route.findOneAndUpdate(
    { slug: 'bhopal-indore' },
    {
      name: 'Bhopal - Indore',
      slug: 'bhopal-indore',
      fromCity: 'Bhopal',
      toCity: 'Indore',
      totalDistanceKm: 195,
      waypoints: BHOPAL_INDORE_WAYPOINTS,
      isActive: true,
      path: {
        type: 'LineString',
        coordinates: BHOPAL_INDORE_WAYPOINTS.map((w) => [w.coordinates.lng, w.coordinates.lat]),
      },
    },
    { upsert: true, new: true }
  );
  console.log('Route created:', route.name);

  // Create admin user
  const admin = await User.findOneAndUpdate(
    { phone: '9999999999' },
    { phone: '9999999999', name: 'Admin', role: 'admin', isActive: true },
    { upsert: true, new: true }
  );
  console.log('Admin user:', admin.phone);

  // Create restaurant owner
  const owner = await User.findOneAndUpdate(
    { phone: '8888888888' },
    { phone: '8888888888', name: 'Sehore Dhaba Owner', role: 'restaurant', isActive: true },
    { upsert: true, new: true }
  );

  // Create sample restaurant
  const restaurant = await Restaurant.findOneAndUpdate(
    { phone: '9876543210' },
    {
      owner: owner._id,
      name: 'Sehore Highway Dhaba',
      description: 'Authentic Madhya Pradesh cuisine on the Bhopal-Indore highway',
      phone: '9876543210',
      address: { city: 'Sehore', state: 'Madhya Pradesh', pincode: '466001' },
      location: { type: 'Point', coordinates: [77.0833, 23.2] },
      routes: [route._id],
      routeWaypointOrder: 2,
      foodType: 'both',
      cuisines: ['North Indian', 'Dhaba'],
      rating: 4.2,
      totalRatings: 156,
      isOpen: true,
      isActive: true,
      isVerified: true,
      gstRate: 5,
      avgPrepTimeMinutes: 20,
    },
    { upsert: true, new: true }
  );
  console.log('Restaurant created:', restaurant.name);

  // Create menu items
  const menuItems = [
    { name: 'Dal Makhani', category: 'Main Course', price: 180, foodType: 'veg', isPopular: true },
    { name: 'Butter Chicken', category: 'Main Course', price: 280, foodType: 'non-veg', isPopular: true },
    { name: 'Tandoori Roti', category: 'Breads', price: 20, foodType: 'veg' },
    { name: 'Butter Naan', category: 'Breads', price: 40, foodType: 'veg' },
    { name: 'Paneer Tikka', category: 'Starters', price: 220, foodType: 'veg', isPopular: true },
    { name: 'Chicken Tikka', category: 'Starters', price: 260, foodType: 'non-veg' },
    { name: 'Lassi', category: 'Beverages', price: 60, foodType: 'veg' },
    { name: 'Chai', category: 'Beverages', price: 20, foodType: 'veg' },
  ];

  for (const item of menuItems) {
    await MenuItem.findOneAndUpdate(
      { restaurant: restaurant._id, name: item.name },
      { ...item, restaurant: restaurant._id, isAvailable: true },
      { upsert: true }
    );
  }
  console.log('Menu items created');

  // Seed CMS content
  const cmsItems = [
    { key: 'hero_title', section: 'hero', type: 'text', value: 'Order Food Before You Arrive', label: 'Hero Title' },
    { key: 'hero_subtitle', section: 'hero', type: 'text', value: 'Pre-order from highway restaurants. Food ready when you reach. No waiting, just eating.', label: 'Hero Subtitle' },
    { key: 'hero_cta', section: 'hero', type: 'text', value: 'Start Ordering', label: 'Hero CTA' },
    { key: 'contact_phone', section: 'contact', type: 'text', value: '+91 99999 99999', label: 'Contact Phone' },
    { key: 'contact_email', section: 'contact', type: 'text', value: 'support@rodofood.in', label: 'Contact Email' },
    { key: 'whatsapp_number', section: 'contact', type: 'text', value: '919999999999', label: 'WhatsApp Number' },
  ];

  for (const item of cmsItems) {
    await CmsContent.findOneAndUpdate({ key: item.key }, item, { upsert: true });
  }
  console.log('CMS content seeded');

  console.log('\n✅ Seed complete!');
  console.log('Admin login: phone 9999999999 (any OTP in dev mode)');
  console.log('Restaurant login: phone 8888888888');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
