const { getMessaging } = require('firebase-admin/messaging');
const Notification = require('../models/Notification');
const Device = require('../models/Device');

class FCMService {
  /**
   * Send a notification to a specific device via FCM Token
   */
  async sendToDevice(fcmToken, title, body, data = {}, imageUrl = '') {
    try {
      const stringData = {};
      for (const key in data) {
        stringData[key] = String(data[key]);
      }

      const message = {
        token: fcmToken,
        notification: { title, body, ...(imageUrl && { imageUrl }) },
        data: stringData,
        android: {
          priority: 'high',
          notification: { sound: 'default', priority: 'high', channelId: 'default' }
        },
        apns: {
          payload: { aps: { sound: 'default', 'content-available': 1 } }
        }
      };

      return await getMessaging().send(message);
    } catch (error) {
      console.error('FCM sendToDevice error:', error.code);
      throw error;
    }
  }

  /**
   * Send a notification to a specific topic
   */
  async sendToTopic(topic, title, body, data = {}, imageUrl = '') {
    try {
      const stringData = {};
      for (const key in data) {
        stringData[key] = String(data[key]);
      }

      const message = {
        topic: topic,
        notification: { title, body, ...(imageUrl && { imageUrl }) },
        data: stringData,
        android: {
          priority: 'high',
          notification: { sound: 'default', priority: 'high', channelId: 'default' }
        },
        apns: {
          payload: { aps: { sound: 'default', 'content-available': 1 } }
        }
      };

      return await getMessaging().send(message);
    } catch (error) {
      console.error('FCM sendToTopic error:', error.code);
      throw error;
    }
  }

  /**
   * Subscribe multiple tokens to a topic
   */
  async subscribeToTopic(tokens, topic) {
    try {
      // tokens can be a single string or an array of strings
      const response = await getMessaging().subscribeToTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe multiple tokens from a topic
   */
  async unsubscribeFromTopic(tokens, topic) {
    try {
      const response = await getMessaging().unsubscribeFromTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }

  /**
   * Save Notification in Database
   */
  async saveNotification(payload) {
    try {
      const notification = new Notification(payload);
      return await notification.save();
    } catch (error) {
      console.error('Error saving notification:', error.message);
      throw error;
    }
  }
}

module.exports = new FCMService();
