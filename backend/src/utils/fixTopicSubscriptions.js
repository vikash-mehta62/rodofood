require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Fix topic subscriptions for existing devices
 */
async function fixTopicSubscriptions() {
  try {
    console.log('🔧 Fixing Topic Subscriptions...\n');

    await connectDB();
    console.log('✅ Database connected\n');

    const devices = await Device.find();
    console.log(`📱 Found ${devices.length} device(s)\n`);

    if (devices.length === 0) {
      console.log('❌ No devices found');
      process.exit(0);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const device of devices) {
      console.log(`Processing: ${device.deviceId}`);
      console.log(`Current topics: ${device.topics.join(', ')}`);
      
      const tokensToSubscribe = [device.fcmToken];
      const neededSubscriptions = [];

      // Determine which topics device should be subscribed to
      if (device.userId) {
        // Logged-in customer
        if (!device.topics.includes('customers')) {
          neededSubscriptions.push('customers');
        }
        // Remove from guests if present
        if (device.topics.includes('guests')) {
          console.log('  → Unsubscribing from "guests" (user is logged in)');
          await getMessaging().unsubscribeFromTopic(tokensToSubscribe, 'guests');
          device.topics = device.topics.filter(t => t !== 'guests');
        }
      } else if (device.vendorId) {
        // Restaurant partner
        if (!device.topics.includes('all_restaurants')) {
          neededSubscriptions.push('all_restaurants');
        }
      } else {
        // Guest user
        if (!device.topics.includes('guests')) {
          neededSubscriptions.push('guests');
        }
      }

      // Subscribe to needed topics
      for (const topic of neededSubscriptions) {
        try {
          console.log(`  → Subscribing to "${topic}"`);
          await getMessaging().subscribeToTopic(tokensToSubscribe, topic);
          device.topics.push(topic);
          console.log(`  ✅ Subscribed to "${topic}"`);
        } catch (error) {
          console.log(`  ❌ Failed to subscribe to "${topic}": ${error.message}`);
        }
      }

      // Save updated topics
      await device.save();
      console.log(`  ✅ Updated topics: ${device.topics.join(', ')}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Topic subscriptions fixed!\n');

    // Show summary
    const updatedDevices = await Device.find();
    const topicCounts = {
      'all_users': updatedDevices.filter(d => d.topics.includes('all_users')).length,
      'customers': updatedDevices.filter(d => d.topics.includes('customers')).length,
      'all_restaurants': updatedDevices.filter(d => d.topics.includes('all_restaurants')).length,
      'guests': updatedDevices.filter(d => d.topics.includes('guests')).length,
    };

    console.log('📊 Updated Topic Subscriptions:');
    console.log(`  • all_users: ${topicCounts.all_users} devices`);
    console.log(`  • customers: ${topicCounts.customers} devices`);
    console.log(`  • all_restaurants: ${topicCounts.all_restaurants} devices`);
    console.log(`  • guests: ${topicCounts.guests} devices`);
    console.log('');

    console.log('✅ Done! Now notifications will reach the right devices.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

fixTopicSubscriptions();
