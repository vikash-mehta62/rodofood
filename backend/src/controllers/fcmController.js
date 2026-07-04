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

    // Upsert device
    let device = await Device.findOne({ deviceId });
    if (device) {
      device.fcmToken = fcmToken;
      if (userId) device.userId = userId;
      if (vendorId) device.vendorId = vendorId;
      if (isGuest !== undefined) device.isGuest = isGuest;
      if (platform) device.platform = platform;
      await device.save();
    } else {
      device = await Device.create({
        deviceId,
        fcmToken,
        userId: userId || null,
        vendorId: vendorId || null,
        isGuest: isGuest !== undefined ? isGuest : true,
        platform: platform || 'android'
      });
    }

    // Auto subscribe based on role
    let defaultTopic = '';
    if (vendorId) {
      defaultTopic = 'all_restaurants';
    } else if (userId) {
      defaultTopic = 'all_users';
    } else {
      defaultTopic = 'guests';
    }

    if (defaultTopic && !device.topics.includes(defaultTopic)) {
      await fcmService.subscribeToTopic(fcmToken, defaultTopic);
      device.topics.push(defaultTopic);
      await device.save();
    }

    res.status(200).json({ success: true, message: 'Device registered successfully', data: device });
  } catch (error) {
    console.error('Error in registerDevice:', error);
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
    if (targetType === 'topic') {
      fcmResponse = await fcmService.sendToTopic(target, title, body, data, imageUrl);
    } else if (targetType === 'token') {
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
      message: 'Notification sent successfully',
      fcmResponse,
      notification: savedNotification
    });
  } catch (error) {
    console.error('Error in sendNotification:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
