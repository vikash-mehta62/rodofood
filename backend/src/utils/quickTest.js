require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');

/**
 * Quick test with specific token
 */
async function quickTest() {
  // Working token
  const workingToken = 'cb5Xm5d-RoCfNCVZAiWNDo:APA91bFFAI1bXUzDEKMeNLEfkrm1_d5eND4AKLpwvbZfdMXTkhEaP_PfOX8eW8Sc8vCrHRoOBBmqKiZhA5QjwqWTzZRoc_a5peuBMYlDOM6hL16DuC7c-ls';
  
  console.log('🔥 Quick Notification Test\n');
  
  try {
    // Test 1: Direct token send
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Direct Token Send\n');
    
    const directMessage = {
      token: workingToken,
      notification: {
        title: '✅ Direct Token Test',
        body: 'This notification was sent directly to your token!',
      },
      data: {
        type: 'direct',
        screen: 'Home',
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
    
    const response1 = await getMessaging().send(directMessage);
    console.log('✅ Direct send SUCCESS!');
    console.log('Message ID:', response1);
    console.log('📱 Check your device!\n');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Topic send
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Topic Send (guests)\n');
    
    const topicMessage = {
      topic: 'guests',
      notification: {
        title: '📢 Topic Test',
        body: 'This notification was sent to "guests" topic!',
      },
      data: {
        type: 'topic',
        topic: 'guests',
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
    
    const response2 = await getMessaging().send(topicMessage);
    console.log('✅ Topic send SUCCESS!');
    console.log('Message ID:', response2);
    console.log('📱 Check your device!\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Results:\n');
    console.log('If BOTH notifications appeared:');
    console.log('  ✅ Everything is working perfectly!');
    console.log('  ✅ Device is properly subscribed to "guests" topic\n');
    
    console.log('If ONLY direct notification appeared:');
    console.log('  ✅ Token is valid and working');
    console.log('  ❌ Device NOT subscribed to "guests" topic');
    console.log('  🔧 Need to subscribe device to topic\n');
    
    console.log('If NO notifications appeared:');
    console.log('  ❌ Check mobile app logs');
    console.log('  ❌ Check if app is running');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
  }
  
  process.exit(0);
}

quickTest();
