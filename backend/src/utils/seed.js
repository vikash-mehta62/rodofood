/**
 * Seed script - Bhopal-Indore route with 6 real restaurants
 * Run: node src/utils/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('../models/Route');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const CmsContent = require('../models/CmsContent');

const WAYPOINTS = [
  { name: 'Bhopal',         coordinates: { lat: 23.2599, lng: 77.4126 }, order: 0 },
  { name: 'Obaidullaganj',  coordinates: { lat: 23.1167, lng: 77.5167 }, order: 1 },
  { name: 'Sehore',         coordinates: { lat: 23.2000, lng: 77.0833 }, order: 2 },
  { name: 'Ashta',          coordinates: { lat: 23.0167, lng: 76.7167 }, order: 3 },
  { name: 'Dewas',          coordinates: { lat: 22.9676, lng: 76.0534 }, order: 4 },
  { name: 'Indore',         coordinates: { lat: 22.7196, lng: 75.8577 }, order: 5 },
];

// Real Unsplash food images (free to use)
const RESTAURANT_DATA = [
  {
    phone: '9800000001',
    ownerPhone: '8800000001',
    ownerName: 'Ramesh Sharma',
    name: 'Sehore Highway Treat',
    description: 'Famous for authentic Dal Baati Churma and Poha-Jalebi. A beloved highway stop since 1998. Fresh ingredients, home-style cooking, and generous portions make every meal memorable.',
    address: { street: 'NH-46, Near Sehore Toll', city: 'Sehore', state: 'Madhya Pradesh', pincode: '466001' },
    location: { type: 'Point', coordinates: [77.0833, 23.2000] },
    waypointOrder: 2,
    foodType: 'veg',
    cuisines: ['North Indian', 'Rajasthani', 'Street Food'],
    rating: 4.8, totalRatings: 1240,
    avgPrepTimeMinutes: 15,
    coverImage: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    ],
    menu: [
      { name: 'Dal Baati Churma', category: 'Thali', price: 149, discountedPrice: 129, foodType: 'veg', isPopular: true, preparationTime: 15, tags: ['Bestseller','Must Try'], description: 'Traditional Rajasthani dal baati with churma. Served with ghee and pickle.', image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80' },
      { name: 'Poha + Jalebi Combo', category: 'Breakfast', price: 79, discountedPrice: 59, foodType: 'veg', isPopular: true, preparationTime: 10, tags: ['Bestseller'], description: 'Fluffy poha with crispy hot jalebi — the classic MP breakfast combo.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
      { name: 'Full Thali', category: 'Thali', price: 199, foodType: 'veg', isPopular: true, preparationTime: 20, tags: ['Value Pick'], description: 'Complete meal with dal, sabzi, roti, rice, salad and dessert.' },
      { name: 'Kachori Sabzi', category: 'Snacks', price: 89, foodType: 'veg', preparationTime: 10, tags: ['Chef Special'], description: 'Crispy kachoris served with spicy potato sabzi and chutney.' },
      { name: 'Lassi (500ml)', category: 'Beverages', price: 59, foodType: 'veg', isPopular: true, preparationTime: 5, tags: ['Refreshing'], description: 'Thick creamy lassi made from fresh curd. Sweet or salted.' },
      { name: 'Masala Chai', category: 'Beverages', price: 25, foodType: 'veg', preparationTime: 5, description: 'Freshly brewed masala chai with ginger and cardamom.' },
    ],
  },
  {
    phone: '9800000002',
    ownerPhone: '8800000002',
    ownerName: 'Suresh Patel',
    name: 'Midway Delite Ashta',
    description: 'A modern highway restaurant offering both veg and non-veg options. Known for juicy kebabs, fresh rotis, and the best biryani on the Bhopal-Indore stretch. AC seating available.',
    address: { street: 'NH-46, Ashta Bypass', city: 'Ashta', state: 'Madhya Pradesh', pincode: '466116' },
    location: { type: 'Point', coordinates: [76.7167, 23.0167] },
    waypointOrder: 3,
    foodType: 'both',
    cuisines: ['North Indian', 'Mughlai', 'Biryani'],
    rating: 4.6, totalRatings: 890,
    avgPrepTimeMinutes: 20,
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'],
    menu: [
      { name: 'Chicken Biryani', category: 'Rice & Biryani', price: 249, discountedPrice: 199, foodType: 'non-veg', isPopular: true, preparationTime: 25, tags: ['Bestseller','Spicy'], description: 'Aromatic basmati rice cooked with tender chicken and whole spices. Served with raita.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
      { name: 'Veg Biryani', category: 'Rice & Biryani', price: 179, foodType: 'veg', isPopular: true, preparationTime: 20, tags: ['Must Try'], description: 'Fragrant biryani with seasonal vegetables and saffron.' },
      { name: 'Chicken Tikka', category: 'Starters', price: 280, foodType: 'non-veg', isPopular: true, preparationTime: 20, tags: ['Chef Special'], description: 'Tender chicken marinated in yogurt and spices, grilled in tandoor.' },
      { name: 'Paneer Tikka', category: 'Starters', price: 220, foodType: 'veg', preparationTime: 15, description: 'Soft paneer cubes marinated and grilled with peppers and onions.' },
      { name: 'Butter Naan', category: 'Breads', price: 40, foodType: 'veg', preparationTime: 8, description: 'Soft leavened bread baked in tandoor, brushed with butter.' },
      { name: 'Cold Coffee', category: 'Beverages', price: 89, foodType: 'veg', preparationTime: 5, description: 'Chilled blended coffee with ice cream.' },
    ],
  },
  {
    phone: '9800000003',
    ownerPhone: '8800000003',
    ownerName: 'Priya Verma',
    name: 'Dewas Dhaba & Sweets',
    description: 'Family-run dhaba famous for its Malwa-style cuisine. Try our signature Bhutte ka Kees and Sabudana Khichdi. Pure vegetarian kitchen with traditional recipes passed down for generations.',
    address: { street: 'NH-46, Dewas Naka', city: 'Dewas', state: 'Madhya Pradesh', pincode: '455001' },
    location: { type: 'Point', coordinates: [76.0534, 22.9676] },
    waypointOrder: 4,
    foodType: 'veg',
    cuisines: ['Malwa Cuisine', 'Sweets', 'Street Food'],
    rating: 4.7, totalRatings: 654,
    avgPrepTimeMinutes: 12,
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
    menu: [
      { name: 'Bhutte ka Kees', category: 'Snacks', price: 79, foodType: 'veg', isPopular: true, preparationTime: 10, tags: ['Bestseller','Local Special'], description: 'Grated corn cooked with milk and spices — a Malwa specialty you cannot miss.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
      { name: 'Sabudana Khichdi', category: 'Breakfast', price: 89, foodType: 'veg', isPopular: true, preparationTime: 10, tags: ['Healthy'], description: 'Light and fluffy sabudana with peanuts, green chilli and lemon.' },
      { name: 'Gulab Jamun (4 pcs)', category: 'Desserts', price: 69, foodType: 'veg', isPopular: true, preparationTime: 5, tags: ['Must Try'], description: 'Soft melt-in-mouth gulab jamuns soaked in rose-flavoured sugar syrup.' },
      { name: 'Malpua with Rabdi', category: 'Desserts', price: 99, foodType: 'veg', preparationTime: 10, tags: ['Chef Special'], description: 'Crispy sweet pancakes served with thick creamy rabdi.' },
      { name: 'Masala Buttermilk', category: 'Beverages', price: 39, foodType: 'veg', preparationTime: 3, description: 'Chilled spiced buttermilk with cumin and mint.' },
      { name: 'Samosa (2 pcs)', category: 'Snacks', price: 30, foodType: 'veg', preparationTime: 5, description: 'Crispy fried samosas with spiced potato filling.' },
    ],
  },
  {
    phone: '9800000004',
    ownerPhone: '8800000004',
    ownerName: 'Anil Kushwaha',
    name: 'Obaidullaganj Quick Bites',
    description: 'Perfect first stop from Bhopal! Quick service, fresh snacks, and hot chai. Ideal for a short break. Samosa, kachori, and poha always fresh and ready.',
    address: { street: 'NH-46, Main Chowk', city: 'Obaidullaganj', state: 'Madhya Pradesh', pincode: '464993' },
    location: { type: 'Point', coordinates: [77.5167, 23.1167] },
    waypointOrder: 1,
    foodType: 'veg',
    cuisines: ['Street Food', 'Snacks', 'Beverages'],
    rating: 4.4, totalRatings: 432,
    avgPrepTimeMinutes: 8,
    coverImage: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'],
    menu: [
      { name: 'Samosa + Chai', category: 'Combo', price: 39, discountedPrice: 29, foodType: 'veg', isPopular: true, preparationTime: 5, tags: ['Bestseller','Quick Bite'], description: 'Two crispy samosas with a hot cup of masala chai. The perfect highway snack.' },
      { name: 'Poha', category: 'Breakfast', price: 49, foodType: 'veg', isPopular: true, preparationTime: 8, tags: ['Fresh'], description: 'Light flattened rice with mustard seeds, curry leaves and sev.' },
      { name: 'Kachori (2 pcs)', category: 'Snacks', price: 40, foodType: 'veg', preparationTime: 5, description: 'Flaky deep-fried kachoris with moong dal filling.' },
      { name: 'Masala Chai', category: 'Beverages', price: 20, foodType: 'veg', preparationTime: 3, description: 'Hot masala chai with ginger and cardamom.' },
      { name: 'Cold Drink', category: 'Beverages', price: 30, foodType: 'veg', preparationTime: 2, description: 'Chilled soft drinks — Pepsi, Sprite, Limca.' },
    ],
  },
  {
    phone: '9800000005',
    ownerPhone: '8800000005',
    ownerName: 'Vikram Singh',
    name: 'Highway Grill & Bar-B-Q',
    description: 'The go-to spot for non-veg lovers on the highway. Specializing in tandoor grills, kebabs, and curries. Open late nights for truck drivers and night travellers.',
    address: { street: 'NH-46, Bypass Road', city: 'Sehore', state: 'Madhya Pradesh', pincode: '466001' },
    location: { type: 'Point', coordinates: [77.0900, 23.1950] },
    waypointOrder: 2,
    foodType: 'non-veg',
    cuisines: ['Grills', 'Mughlai', 'North Indian'],
    rating: 4.5, totalRatings: 567,
    avgPrepTimeMinutes: 25,
    coverImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'],
    menu: [
      { name: 'Mixed Grill Platter', category: 'Starters', price: 449, discountedPrice: 399, foodType: 'non-veg', isPopular: true, preparationTime: 25, tags: ['Bestseller','Chef Special'], description: 'Assorted platter of chicken tikka, seekh kebab, and tandoori chicken. Serves 2.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80' },
      { name: 'Seekh Kebab (6 pcs)', category: 'Starters', price: 249, foodType: 'non-veg', isPopular: true, preparationTime: 20, tags: ['Spicy'], description: 'Minced chicken kebabs with herbs and spices, grilled on skewers.' },
      { name: 'Mutton Curry', category: 'Main Course', price: 349, foodType: 'non-veg', isPopular: true, preparationTime: 30, tags: ['Must Try'], description: 'Slow-cooked mutton in rich onion-tomato gravy with whole spices.' },
      { name: 'Butter Chicken', category: 'Main Course', price: 299, foodType: 'non-veg', preparationTime: 20, description: 'Tender chicken in creamy tomato-butter sauce.' },
      { name: 'Tandoori Roti', category: 'Breads', price: 20, foodType: 'veg', preparationTime: 8, description: 'Whole wheat roti baked in tandoor.' },
      { name: 'Raita', category: 'Sides', price: 49, foodType: 'veg', preparationTime: 3, description: 'Chilled yogurt with cucumber and spices.' },
    ],
  },
  {
    phone: '9800000006',
    ownerPhone: '8800000006',
    ownerName: 'Meena Joshi',
    name: 'Indore Sarafa Sweets',
    description: 'Bringing the famous Sarafa Bazaar flavours to the highway! Authentic Indori street food — Poha, Jalebi, Shikanji, and more. The last stop before Indore or the first taste of the city.',
    address: { street: 'NH-46, Indore Entry', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' },
    location: { type: 'Point', coordinates: [75.8700, 22.7300] },
    waypointOrder: 5,
    foodType: 'veg',
    cuisines: ['Indori Street Food', 'Sweets', 'Chaat'],
    rating: 4.9, totalRatings: 2100,
    avgPrepTimeMinutes: 10,
    coverImage: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80'],
    menu: [
      { name: 'Indori Poha', category: 'Breakfast', price: 59, foodType: 'veg', isPopular: true, preparationTime: 8, tags: ['Bestseller','Authentic'], description: 'The original Indori poha with sev, fennel seeds, and lemon. Served with jalebi.', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80' },
      { name: 'Jalebi (250g)', category: 'Sweets', price: 79, foodType: 'veg', isPopular: true, preparationTime: 5, tags: ['Fresh','Must Try'], description: 'Crispy hot jalebis made fresh every hour. Dipped in sugar syrup.' },
      { name: 'Shikanji', category: 'Beverages', price: 49, foodType: 'veg', isPopular: true, preparationTime: 3, tags: ['Refreshing'], description: 'Indore-style lemonade with black salt, cumin and mint.' },
      { name: 'Garadu Chaat', category: 'Chaat', price: 69, foodType: 'veg', preparationTime: 8, tags: ['Local Special'], description: 'Deep-fried yam with spices — a winter Indore specialty.' },
      { name: 'Namkeen Sev (200g)', category: 'Snacks', price: 49, foodType: 'veg', preparationTime: 2, description: 'Crispy Indori sev — the perfect travel snack.' },
      { name: 'Mawa Bati', category: 'Sweets', price: 89, foodType: 'veg', preparationTime: 5, tags: ['Chef Special'], description: 'Rich mawa-filled sweet balls — a traditional Indore delicacy.' },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Route ──
  const route = await Route.findOneAndUpdate(
    { slug: 'bhopal-indore' },
    {
      name: 'Bhopal - Indore Highway',
      slug: 'bhopal-indore',
      fromCity: 'Bhopal',
      toCity: 'Indore',
      totalDistanceKm: 195,
      waypoints: WAYPOINTS,
      isActive: true,
      path: { type: 'LineString', coordinates: WAYPOINTS.map(w => [w.coordinates.lng, w.coordinates.lat]) },
    },
    { upsert: true, new: true }
  );
  console.log('✅ Route:', route.name);

  // ── Admin ──
  await User.findOneAndUpdate(
    { phone: '9999999999' },
    { phone: '9999999999', name: 'Admin User', role: 'admin', isActive: true },
    { upsert: true, new: true }
  );
  console.log('✅ Admin: 9999999999');

  // ── Customer ──
  await User.findOneAndUpdate(
    { phone: '9876543210' },
    { phone: '9876543210', name: 'Test Customer', role: 'customer', isActive: true },
    { upsert: true, new: true }
  );
  console.log('✅ Customer: 9876543210');

  // ── Restaurants + Menus ──
  for (const data of RESTAURANT_DATA) {
    const owner = await User.findOneAndUpdate(
      { phone: data.ownerPhone },
      { phone: data.ownerPhone, name: data.ownerName, role: 'restaurant', isActive: true },
      { upsert: true, new: true }
    );

    const restaurant = await Restaurant.findOneAndUpdate(
      { phone: data.phone },
      {
        owner: owner._id,
        name: data.name,
        description: data.description,
        phone: data.phone,
        address: data.address,
        location: data.location,
        routes: [route._id],
        routeWaypointOrder: data.waypointOrder,
        foodType: data.foodType,
        cuisines: data.cuisines,
        rating: data.rating,
        totalRatings: data.totalRatings,
        isOpen: true,
        isActive: true,
        isVerified: true,
        gstRate: 5,
        avgPrepTimeMinutes: data.avgPrepTimeMinutes,
        coverImage: data.coverImage,
        images: data.images,
      },
      { upsert: true, new: true }
    );

    // Menu items
    for (const item of data.menu) {
      await MenuItem.findOneAndUpdate(
        { restaurant: restaurant._id, name: item.name },
        { ...item, restaurant: restaurant._id, isAvailable: true },
        { upsert: true }
      );
    }
    console.log(`✅ Restaurant: ${data.name} (${data.menu.length} items)`);
  }

  // ── CMS ──
  const cmsItems = [
    { key: 'hero_title', section: 'hero', type: 'text', value: 'Order Food Before You Arrive', label: 'Hero Title' },
    { key: 'hero_subtitle', section: 'hero', type: 'text', value: 'Pre-order from highway restaurants. Food ready when you reach.', label: 'Hero Subtitle' },
    { key: 'contact_phone', section: 'contact', type: 'text', value: '+91 99999 99999', label: 'Contact Phone' },
    { key: 'contact_email', section: 'contact', type: 'text', value: 'support@rodofood.in', label: 'Contact Email' },
  ];
  for (const item of cmsItems) {
    await CmsContent.findOneAndUpdate({ key: item.key }, item, { upsert: true });
  }
  console.log('✅ CMS content seeded');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────');
  console.log('Admin:      9999999999');
  console.log('Restaurant: 8800000001 to 8800000006');
  console.log('Customer:   9876543210');
  console.log('─────────────────────────────');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
