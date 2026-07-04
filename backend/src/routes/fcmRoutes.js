const express = require('express');
const router = express.Router();
const fcmController = require('../controllers/fcmController');

// In a real app, you might want to protect these with auth middleware
// e.g. const auth = require('../middleware/auth');
// But guests need to register too, so registerDevice is open or has custom handling.

router.post('/register', fcmController.registerDevice);
/*  #swagger.tags = ['FCM Push Notifications']
    #swagger.summary = 'Register a device for push notifications'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              deviceId: { type: "string" },
              fcmToken: { type: "string" },
              platform: { type: "string" },
              userId: { type: "string" },
              vendorId: { type: "string" },
              isGuest: { type: "boolean" }
            }
          }
        }
      }
    }
*/

router.post('/subscribe', fcmController.subscribeToTopic);
/*  #swagger.tags = ['FCM Push Notifications']
    #swagger.summary = 'Manually subscribe tokens to a topic'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              fcmTokens: { type: "array", items: { type: "string" } },
              topic: { type: "string" },
              deviceIds: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    }
*/

router.post('/unsubscribe', fcmController.unsubscribeFromTopic);
/*  #swagger.tags = ['FCM Push Notifications']
    #swagger.summary = 'Manually unsubscribe tokens from a topic'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              fcmTokens: { type: "array", items: { type: "string" } },
              topic: { type: "string" },
              deviceIds: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    }
*/

router.post('/send', fcmController.sendNotification);
/*  #swagger.tags = ['FCM Push Notifications']
    #swagger.summary = 'Send a push notification to a device or topic'
    #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              targetType: { type: "string", enum: ["topic", "token"] },
              target: { type: "string" },
              title: { type: "string" },
              body: { type: "string" },
              imageUrl: { type: "string" },
              type: { type: "string" },
              data: { type: "object" },
              userId: { type: "string" },
              vendorId: { type: "string" },
              isForGuest: { type: "boolean" }
            }
          }
        }
      }
    }
*/

router.get('/stats', fcmController.getDeviceStats);
router.get('/topics', fcmController.getTopics);
router.post('/topics', fcmController.createTopic);
router.delete('/topics/:id', fcmController.deleteTopic);
router.get('/devices', fcmController.getAllDevices);

module.exports = router;
