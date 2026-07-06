const Device = require('../models/Device');
const fcmService = require('../services/fcmService');

/**
 * Register a device token for push notifications
 * Body: { deviceId, fcmToken, platform, userId (opt), vendorId (opt), isGuest (opt) }
 */
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, fcmToken, platform, userId, vendorId, isGuest } = req.body;

    if (!deviceId || !fcmToken) {
      return res.status(400).json({ success: false, message: 'deviceId and fcmToken are required' });
    }

    console.log('📱 Device registration request:', { 
      deviceId, 
      platform, 
      userId: userId || 'N/A', 
      vendorId: vendorId || 'N/A' 
    });

    // Validate: Either userId OR vendorId, not both
    if (userId && vendorId) {
      console.log('❌ Both userId and vendorId provided - only one allowed');
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot have both userId and vendorId. User must be either customer or vendor.' 
      });
    }

    // Upsert device
    let device = await Device.findOne({ deviceId });
    let roleChanged = false;
    
    if (device) {
      console.log('🔄 Updating existing device:', deviceId);
      
      // Check if role changed
      const wasCustomer = device.userId && !device.vendorId;
      const wasVendor = device.vendorId && !device.userId;
      const nowCustomer = userId && !vendorId;
      const nowVendor = vendorId && !userId;
      
      roleChanged = (wasCustomer && nowVendor) || (wasVendor && nowCustomer);
      
      if (roleChanged) {
        console.log('⚠️  Role change detected!');
        if (wasCustomer && nowVendor) {
          console.log('   Customer → Vendor');
        } else if (wasVendor && nowCustomer) {
          console.log('   Vendor → Customer');
        }
      }
      
      // Update device
      device.fcmToken = fcmToken;
      
      // Set userId or vendorId (mutually exclusive)
      if (vendorId) {
        device.vendorId = vendorId;
        device.userId = null; // Clear userId if vendor
        device.isGuest = false;
      } else if (userId) {
        device.userId = userId;
        device.vendorId = null; // Clear vendorId if customer
        device.isGuest = false;
      } else {
        // Guest
        device.userId = null;
        device.vendorId = null;
        device.isGuest = true;
      }
      
      if (platform) device.platform = platform;
      await device.save();
      
    } else {
      console.log('✨ Creating new device:', deviceId);
      
      // Validate and set userId/vendorId
      const deviceData = {
        deviceId,
        fcmToken,
        platform: platform || 'android',
        userId: null,
        vendorId: null,
        isGuest: true
      };
      
      if (vendorId) {
        deviceData.vendorId = vendorId;
        deviceData.userId = null;
        deviceData.isGuest = false;
      } else if (userId) {
        deviceData.userId = userId;
        deviceData.vendorId = null;
        deviceData.isGuest = false;
      }
      
      device = await Device.create(deviceData);
    }

    // Determine appropriate topics based on user type
    const topicsToSubscribe = ['all_users']; // Everyone gets all_users
    const topicsToUnsubscribe = [];
    
    if (device.vendorId) {
      // Restaurant/Vendor
      topicsToSubscribe.push('all_restaurants');
      topicsToUnsubscribe.push('customers', 'guests');
      console.log('🏪 Restaurant/Vendor detected');
      console.log('   vendorId:', device.vendorId);
      console.log('   userId: null');
      
    } else if (device.userId) {
      // Customer
      topicsToSubscribe.push('customers');
      topicsToUnsubscribe.push('all_restaurants', 'guests');
      console.log('👤 Customer detected');
      console.log('   userId:', device.userId);
      console.log('   vendorId: null');
      
    } else {
      // Guest
      topicsToSubscribe.push('guests');
      topicsToUnsubscribe.push('customers', 'all_restaurants');
      console.log('👻 Guest user detected');
      console.log('   userId: null');
      console.log('   vendorId: null');
    }

    console.log('📢 Topics to subscribe:', topicsToSubscribe);
    console.log('🚫 Topics to unsubscribe:', topicsToUnsubscribe);

    // Unsubscribe from inappropriate topics
    for (const topic of topicsToUnsubscribe) {
      if (device.topics.includes(topic)) {
        try {
          await fcmService.unsubscribeFromTopic(fcmToken, topic);
          device.topics = device.topics.filter(t => t !== topic);
          console.log(`  ✅ Unsubscribed from "${topic}"`);
        } catch (error) {
          console.error(`  ❌ Failed to unsubscribe from "${topic}":`, error.message);
        }
      }
    }

    // Subscribe to appropriate topics
    for (const topic of topicsToSubscribe) {
      if (!device.topics.includes(topic)) {
        try {
          await fcmService.subscribeToTopic(fcmToken, topic);
          device.topics.push(topic);
          console.log(`  ✅ Subscribed to "${topic}"`);
        } catch (error) {
          console.error(`  ❌ Failed to subscribe to "${topic}":`, error.message);
        }
      }
    }

    await device.save();
    
    console.log('✅ Device registered successfully');
    console.log('   Final topics:', device.topics);
    console.log('   Final userId:', device.userId || 'null');
    console.log('   Final vendorId:', device.vendorId || 'null');

    res.status(200).json({ 
      success: true, 
      message: 'Device registered successfully', 
      data: {
        deviceId: device.deviceId,
        platform: device.platform,
        userId: device.userId,
        vendorId: device.vendorId,
        isGuest: device.isGuest,
        subscribedTopics: device.topics
      }
    });
  } catch (error) {
    console.error('❌ Error in registerDevice:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Subscribe device(s) to a topic manually
 * Body: { fcmTokens (array or string), topic, deviceIds (opt) }
 */
exports.subscribeToTopic = async (req, res) => {
  try {
    const { fcmTokens, topic, deviceIds } = req.body;

    if (!fcmTokens || !topic) {
      return res.status(400).json({ success: false, message: 'fcmTokens and topic are required' });
    }

    await fcmService.subscribeToTopic(fcmTokens, topic);

    // Update DB if deviceIds are provided
    if (deviceIds && Array.isArray(deviceIds)) {
      await Device.updateMany(
        { deviceId: { $in: deviceIds } },
        { $addToSet: { topics: topic } }
      );
    }

    res.status(200).json({ success: true, message: `Successfully subscribed to topic: ${topic}` });
  } catch (error) {
    console.error('Error in subscribeToTopic:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Unsubscribe device(s) from a topic manually
 * Body: { fcmTokens (array or string), topic, deviceIds (opt) }
 */
exports.unsubscribeFromTopic = async (req, res) => {
  try {
    const { fcmTokens, topic, deviceIds } = req.body;

    if (!fcmTokens || !topic) {
      return res.status(400).json({ success: false, message: 'fcmTokens and topic are required' });
    }

    await fcmService.unsubscribeFromTopic(fcmTokens, topic);

    // Update DB if deviceIds are provided
    if (deviceIds && Array.isArray(deviceIds)) {
      await Device.updateMany(
        { deviceId: { $in: deviceIds } },
        { $pull: { topics: topic } }
      );
    }

    res.status(200).json({ success: true, message: `Successfully unsubscribed from topic: ${topic}` });
  } catch (error) {
    console.error('Error in unsubscribeFromTopic:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Send a notification (to topic or specific token)
 * Body: { targetType ('topic' or 'token'), target, title, body, imageUrl, data, userId, vendorId, isForGuest, type }
 */
exports.sendNotification = async (req, res) => {
  try {
    console.log('📩 FCM Send Request received:', JSON.stringify(req.body, null, 2));
    
    const { targetType, target, title, body, imageUrl, data, userId, vendorId, isForGuest, type } = req.body;

    if (!targetType || !target || !title || !body) {
      console.log('❌ Validation failed - Missing required fields');
      return res.status(400).json({ success: false, message: 'targetType, target, title, and body are required' });
    }

    console.log(`✅ Sending notification via ${targetType} to: ${target}`);

    let fcmResponse;
    let targetDeviceCount = 0;
    
    if (targetType === 'topic') {
      console.log('📢 Sending to topic:', target);
      
      // Count devices subscribed to this topic
      const subscribedDevices = await Device.find({ topics: target });
      targetDeviceCount = subscribedDevices.length;
      
      console.log(`👥 Found ${targetDeviceCount} device(s) subscribed to topic "${target}"`);
      
      if (targetDeviceCount === 0) {
        console.log('⚠️  WARNING: No devices subscribed to this topic!');
        console.log('💡 Notification will be sent but no one will receive it.');
      } else {
        console.log('📱 Target devices:');
        subscribedDevices.forEach((device, index) => {
          console.log(`   ${index + 1}. ${device.deviceId} (${device.platform}) - User: ${device.userId || 'Guest'}`);
        });
      }
      
      fcmResponse = await fcmService.sendToTopic(target, title, body, data, imageUrl);
      console.log('✅ Topic notification sent. Response:', fcmResponse);
      console.log(`📊 Delivered to ${targetDeviceCount} subscribed device(s)`);
      
    } else if (targetType === 'token') {
      console.log('📱 Sending to device token:', target);
      targetDeviceCount = 1;
      
      fcmResponse = await fcmService.sendToDevice(target, title, body, data, imageUrl);
      console.log('✅ Device notification sent. Response:', fcmResponse);
    } else {
      console.log('❌ Invalid targetType:', targetType);
      return res.status(400).json({ success: false, message: 'Invalid targetType' });
    }

    // Save notification to DB
    console.log('💾 Saving notification to database...');
    const savedNotification = await fcmService.saveNotification({
      title,
      body,
      imageUrl,
      data,
      userId,
      vendorId,
      isForGuest: isForGuest || false,
      type: type || 'system'
    });
    console.log('✅ Notification saved to DB:', savedNotification._id);

    console.log('🎉 Notification process completed successfully');
    res.status(200).json({
      success: true,
      message: `Notification sent successfully to ${targetDeviceCount} device(s)`,
      fcmResponse,
      notification: savedNotification,
      targetDeviceCount,
      targetTopic: targetType === 'topic' ? target : null
    });
  } catch (error) {
    console.error('❌ Error in sendNotification:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const Topic = require('../models/Topic');

/**
 * Get device stats for the dashboard
 */
exports.getDeviceStats = async (req, res) => {
  try {
    const totalDevices = await Device.countDocuments();
    const customers = await Device.countDocuments({ userId: { $ne: null } });
    const partners = await Device.countDocuments({ vendorId: { $ne: null } });
    const guests = await Device.countDocuments({ isGuest: true });

    res.status(200).json({
      success: true,
      data: { totalDevices, customers, partners, guests }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Custom Topics Management
 */
exports.getTopics = async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const { topicKey, displayName, description, autoSubscribe } = req.body;
    if (!topicKey || !displayName) {
      return res.status(400).json({ success: false, message: 'topicKey and displayName are required' });
    }
    const topic = await Topic.create({ topicKey, displayName, description, autoSubscribe });
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Topic key already exists' });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all devices (for enrollment modal)
 */
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.find()
      .populate('userId', 'name phone')
      .populate('vendorId', 'restaurantName phone');
    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
