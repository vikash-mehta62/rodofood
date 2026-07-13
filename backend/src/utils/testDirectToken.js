require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Test by sending DIRECTLY to token (not topic)
 * This mimics what Firebase Console does
 */
async function testDirectToken() {
  try {
    console.log('🔥 Testing Direct Token Send (Like Firebase Console)...\n');

    await connectDB();
    console.log('✅ Database connected\n');

    const devices = await Device.find().limit(5);
    console.log(`📱 Found ${devices.length} devices\n`);

    if (devices.length === 0) {
      console.log('❌ No devices found');
      process.exit(0);
    }

    // Show devices
    devices.forEach((device, index) => {
      console.log(`${index + 1}. Device: ${device.deviceId}`);
      console.log(`   Token: ${device.fcmToken.substring(0, 30)}...`);
      console.log(`   Topics: ${device.topics.join(', ') || 'None'}\n`);
    });

    const testDevice = devices[0];
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST: Sending DIRECTLY to TOKEN (not topic)\n');

    // EXACT same format as Firebase Console uses
    const message = {
      token: testDevice.fcmToken,
      notification: {
        title: '🎯 Direct Token Test',
        body: 'This is sent directly to your device token, just like Firebase Console!',
      },
      data: {
        type: 'direct_test',
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

    console.log('📤 Message structure:', JSON.stringify(message, null, 2));
    console.log('\n⏳ Sending...\n');

    const response = await getMessaging().send(message);
    
    console.log('✅ SUCCESS!');
    console.log('Message ID:', response);
    console.log('\n📱 Check your device NOW!');
    console.log('\nIf notification APPEARED:');
    console.log('  ✅ Token is valid');
    console.log('  ✅ Mobile app is configured correctly');
    console.log('  ❌ Problem is with TOPIC subscription\n');
    
    console.log('If notification DID NOT appear:');
    console.log('  ❌ Check mobile app logs');
    console.log('  ❌ Check foreground handler');
    console.log('  ❌ Check notification channel\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Now testing TOPIC send...\n');

    if (testDevice.topics && testDevice.topics.length > 0) {
      const testTopic = testDevice.topics[0];
      
      console.log('Topic:', testTopic);
      
      const topicMessage = {
        topic: testTopic,
        notification: {
          title: '📢 Topic Test',
          body: `Testing ${testTopic} topic subscription`,
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

      console.log('📤 Sending to topic...\n');
      const topicResponse = await getMessaging().send(topicMessage);
      
      console.log('✅ Topic message sent!');
      console.log('Message ID:', topicResponse);
      console.log('\n📱 Check if THIS notification appeared');
      console.log('\nIf this DID NOT appear but direct token worked:');
      console.log('  ❌ Device NOT properly subscribed to topic');
      console.log('  🔧 Solution: Re-subscribe device to topics\n');
    } else {
      console.log('⚠️  Device has no topics subscribed!');
      console.log('This is why topic notifications don\'t work!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
    });
    process.exit(1);
  }
}

testDirectToken();
