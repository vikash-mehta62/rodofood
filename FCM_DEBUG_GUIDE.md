# 🔥 FCM Push Notification Debug Guide

## ❌ Problem Identified

Aap **`/api/v1/fcm/sendRequest`** endpoint ko call kar rahe the, jo **exist nahi karta**.

Correct endpoint hai: **`/api/v1/fcm/send`**

## ✅ Available FCM Endpoints

```
POST /api/v1/fcm/register         - Device register karne ke liye
POST /api/v1/fcm/send             - Notification send karne ke liye ✅
POST /api/v1/fcm/subscribe        - Topic subscribe karne ke liye
POST /api/v1/fcm/unsubscribe      - Topic unsubscribe karne ke liye
GET  /api/v1/fcm/stats            - Device stats
GET  /api/v1/fcm/topics           - Topics list
POST /api/v1/fcm/topics           - Topic create
GET  /api/v1/fcm/devices          - All devices list
```

## 📤 Correct API Usage

### 1. Specific Device Ko Notification Bhejne Ke Liye

```javascript
POST http://localhost:5000/api/v1/fcm/send

Body:
{
  "targetType": "token",
  "target": "YOUR_FCM_TOKEN_HERE",
  "title": "Order Update",
  "body": "Your order has been confirmed!",
  "imageUrl": "https://example.com/image.jpg",  // optional
  "data": {                                      // optional
    "orderId": "12345",
    "screen": "OrderDetails"
  },
  "type": "order",                               // optional
  "userId": "user_id_here"                       // optional
}
```

### 2. Topic Ko Notification Bhejne Ke Liye

```javascript
POST http://localhost:5000/api/v1/fcm/send

Body:
{
  "targetType": "topic",
  "target": "all_users",
  "title": "New Offer!",
  "body": "Get 50% off on all orders today!",
  "imageUrl": "https://example.com/offer.jpg",
  "data": {
    "offerId": "OFFER50",
    "screen": "Offers"
  },
  "type": "offer"
}
```

## 🔍 Debug Features Added

Maine aapke code mein detailed console logs add kar diye hain:

### Controller Logs (`fcmController.js`):
- ✅ Request body logging
- ✅ Validation checks
- ✅ Target type identification
- ✅ Database save confirmation
- ✅ Detailed error logging

### Service Logs (`fcmService.js`):
- ✅ Method entry logs
- ✅ Message structure logging
- ✅ FCM response logging
- ✅ Error code and message logging
- ✅ Token/Topic information

### Firebase Config Logs (`firebase.js`):
- ✅ Initialization status
- ✅ Project ID verification
- ✅ Success/Error messages

## 🧪 Test Your FCM Setup

### Option 1: Use Test Script

```bash
cd backend
node src/utils/testFCM.js
```

Ye script:
- ✅ Database se devices fetch karega
- ✅ First device ko test notification bhejega
- ✅ Topic notification test karega (if available)
- ✅ Detailed logs dikhayega

### Option 2: Use Postman/Thunder Client

1. **Register a Device First:**
```javascript
POST http://localhost:5000/api/v1/fcm/register

Body:
{
  "deviceId": "test-device-123",
  "fcmToken": "YOUR_ACTUAL_FCM_TOKEN",
  "platform": "android",
  "userId": null,
  "isGuest": true
}
```

2. **Send Test Notification:**
```javascript
POST http://localhost:5000/api/v1/fcm/send

Body:
{
  "targetType": "token",
  "target": "YOUR_ACTUAL_FCM_TOKEN",
  "title": "Test Notification",
  "body": "Testing push notifications!"
}
```

## 📱 Frontend Integration Fix

Agar aap frontend se call kar rahe ho, toh URL change karo:

### ❌ Wrong:
```javascript
fetch('http://localhost:5000/api/v1/fcm/sendRequest', {
  method: 'POST',
  ...
})
```

### ✅ Correct:
```javascript
fetch('http://localhost:5000/api/v1/fcm/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetType: 'token',  // or 'topic'
    target: fcmToken,     // or topic name
    title: 'Your Title',
    body: 'Your Message'
  })
})
```

## 🔧 Common Issues & Solutions

### 1. "Notification nahi aa raha"

**Check:**
- ✅ FCM token valid hai?
- ✅ Device registered hai database mein?
- ✅ Firebase service account credentials correct hai?
- ✅ App foreground/background mode
- ✅ Device notification permissions ON hai?

**Solution:**
```bash
# Server logs check karo
npm start

# Test script chalao
node src/utils/testFCM.js
```

### 2. "200 OK but notification nahi mila"

**Reasons:**
- FCM token expired (device ko re-register karna padega)
- App ne FCM token receive nahi kiya
- Device notification settings disabled
- Invalid service account credentials

**Check Console Logs:**
```
🔵 FCM Service - sendToDevice called with: ...
📤 Sending FCM message: ...
✅ FCM Response received: projects/.../messages/...
```

Agar ye logs aa rahe hain toh backend sahi hai, device side check karo.

### 3. "Firebase Admin error"

**Check:**
- `firebase-service-account.json` file exist karti hai?
- JSON format valid hai?
- Project ID, private key sab correct hai?
- Firebase Console mein FCM enabled hai?

## 📊 Monitor Notifications

Server start karne ke baad console mein ye logs dikhenge:

```
🔥 Initializing Firebase Admin SDK...
📋 Service Account Project ID: your-project-id
✅ Firebase Admin SDK initialized successfully!
📱 FCM notifications are ready to use

📩 FCM Send Request received: {...}
✅ Sending notification via topic to: all_users
📢 Sending to topic: all_users
🔵 FCM Service - sendToTopic called with: {...}
📤 Sending FCM message to topic: {...}
✅ FCM Topic Response received: projects/.../messages/...
💾 Saving notification to database...
✅ Notification saved to DB: 6789...
🎉 Notification process completed successfully
```

## 🎯 Next Steps

1. **Server restart karo** (taaki naye logs dikhe):
   ```bash
   cd backend
   npm start
   ```

2. **Correct endpoint use karo**: `/api/v1/fcm/send`

3. **Console logs check karo** jab notification bhejo

4. **Test script chalao**:
   ```bash
   node src/utils/testFCM.js
   ```

5. **Device side verify karo**:
   - FCM token correctly generate ho raha hai?
   - Permissions granted hai?
   - Notification handler properly setup hai?

## 💡 Pro Tips

- **Development:** Console logs se sara flow samajh ayega
- **Production:** Logs ko minimize karo (remove console.logs)
- **Testing:** Test script use karo, manual testing se faster hai
- **Debugging:** Firebase Console > Cloud Messaging > Check delivery reports

## 📞 Support

Agar phir bhi issue hai toh check karo:

1. Backend console logs
2. Frontend network tab (correct endpoint call ho raha hai?)
3. Device logcat (Android) / Console (iOS)
4. Firebase Console > Cloud Messaging > Delivery stats

Happy Coding! 🚀
