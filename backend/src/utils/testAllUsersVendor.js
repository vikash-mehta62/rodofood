require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Test notifications to vendor device
 */
async function testAllUsersVendor() {
  const vendorToken = 'cb5Xm5d-RoCfNCVZAiWNDo:APA91bFFAI1bXUzDEKMeNLEfkrm1_d5eND4AKLpwvbZfdMXTkhEaP_PfOX8eW8Sc8vCrHRoOBBmqKiZhA5QjwqWTzZRoc_a5peuBMYlDOM6hL16DuC7c-ls';

  console.log('🧪 Testing Vendor Device Notifications\n');
  console.log('Device: 0a4d39562439406e');
  console.log('Role: Vendor (vendorId set, userId null)');
  console.log('Topics: all_users, all_restaurants\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test 1: Direct token send
    console.log('TEST 1: Direct Token Send\n');
    
    const directMessage = {
      token: vendorToken,
      notification: {
        title: '🎯 Direct Token Test',
        body: 'Direct notification to vendor device!',
      },
      data: {
        type: 'direct',
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

    console.log('📤 Sending...');
    const response1 = await getMessaging().send(directMessage);
    console.log('✅ Direct send SUCCESS!');
    console.log('Message ID:', response1);
    console.log('📱 Check your device!\n');

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: all_restaurants topic
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: all_restaurants Topic\n');
    
    const restaurantMessage = {
      topic: 'all_restaurants',
      notification: {
        title: '🏪 Restaurant Topic Test',
        body: 'Notification to all_restaurants topic!',
      },
      data: {
        type: 'restaurant_topic',
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

    console.log('📤 Sending...');
    const response2 = await getMessaging().send(restaurantMessage);
    console.log('✅ Topic send SUCCESS!');
    console.log('Message ID:', response2);
    console.log('📱 Check your device!\n');

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: all_users topic
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: all_users Topic\n');
    
    const allUsersMessage = {
      topic: 'all_users',
      notification: {
        title: '🚀 All Users Topic Test',
        body: 'Notification to all_users topic!',
      },
      data: {
        type: 'all_users_topic',
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

    console.log('📤 Sending...');
    const response3 = await getMessaging().send(allUsersMessage);
    console.log('✅ Topic send SUCCESS!');
    console.log('Message ID:', response3);
    console.log('📱 Check your device!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 RESULTS:\n');
    console.log('You should have received 3 notifications:');
    console.log('  1. 🎯 Direct Token Test');
    console.log('  2. 🏪 Restaurant Topic Test');
    console.log('  3. 🚀 All Users Topic Test\n');
    
    console.log('If you received:');
    console.log('  ✅ ALL 3 → Everything working perfectly!');
    console.log('  ✅ Only #1 (direct) → Topic subscriptions not synced');
    console.log('  ✅ #1 and #2 → all_restaurants works, all_users doesn\'t');
    console.log('  ✅ #1 and #3 → all_users works, all_restaurants doesn\'t');
    console.log('  ❌ NONE → Mobile app issue (check foreground handler)\n');

    console.log('💡 Next Steps:');
    console.log('  1. If only direct token worked → Run: npm run resync:topics');
    console.log('  2. If none worked → Check mobile app FCM setup');
    console.log('  3. If specific topic failed → Wait 5-10 min for Firebase sync\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }

  process.exit(0);
}

testAllUsersVendor();
