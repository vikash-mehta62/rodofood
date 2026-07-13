require('dotenv').config();
const Device = require('../models/Device');
const connectDB = require('../config/db');

/**
 * Analyze topic subscriptions
 */
async function analyzeTopics() {
  try {
    console.log('📊 Topic Subscription Analysis\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await connectDB();
    console.log('✅ Database connected\n');

    // Get all devices
    const allDevices = await Device.find();
    console.log(`📱 Total registered devices: ${allDevices.length}\n`);

    if (allDevices.length === 0) {
      console.log('❌ No devices found in database');
      process.exit(0);
    }

    // Analyze by topics
    const topicStats = {};
    const defaultTopics = ['all_users', 'customers', 'all_restaurants', 'guests'];
    
    // Initialize stats
    defaultTopics.forEach(topic => {
      topicStats[topic] = {
        count: 0,
        devices: []
      };
    });

    // Count subscriptions
    allDevices.forEach(device => {
      device.topics.forEach(topic => {
        if (!topicStats[topic]) {
          topicStats[topic] = { count: 0, devices: [] };
        }
        topicStats[topic].count++;
        topicStats[topic].devices.push({
          deviceId: device.deviceId,
          platform: device.platform,
          userId: device.userId,
          vendorId: device.vendorId,
          isGuest: device.isGuest
        });
      });
    });

    // Display stats
    console.log('📊 TOPIC SUBSCRIPTION BREAKDOWN:\n');
    
    Object.keys(topicStats).sort().forEach(topic => {
      const stat = topicStats[topic];
      const percentage = ((stat.count / allDevices.length) * 100).toFixed(1);
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📢 Topic: "${topic}"`);
      console.log(`👥 Subscribers: ${stat.count} device(s) (${percentage}%)`);
      
      if (stat.count === 0) {
        console.log(`⚠️  WARNING: No devices subscribed!`);
        console.log(`💡 Notifications to this topic will not be received by anyone.\n`);
      } else {
        console.log(`\n📱 Subscribed Devices:`);
        stat.devices.forEach((device, index) => {
          const userType = device.vendorId ? 'Restaurant' : 
                          device.userId ? 'Customer' : 'Guest';
          console.log(`   ${index + 1}. ${device.deviceId}`);
          console.log(`      Platform: ${device.platform}`);
          console.log(`      Type: ${userType}`);
          console.log(`      User ID: ${device.userId || 'N/A'}`);
          console.log(`      Vendor ID: ${device.vendorId || 'N/A'}`);
        });
        console.log('');
      }
    });

    // Devices without any topic
    const devicesWithoutTopics = allDevices.filter(d => !d.topics || d.topics.length === 0);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⚠️  Devices with NO topic subscriptions: ${devicesWithoutTopics.length}`);
    
    if (devicesWithoutTopics.length > 0) {
      console.log('\n📱 Unsubscribed Devices:');
      devicesWithoutTopics.forEach((device, index) => {
        console.log(`   ${index + 1}. ${device.deviceId} (${device.platform})`);
      });
      console.log('\n💡 These devices will NOT receive topic-based notifications!');
      console.log('🔧 Solution: Re-register these devices with proper topics.\n');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 SUMMARY:\n');
    
    console.log('Available Topics and Usage:');
    console.log(`  • all_users: ${topicStats['all_users']?.count || 0} devices (All registered users)`);
    console.log(`  • customers: ${topicStats['customers']?.count || 0} devices (Logged-in customers)`);
    console.log(`  • all_restaurants: ${topicStats['all_restaurants']?.count || 0} devices (Restaurant partners)`);
    console.log(`  • guests: ${topicStats['guests']?.count || 0} devices (Guest/unregistered users)`);
    
    // Custom topics
    const customTopics = Object.keys(topicStats).filter(t => !defaultTopics.includes(t));
    if (customTopics.length > 0) {
      console.log('\n  Custom Topics:');
      customTopics.forEach(topic => {
        console.log(`  • ${topic}: ${topicStats[topic].count} devices`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:\n');
    
    if (topicStats['customers']?.count === 0) {
      console.log('⚠️  "customers" topic has NO subscribers!');
      console.log('   → Logged-in users need to subscribe to "customers" topic');
      console.log('   → Check mobile app: await messaging().subscribeToTopic("customers")\n');
    }
    
    if (topicStats['all_restaurants']?.count === 0) {
      console.log('⚠️  "all_restaurants" topic has NO subscribers!');
      console.log('   → Restaurant partners need to subscribe');
      console.log('   → Check vendor app FCM setup\n');
    }
    
    if (devicesWithoutTopics.length > 0) {
      console.log(`⚠️  ${devicesWithoutTopics.length} device(s) have NO topic subscriptions!`);
      console.log('   → These devices will never receive topic-based notifications');
      console.log('   → Re-register with proper topics\n');
    }

    if (topicStats['guests']?.count > 0 && topicStats['customers']?.count === 0) {
      console.log('💡 All devices are guests, no logged-in customers!');
      console.log('   → When users log in, update their device:');
      console.log('   → Unsubscribe from "guests"');
      console.log('   → Subscribe to "customers"\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

analyzeTopics();
