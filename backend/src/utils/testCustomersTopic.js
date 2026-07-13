require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Direct test to "customers" topic
 */
async function testCustomersTopic() {
  console.log('🧪 Testing "customers" Topic\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const message = {
      topic: 'customers',
      notification: {
        title: '🎯 Customers Topic Test',
        body: 'This notification is for logged-in customers only!',
      },
      data: {
        type: 'test',
        topic: 'customers',
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

    console.log('📤 Sending to "customers" topic...\n');
    console.log('Message:', JSON.stringify(message, null, 2));
    console.log('\n⏳ Sending...\n');

    const response = await getMessaging().send(message);
    
    console.log('✅ SUCCESS!');
    console.log('Message ID:', response);
    console.log('\n📱 CHECK YOUR DEVICE NOW!\n');
    
    console.log('If notification APPEARED:');
    console.log('  ✅ Topic subscription working');
    console.log('  ✅ Device properly configured');
    console.log('  ✅ Everything is perfect!\n');
    
    console.log('If notification DID NOT appear:');
    console.log('  ⚠️  Possible issues:');
    console.log('  1. App not running or in background');
    console.log('  2. Foreground handler missing');
    console.log('  3. Notification channel issue (Android)');
    console.log('  4. Firebase not properly initialized in app');
    console.log('  5. Topic subscription not synced yet (wait 1-2 minutes)\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
  
  process.exit(0);
}

testCustomersTopic();
