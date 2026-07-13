require('dotenv').config();
require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Fix devices that have both userId AND vendorId
 * Keep vendorId if both present (vendor takes priority)
 */
async function fixConflictingRoles() {
  try {
    console.log('🔧 Fixing Conflicting User Roles...\n');

    await connectDB();
    console.log('✅ Database connected\n');

    const allDevices = await Device.find();
    console.log(`📱 Total devices: ${allDevices.length}\n`);

    // Find devices with both userId and vendorId
    const conflictingDevices = allDevices.filter(d => d.userId && d.vendorId);
    
    console.log(`⚠️  Devices with BOTH userId AND vendorId: ${conflictingDevices.length}\n`);

    if (conflictingDevices.length === 0) {
      console.log('✅ No conflicting devices found! All good.\n');
      process.exit(0);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const device of conflictingDevices) {
      console.log(`Fixing: ${device.deviceId}`);
      console.log(`  Current state:`);
      console.log(`    userId: ${device.userId}`);
      console.log(`    vendorId: ${device.vendorId}`);
      console.log(`    topics: ${device.topics.join(', ')}\n`);

      // Vendor takes priority - clear userId
      console.log('  🏪 Vendor takes priority - clearing userId');
      device.userId = null;
      device.isGuest = false;

      // Fix topics: Remove customer topics, keep vendor topics
      const correctTopics = ['all_users', 'all_restaurants'];
      const topicsToRemove = ['customers', 'guests'];
      const token = device.fcmToken;

      // Unsubscribe from wrong topics
      for (const topic of topicsToRemove) {
        if (device.topics.includes(topic)) {
          try {
            await getMessaging().unsubscribeFromTopic(token, topic);
            console.log(`    ✅ Unsubscribed from "${topic}"`);
          } catch (error) {
            console.log(`    ❌ Failed to unsubscribe from "${topic}": ${error.message}`);
          }
        }
      }

      // Subscribe to correct topics
      for (const topic of correctTopics) {
        if (!device.topics.includes(topic)) {
          try {
            await getMessaging().subscribeToTopic(token, topic);
            console.log(`    ✅ Subscribed to "${topic}"`);
          } catch (error) {
            console.log(`    ❌ Failed to subscribe to "${topic}": ${error.message}`);
          }
        }
      }

      // Update topics array
      device.topics = correctTopics;
      await device.save();

      console.log(`  ✅ Fixed!`);
      console.log(`    New state:`);
      console.log(`      userId: null`);
      console.log(`      vendorId: ${device.vendorId}`);
      console.log(`      topics: ${device.topics.join(', ')}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    console.log('🎉 All conflicts resolved!\n');

    // Show final summary
    const updated = await Device.find();
    const customers = updated.filter(d => d.userId && !d.vendorId);
    const vendors = updated.filter(d => d.vendorId && !d.userId);
    const guests = updated.filter(d => !d.userId && !d.vendorId);
    const conflicts = updated.filter(d => d.userId && d.vendorId);

    console.log('📊 Final Summary:');
    console.log(`  👤 Customers (userId only): ${customers.length}`);
    console.log(`  🏪 Vendors (vendorId only): ${vendors.length}`);
    console.log(`  👻 Guests (neither): ${guests.length}`);
    console.log(`  ⚠️  Conflicts (both): ${conflicts.length}\n`);

    if (conflicts.length === 0) {
      console.log('✅ No more conflicts! All devices have clean roles.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

fixConflictingRoles();
