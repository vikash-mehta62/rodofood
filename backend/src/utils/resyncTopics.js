require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Re-sync all topic subscriptions with Firebase
 */
async function resyncTopics() {
  try {
    console.log('🔄 Re-syncing Topic Subscriptions with Firebase...\n');

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
      console.log(`Platform: ${device.platform}`);
      console.log(`Token: ${device.fcmToken.substring(0, 30)}...`);
      console.log(`Current topics in DB: ${device.topics.join(', ')}\n`);

      const token = device.fcmToken;
      let successCount = 0;
      let failCount = 0;

      // Re-subscribe to ALL topics in database
      for (const topic of device.topics) {
        try {
          console.log(`  🔄 Subscribing to "${topic}"...`);
          await getMessaging().subscribeToTopic(token, topic);
          console.log(`  ✅ Successfully subscribed to "${topic}"`);
          successCount++;
        } catch (error) {
          console.log(`  ❌ Failed to subscribe to "${topic}": ${error.message}`);
          failCount++;
          
          if (error.code === 'messaging/invalid-registration-token') {
            console.log(`  ⚠️  Token is invalid! Device needs to re-register.`);
          }
        }
      }

      console.log(`\n  📊 Summary for ${device.deviceId}:`);
      console.log(`     ✅ Success: ${successCount}`);
      console.log(`     ❌ Failed: ${failCount}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log('🎉 Topic re-sync completed!\n');

    // Test each topic
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 Testing Topics...\n');

    const topicsToTest = ['all_users', 'customers'];

    for (const topic of topicsToTest) {
      try {
        console.log(`📢 Testing topic: "${topic}"`);
        
        const message = {
          topic: topic,
          notification: {
            title: `🧪 ${topic} Test`,
            body: `Testing ${topic} topic after re-sync`,
          },
          data: {
            type: 'resync_test',
            topic: topic,
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

        const response = await getMessaging().send(message);
        console.log(`✅ Test sent to "${topic}"`);
        console.log(`   Message ID: ${response}`);
        console.log(`   📱 Check your device!\n`);
        
        // Wait 2 seconds between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ Failed to test "${topic}": ${error.message}\n`);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Results:\n');
    console.log('If you received BOTH test notifications:');
    console.log('  ✅ All topics working perfectly!\n');
    console.log('If you only received "customers" notification:');
    console.log('  ❌ "all_users" topic still has issues');
    console.log('  💡 This is a Firebase propagation delay (wait 5-10 minutes)\n');
    console.log('If you received NO notifications:');
    console.log('  ❌ Token may be invalid');
    console.log('  🔧 Run: npm run cleanup:devices\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Re-sync failed:', error);
    process.exit(1);
  }
}

resyncTopics();
