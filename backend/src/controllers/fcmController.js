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

    // Validate: Either userId OR vendorId, not both
    if (userId && vendorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot have both userId and vendorId. User must be either customer or vendor.' 
      });
    }

    // Upsert device
    let device = await Device.findOne({ deviceId });
    
    if (device) {
      device.fcmToken = fcmToken;
      
      // Set userId or vendorId (mutually exclusive)
      if (vendorId) {
        device.vendorId = vendorId;
        device.userId = null;
        device.isGuest = false;
      } else if (userId) {
        device.userId = userId;
        device.vendorId = null;
        device.isGuest = false;
      } else {
        device.userId = null;
        device.vendorId = null;
        device.isGuest = true;
      }
      
      if (platform) device.platform = platform;
      await device.save();
      
    } else {
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
    const topicsToSubscribe = ['all_users'];
    const topicsToUnsubscribe = [];
    
    if (device.vendorId) {
      topicsToSubscribe.push('all_restaurants');
      topicsToUnsubscribe.push('customers', 'guests');
    } else if (device.userId) {
      topicsToSubscribe.push('customers');
      topicsToUnsubscribe.push('all_restaurants', 'guests');
    } else {
      topicsToSubscribe.push('guests');
      topicsToUnsubscribe.push('customers', 'all_restaurants');
    }

    // Unsubscribe from inappropriate topics
    for (const topic of topicsToUnsubscribe) {
      if (device.topics.includes(topic)) {
        try {
          await fcmService.unsubscribeFromTopic(fcmToken, topic);
          device.topics = device.topics.filter(t => t !== topic);
        } catch (error) {
          // Silent fail - not critical
        }
      }
    }

    // Subscribe to appropriate topics
    for (const topic of topicsToSubscribe) {
      if (!device.topics.includes(topic)) {
        try {
          await fcmService.subscribeToTopic(fcmToken, topic);
          device.topics.push(topic);
        } catch (error) {
          // Silent fail - not critical
        }
      }
    }

    await device.save();

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
    console.error('Error in registerDevice:', error.message);
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
    const { targetType, target, title, body, imageUrl, data, userId, vendorId, isForGuest, type } = req.body;

    if (!targetType || !target || !title || !body) {
      return res.status(400).json({ success: false, message: 'targetType, target, title, and body are required' });
    }

    let fcmResponse;
    let targetDeviceCount = 0;
    let targetDevices = [];
    
    if (targetType === 'topic') {
      // Count devices subscribed to this topic
      const subscribedDevices = await Device.find({ topics: target })
        .populate('userId', 'name phone email')
        .populate('vendorId', 'restaurantName phone email');
      
      targetDeviceCount = subscribedDevices.length;
      
      if (targetDeviceCount > 0) {
        subscribedDevices.forEach((device) => {
          const userInfo = device.userId 
            ? `Customer: ${device.userId.name || 'N/A'} (${device.userId.phone || 'N/A'})`
            : device.vendorId
            ? `Vendor: ${device.vendorId.restaurantName || 'N/A'} (${device.vendorId.phone || 'N/A'})`
            : 'Guest';
          
          targetDevices.push({
            deviceId: device.deviceId,
            platform: device.platform,
            userType: device.userId ? 'customer' : device.vendorId ? 'vendor' : 'guest',
            userName: device.userId?.name || device.vendorId?.restaurantName || 'Guest',
            userPhone: device.userId?.phone || device.vendorId?.phone || 'N/A',
            topics: device.topics
          });
        });
      }
      
      fcmResponse = await fcmService.sendToTopic(target, title, body, data, imageUrl);
      
    } else if (targetType === 'token') {
      targetDeviceCount = 1;
      
      // Find device info
      const device = await Device.findOne({ fcmToken: target })
        .populate('userId', 'name phone email')
        .populate('vendorId', 'restaurantName phone email');
      
      if (device) {
        targetDevices.push({
          deviceId: device.deviceId,
          platform: device.platform,
          userType: device.userId ? 'customer' : device.vendorId ? 'vendor' : 'guest',
          userName: device.userId?.name || device.vendorId?.restaurantName || 'Guest',
          userPhone: device.userId?.phone || device.vendorId?.phone || 'N/A',
          topics: device.topics
        });
      }
      
      fcmResponse = await fcmService.sendToDevice(target, title, body, data, imageUrl);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid targetType' });
    }

    // Save notification to DB
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

    res.status(200).json({
      success: true,
      message: `Notification sent successfully to ${targetDeviceCount} device(s)`,
      fcmResponse,
      notification: savedNotification,
      deliveryInfo: {
        targetDeviceCount,
        targetTopic: targetType === 'topic' ? target : null,
        targetDevices: targetDevices.map(d => ({
          deviceId: d.deviceId,
          platform: d.platform,
          userType: d.userType,
          userName: d.userName,
          userPhone: d.userPhone
        }))
      }
    });
  } catch (error) {
    console.error('Error in sendNotification:', error.message);
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
