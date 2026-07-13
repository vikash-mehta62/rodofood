require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Test FCM Push Notifications
 * Usage: node src/utils/testFCM.js
 */
async function testFCM() {
  try {
    console.log('🔥 Starting FCM Test...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');

    // Get all devices
    const devices = await Device.find().limit(10);
    console.log(`📱 Found ${devices.length} registered devices\n`);

    if (devices.length === 0) {
      console.log('❌ No devices registered. Register a device first using /api/v1/fcm/register endpoint');
      process.exit(0);
    }

    // Show device list
    devices.forEach((device, index) => {
      console.log(`${index + 1}. Device ID: ${device.deviceId}`);
      console.log(`   Token: ${device.fcmToken.substring(0, 30)}...`);
      console.log(`   Platform: ${device.platform}`);
      console.log(`   Topics: ${device.topics.join(', ') || 'None'}`);
      console.log(`   User: ${device.userId || 'Guest'}\n`);
    });

    // Test 1: Send to first device
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Sending to specific device token\n');

    const testDevice = devices[0];
    const message1 = {
      token: testDevice.fcmToken,
      notification: {
        title: '🍕 Test Notification',
        body: 'This is a test notification from RodoFood!',
      },
      data: {
        type: 'test',
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            'content-available': 1
          }
        }
      }
    };

    console.log('📤 Sending message:', JSON.stringify(message1, null, 2));
    const response1 = await getMessaging().send(message1);
    console.log('✅ Success! Message ID:', response1);
    console.log('');

    // Test 2: Send to topic (if devices have topics)
    const deviceWithTopic = devices.find(d => d.topics && d.topics.length > 0);
    if (deviceWithTopic) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('TEST 2: Sending to topic\n');

      const testTopic = deviceWithTopic.topics[0];
      const message2 = {
        topic: testTopic,
        notification: {
          title: '📢 Topic Notification',
          body: `Test notification to ${testTopic} topic!`,
        },
        data: {
          type: 'topic_test',
          topic: testTopic,
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

      console.log('📤 Sending to topic:', testTopic);
      console.log('Message:', JSON.stringify(message2, null, 2));
      const response2 = await getMessaging().send(message2);
      console.log('✅ Success! Message ID:', response2);
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All tests completed successfully!');
    console.log('\n💡 If you didn\'t receive notifications:');
    console.log('1. Check your app has FCM permissions');
    console.log('2. Make sure the app is running or in background');
    console.log('3. Verify FCM token is still valid (tokens can expire)');
    console.log('4. Check device notification settings');
    console.log('5. Verify firebase-service-account.json is correct');

    process.exit(0);
  } catch (error) {
    console.error('❌ FCM Test Failed:', error);
    console.error('\nError Details:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.stack) console.error('Stack:', error.stack);

    console.log('\n💡 Common Issues:');
    console.log('1. Invalid FCM token - device may need to re-register');
    console.log('2. Firebase service account credentials incorrect');
    console.log('3. FCM not enabled in Firebase Console');
    console.log('4. Network connectivity issues');
    
    process.exit(1);
  }
}

// Run the test
testFCM();
