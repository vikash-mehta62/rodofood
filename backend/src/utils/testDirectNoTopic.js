require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Test notification WITHOUT using topics - direct to token
 */
async function testDirectNoTopic() {
  const vendorToken = 'cb5Xm5d-RoCfNCVZAiWNDo:APA91bFFAI1bXUzDEKMeNLEfkrm1_d5eND4AKLpwvbZfdMXTkhEaP_PfOX8eW8Sc8vCrHRoOBBmqKiZhA5QjwqWTzZRoc_a5peuBMYlDOM6hL16DuC7c-ls';

  console.log('🔥 Testing DIRECT TOKEN (No Topics Involved)\n');
  console.log('Token:', vendorToken.substring(0, 30) + '...\n');
  console.log('This test bypasses all topics - sends directly to device token.');
  console.log('If this works → Token is valid, mobile app configured');
  console.log('If this fails → Mobile app FCM issue\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const message = {
      token: vendorToken,
      notification: {
        title: '🎯 DIRECT TOKEN TEST',
        body: 'This is sent DIRECTLY to your token, NO TOPICS used!',
      },
      data: {
        type: 'direct_test',
        bypass_topics: 'true',
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

    console.log('📤 Sending message...\n');
    const response = await getMessaging().send(message);
    
    console.log('✅ SUCCESS! Message sent to Firebase!');
    console.log('Message ID:', response);
    console.log('\n📱 CHECK YOUR DEVICE NOW!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('RESULTS:\n');
    console.log('If you RECEIVED this notification:');
    console.log('  ✅ Backend is PERFECT');
    console.log('  ✅ Token is VALID');
    console.log('  ✅ Mobile app has FCM configured');
    console.log('  ❌ PROBLEM: Topic subscription issue');
    console.log('  🔧 SOLUTION: Run "npm run resync:topics"\n');
    
    console.log('If you DID NOT receive this notification:');
    console.log('  ✅ Backend is still PERFECT (message sent successfully)');
    console.log('  ❌ PROBLEM: Mobile app FCM not configured properly');
    console.log('  🔧 SOLUTION: Add FCM handlers in mobile app:\n');
    console.log('     1. Foreground handler (messaging().onMessage)');
    console.log('     2. Notification channel (Android)');
    console.log('     3. Background handler (setBackgroundMessageHandler)');
    console.log('     4. Check permissions granted');
    console.log('     5. Check device notification settings ON\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Failed to send message!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.log('\nIf error is "invalid-registration-token":');
    console.log('  → Token is expired/invalid');
    console.log('  → Device needs to re-register');
    console.log('  → Get fresh token from mobile app\n');
  }

  process.exit(0);
}

testDirectNoTopic();
