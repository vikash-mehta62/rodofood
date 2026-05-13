require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Restaurant = require('../models/Restaurant');
  const Route = require('../models/Route');

  const routes = await Route.find({ isActive: true });
  console.log('\n📍 Routes in DB:');
  routes.forEach(r => console.log(`  - ${r.name} (${r._id}) | waypoints: ${r.waypoints.length}`));

  const total = await Restaurant.countDocuments();
  const active = await Restaurant.countDocuments({ isActive: true });
  const withRoutes = await Restaurant.countDocuments({ routes: { $exists: true, $ne: [] } });
  const portalEnabled = await Restaurant.countDocuments({ isActive: true, portalEnabled: true });

  console.log('\n🏪 Restaurant counts:');
  console.log('  Total:', total);
  console.log('  Active:', active);
  console.log('  With routes assigned:', withRoutes);
  console.log('  Active + portalEnabled:', portalEnabled);

  const all = await Restaurant.find({ isActive: true }).select('name routes routeWaypointOrder portalEnabled isOpen');
  console.log('\n📋 All active restaurants:');
  all.forEach(r => console.log(`  - ${r.name} | routes: ${r.routes?.length || 0} | waypointOrder: ${r.routeWaypointOrder} | portal: ${r.portalEnabled} | open: ${r.isOpen}`));

  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
