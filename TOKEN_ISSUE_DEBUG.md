# 🔥 FCM Token Issue - Complete Debug Guide

## Problem Summary

✅ Backend sending successfully (Message ID milta hai)
❌ **But mobile pe notification nahi aata**

**Matlab:** FCM token **invalid/expired** hai ya mobile app properly configured nahi hai.

---

## 🧪 Step 1: Validate Your FCM Token

### Method A: Using Validation Script

```bash
cd backend

# Copy token from database logs
npm run validate:token YOUR_FCM_TOKEN_HERE
```

**Example:**
```bash
npm run validate:token fWrE6QC4RbipcPlGKzKIng:APA91bGzL1KnsEL7Z5kohHTVN3eV4s1z5Mkequ_auhuJctQSmCYLdQgC8LTmboJskhwQy8DcWOK3DUKw5k7b6xZjAQSWXAuPB1DupELnrjPQyqAbob0qZgw
```

**Possible Results:**

#### ✅ If Token Valid:
```
✅ SUCCESS! Token is valid!
Message ID: projects/.../messages/...
📱 Check your device - notification should appear
```

**Agar notification nahi aaya** toh problem **mobile app configuration** mein hai:
- Foreground handler missing
- Notification channel nahi bana
- Permissions nahi diye

#### ❌ If Token Invalid:
```
❌ TOKEN INVALID!
Error Code: messaging/invalid-registration-token
Error Message: The registration token is not valid
```

**Solution:** Fresh token chahiye - mobile app se naya token generate karo

---

### Method B: Firebase Console Direct Test

1. **Firebase Console open karo:**
   - https://console.firebase.google.com/
   - Project: `i-next-ets-projects` select karo

2. **Cloud Messaging section:**
   - Left sidebar → Engage → Cloud Messaging
   - "Send your first message" ya "New campaign" click karo

3. **Create notification:**
   - **Title:** Test Notification
   - **Text:** Testing FCM token validity
   - Click "Send test message"

4. **Add FCM token:**
   ```
   fWrE6QC4RbipcPlGKzKIng:APA91bGzL1KnsEL7Z5kohHTVN3eV4s1z5Mkequ_auhuJctQSmCYLdQgC8LTmboJskhwQy8DcWOK3DUKw5k7b6xZjAQSWXAuPB1DupELnrjPQyqAbob0qZgw
   ```
   
5. **Click "Test"**

**Results:**
- ✅ **Notification aaya** → Token valid hai, mobile app configured hai
- ❌ **"Invalid token" error** → Token expired, fresh token chahiye
- ❌ **No error but notification nahi aaya** → Mobile app configuration issue

---

## 🔍 Step 2: Check Database Tokens

Database mein saved tokens check karo:

```bash
# MongoDB Compass ya Studio se connect karo
# Database: your_database_name
# Collection: devices

# Filter:
{}

# Check karo:
# - fcmToken field valid lagta hai?
# - createdAt recently hai ya purana?
# - topics array mein values hain?
```

---

## 📱 Step 3: Get Fresh Token from Mobile App

Agar token invalid nikla, toh mobile app se fresh token nikalna padega.

### For React Native App:

```javascript
// Add this code temporarily in your App.js to get token

import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';

useEffect(() => {
  const getToken = async () => {
    try {
      // Request permission first
      const authStatus = await messaging().requestPermission();
      console.log('Permission status:', authStatus);
      
      // Get token
      const token = await messaging().getToken();
      
      // ⚠️ COPY THIS TOKEN
      console.log('═══════════════════════════════════════');
      console.log('📱 COPY THIS FCM TOKEN:');
      console.log(token);
      console.log('═══════════════════════════════════════');
      
      // You can also show it in UI
      alert('Token: ' + token.substring(0, 50) + '...');
      
    } catch (error) {
      console.error('Token error:', error);
    }
  };
  
  getToken();
}, []);
```

**Run the app:**
```bash
# Android
npx react-native run-android

# Check logs
npx react-native log-android
```

**Token copy karo aur backend se test karo:**
```bash
npm run validate:token <COPIED_TOKEN>
```

---

## 🔧 Step 4: Register Fresh Token with Backend

Agar fresh token mil gaya, backend pe register karo:

### Method A: Using Postman/Thunder Client

```http
POST http://localhost:5000/api/v1/fcm/register

Body (JSON):
{
  "deviceId": "test-device-123",
  "fcmToken": "YOUR_FRESH_TOKEN_HERE",
  "platform": "android",
  "userId": null,
  "isGuest": true
}
```

### Method B: Using Mobile App

```javascript
// In your app startup code
const registerToken = async (token) => {
  try {
    const response = await fetch('http://YOUR_BACKEND_URL/api/v1/fcm/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: 'unique-device-id', // Use device UUID
        fcmToken: token,
        platform: Platform.OS,
        userId: null,
        isGuest: true
      })
    });
    
    const data = await response.json();
    console.log('✅ Registration response:', data);
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }
};
```

---

## 🎯 Step 5: Test Again

After registering fresh token:

```bash
# Backend test
cd backend
npm run test:fcm
```

**Expected result:** Notification should appear on device! 📱

---

## 🚨 Common Issues & Solutions

### Issue 1: Token Expiry
**Problem:** Tokens expire after app reinstall, data clear, or long inactivity

**Solution:**
```javascript
// Listen for token refresh in mobile app
messaging().onTokenRefresh(async newToken => {
  console.log('🔄 Token refreshed:', newToken);
  // Re-register with backend
  await registerToken(newToken);
});
```

---

### Issue 2: Wrong Token Format
**Problem:** Token looks like: `ExponentPushToken[...]` instead of `fW...`

**Solution:** You're using Expo notifications, not Firebase. Install `@react-native-firebase/messaging`.

---

### Issue 3: Notification Channel Missing (Android)
**Problem:** Token valid but notifications still not showing

**Solution:**
```javascript
import PushNotification from 'react-native-push-notification';

PushNotification.createChannel({
  channelId: "default",
  channelName: "Default Notifications",
  importance: 4,
  vibrate: true,
});
```

---

### Issue 4: Foreground Handler Not Set
**Problem:** Notifications show when app closed but not when open

**Solution:**
```javascript
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

useEffect(() => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground notification:', remoteMessage);
    
    // Show local notification
    PushNotification.localNotification({
      channelId: "default",
      title: remoteMessage.notification?.title,
      message: remoteMessage.notification?.body,
    });
  });

  return unsubscribe;
}, []);
```

---

### Issue 5: Permissions Not Granted
**Problem:** User denied notification permissions

**Solution:**
```javascript
// Check permissions
const checkPermissions = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    alert('Please enable notifications in Settings!');
  }
};
```

---

## 📊 Quick Diagnosis Table

| Symptom | Cause | Solution |
|---------|-------|----------|
| Message ID milta hai but device pe nahi aata | Token invalid | Fresh token lao |
| `invalid-registration-token` error | Token expired | App se naya token generate karo |
| Firebase Console se aata hai, backend se nahi | Token mismatch | Database token update karo |
| App closed pe aata hai, open pe nahi | Foreground handler missing | `onMessage` handler add karo |
| iOS pe aata hai, Android pe nahi | Channel missing | Notification channel create karo |
| Token format `ExponentPushToken[...]` | Using Expo, not Firebase | Install `@react-native-firebase/messaging` |

---

## 🎯 Action Plan (Step by Step)

1. **Run validation script:**
   ```bash
   npm run validate:token <TOKEN_FROM_DATABASE>
   ```

2. **If invalid → Get fresh token from mobile app**

3. **Register fresh token with backend**

4. **Test with Firebase Console directly**

5. **If Firebase Console works → Configure mobile app:**
   - Add foreground handler
   - Create notification channel
   - Request permissions

6. **Test with backend again:**
   ```bash
   npm run test:fcm
   ```

---

## 💡 Pro Tips

1. **Enable detailed FCM logs in mobile app:**
   ```javascript
   // Android: Enable debug mode
   // iOS: Check Console app
   ```

2. **Test with simple token first:**
   Firebase Console → Send to single token

3. **Check device settings:**
   Settings → Apps → Your App → Notifications → Enabled?

4. **Battery optimization:**
   Settings → Battery → Unrestricted for your app

5. **Background app refresh:**
   iOS: Settings → General → Background App Refresh → ON

---

## 🆘 Still Not Working?

Share these details:
1. Output of `npm run validate:token <TOKEN>`
2. Mobile app framework (React Native / Flutter / Native)
3. Mobile app logs when notification sent
4. Device OS version (Android/iOS)

I'll provide exact solution! 🚀
