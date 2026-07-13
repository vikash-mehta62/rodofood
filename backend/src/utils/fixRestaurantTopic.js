require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Fix all_restaurants topic subscription
 */
async function fixRestaurantTopic() {
  try {
    console.log('🔧 Fixing all_restaurants Topic Subscription\n');

    await connectDB();
    console.log('✅ Database connected\n');

    // Get the specific device
    const device = await Device.findOne({ deviceId: '0a4d39562439406e' });
    
    if (!device) {
      console.log('❌ Device not found!');
      process.exit(1);
    }

    console.log('📱 Device found:');
    console.log('   Device ID:', device.deviceId);
    console.log('   Token:', device.fcmToken.substring(0, 30) + '...');
    console.log('   Current topics:', device.topics);
    console.log('   VendorId:', device.vendorId);
    console.log('   UserId:', device.userId);
    console.log('');

    const token = device.fcmToken;

    // Forcefully subscribe to all_restaurants
    console.log('🔄 Force subscribing to "all_restaurants" topic...\n');
    
    try {
      await getMessaging().subscribeToTopic(token, 'all_restaurants');
      console.log('✅ Successfully subscribed to "all_restaurants"\n');
    } catch (error) {
      console.log('❌ Subscription failed:', error.message);
      console.log('Error code:', error.code);
      process.exit(1);
    }

    // Also ensure all_users is subscribed
    console.log('🔄 Ensuring "all_users" subscription...\n');
    try {
      await getMessaging().subscribeToTopic(token, 'all_users');
      console.log('✅ Successfully subscribed to "all_users"\n');
    } catch (error) {
      console.log('⚠️  all_users subscription failed:', error.message);
    }

    // Update database
    if (!device.topics.includes('all_restaurants')) {
      device.topics.push('all_restaurants');
    }
    if (!device.topics.includes('all_users')) {
      device.topics.push('all_users');
    }
    await device.save();

    console.log('✅ Database updated');
    console.log('   Final topics:', device.topics);
    console.log('');

    // Test both topics
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Testing Topics Now...\n');

    // Test 1: all_users
    console.log('TEST 1: all_users topic\n');
    const message1 = {
      topic: 'all_users',
      notification: {
        title: '✅ all_users Test',
        body: 'Testing all_users topic after fix',
      },
      data: {
        type: 'test',
        topic: 'all_users',
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'default'
        }
      }
    };

    const response1 = await getMessaging().send(message1);
    console.log('✅ all_users notification sent');
    console.log('   Message ID:', response1);
    console.log('   📱 Check device!\n');

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: all_restaurants
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: all_restaurants topic\n');
    
    const message2 = {
      topic: 'all_restaurants',
      notification: {
        title: '🏪 all_restaurants Test',
        body: 'Testing all_restaurants topic after fix',
      },
      data: {
        type: 'test',
        topic: 'all_restaurants',
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'default'
        }
      }
    };

    const response2 = await getMessaging().send(message2);
    console.log('✅ all_restaurants notification sent');
    console.log('   Message ID:', response2);
    console.log('   📱 Check device!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 RESULTS:\n');
    console.log('You should receive 2 notifications:');
    console.log('  1. ✅ all_users Test');
    console.log('  2. 🏪 all_restaurants Test\n');
    
    console.log('If you received BOTH:');
    console.log('  ✅ PROBLEM SOLVED! Both topics working now!\n');
    
    console.log('If you received ONLY #1 (all_users):');
    console.log('  ⚠️  all_restaurants still not working');
    console.log('  💡 Wait 5-10 minutes for Firebase to sync');
    console.log('  💡 Or try again: npm run fix:restaurant\n');
    
    console.log('If you received NONE:');
    console.log('  ❌ Mobile app issue (check FCM handlers)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

fixRestaurantTopic();
