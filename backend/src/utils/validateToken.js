require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Validate FCM Token
 * Usage: node src/utils/validateToken.js <FCM_TOKEN>
 */
async function validateToken() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ Please provide FCM token as argument');
    console.log('Usage: node src/utils/validateToken.js <FCM_TOKEN>');
    process.exit(1);
  }

  console.log('🔍 Validating FCM Token...\n');
  console.log('Token:', token.substring(0, 50) + '...\n');

  try {
    const message = {
      token: token,
      notification: {
        title: '🧪 Token Validation Test',
        body: 'If you see this, your FCM token is valid and working!',
      },
      data: {
        test: 'true',
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

    console.log('📤 Sending test notification...');
    const response = await getMessaging().send(message);
    
    console.log('\n✅ SUCCESS! Token is valid!');
    console.log('Message ID:', response);
    console.log('\n📱 Check your device - notification should appear');
    console.log('\nIf notification DIDN\'T appear, the issue is on mobile app:');
    console.log('1. App not properly configured for FCM');
    console.log('2. Permissions not granted');
    console.log('3. Notification channel missing (Android)');
    console.log('4. Foreground handler not implemented');
    
  } catch (error) {
    console.log('\n❌ TOKEN INVALID!');
    console.log('\nError Code:', error.code);
    console.log('Error Message:', error.message);
    
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Token expired or invalid');
      console.log('2. Uninstall/reinstall app on device');
      console.log('3. Get fresh token from mobile app');
      console.log('4. Register new token with backend');
    }
    
    if (error.code === 'messaging/invalid-argument') {
      console.log('\n🔧 SOLUTION:');
      console.log('Token format is wrong. Make sure you copied the complete token.');
    }
  }

  process.exit(0);
}

validateToken();
