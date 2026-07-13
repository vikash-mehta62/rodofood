require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Clean up invalid/expired FCM tokens from database
 */
async function cleanupDevices() {
  try {
    console.log('🧹 Starting Device Cleanup...\n');

    await connectDB();
    console.log('✅ Database connected\n');

    const devices = await Device.find();
    console.log(`📱 Found ${devices.length} total devices\n`);

    let validCount = 0;
    let invalidCount = 0;
    const invalidDevices = [];

    console.log('🔍 Validating each token...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const device of devices) {
      const tokenPreview = device.fcmToken.substring(0, 30) + '...';
      
      try {
        // Try sending a test message (in dry run mode)
        const message = {
          token: device.fcmToken,
          notification: {
            title: 'Test',
            body: 'Test',
          },
        };

        // Dry run - doesn't actually send
        await getMessaging().send(message, true);
        
        console.log(`✅ VALID   | ${device.deviceId}`);
        console.log(`           Token: ${tokenPreview}`);
        console.log(`           User: ${device.userId || 'Guest'}\n`);
        validCount++;
        
      } catch (error) {
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
          
          console.log(`❌ INVALID | ${device.deviceId}`);
          console.log(`           Token: ${tokenPreview}`);
          console.log(`           User: ${device.userId || 'Guest'}`);
          console.log(`           Error: ${error.code}\n`);
          
          invalidDevices.push(device);
          invalidCount++;
        } else {
          console.log(`⚠️  ERROR  | ${device.deviceId}`);
          console.log(`           Error: ${error.message}\n`);
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Summary:');
    console.log(`   Total devices: ${devices.length}`);
    console.log(`   ✅ Valid tokens: ${validCount}`);
    console.log(`   ❌ Invalid tokens: ${invalidCount}\n`);

    if (invalidDevices.length > 0) {
      console.log('🗑️  Invalid devices found!\n');
      
      console.log('Options:');
      console.log('1. Delete these invalid devices from database');
      console.log('2. Keep them (not recommended)\n');
      
      // Auto-delete invalid tokens
      console.log('🗑️  Auto-deleting invalid devices...\n');
      
      for (const device of invalidDevices) {
        await Device.deleteOne({ _id: device._id });
        console.log(`   Deleted: ${device.deviceId}`);
      }
      
      console.log(`\n✅ Cleaned up ${invalidDevices.length} invalid device(s)!`);
      console.log('📱 Now notifications will only go to valid devices.\n');
    } else {
      console.log('✨ All devices have valid tokens! No cleanup needed.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDevices();
