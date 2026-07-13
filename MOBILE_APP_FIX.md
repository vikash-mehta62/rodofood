# 📱 Mobile App - Push Notification Fix Guide

## ✅ Backend Status: WORKING PERFECTLY!

Test results show notifications are being sent successfully:
```
✅ Success! Message ID: projects/i-next-ets-projects/messages/...
```

**Problem ab device/app side pe hai, backend nahi!**

---

## 🔍 Device Side Issues & Solutions

### Issue 1: App Foreground Notifications Not Showing

**Problem:** Jab app open hai, notification nahi dikhta

**Solution:** Foreground message handler add karo

#### React Native (Expo):
```javascript
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen to foreground notifications
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('🔔 Notification received in foreground:', notification);
    // Show alert or custom UI
  });

  return () => subscription.remove();
}, []);
```

#### React Native (with @react-native-firebase/messaging):
```javascript
import messaging from '@react-native-firebase/messaging';

useEffect(() => {
  // Foreground message handler
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('🔔 Foreground notification:', remoteMessage);
    
    // Show local notification
    await messaging().displayNotification({
      title: remoteMessage.notification.title,
      body: remoteMessage.notification.body,
    });
  });

  return unsubscribe;
}, []);
```

#### Flutter:
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('🔔 Foreground notification: ${message.notification?.title}');
  
  // Show local notification
  if (message.notification != null) {
    showNotification(
      title: message.notification!.title!,
      body: message.notification!.body!,
    );
  }
});
```

---

### Issue 2: Android Notification Channel Missing

**Problem:** Android 8.0+ pe notification channel create nahi kiya

**Solution:**

#### React Native:
```javascript
import PushNotification from 'react-native-push-notification';

// Create notification channel
PushNotification.createChannel(
  {
    channelId: "default", // Must match backend channelId
    channelName: "Default Notifications",
    channelDescription: "Default notification channel",
    playSound: true,
    soundName: "default",
    importance: 4, // HIGH
    vibrate: true,
  },
  (created) => console.log(`Channel created: ${created}`)
);
```

#### Flutter:
```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// Create channel
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'default', // Must match backend channelId
  'Default Notifications',
  description: 'Default notification channel',
  importance: Importance.high,
  playSound: true,
);

await flutterLocalNotificationsPlugin
    .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()
    ?.createNotificationChannel(channel);
```

---

### Issue 3: FCM Token Expired

**Problem:** Token purana ho gaya ya invalid hai

**Solution:** Token refresh karo

#### React Native:
```javascript
import messaging from '@react-native-firebase/messaging';

// Get fresh token
const getToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('📱 FCM Token:', token);
    
    // Send to backend
    await fetch('http://YOUR_BACKEND/api/v1/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'unique-device-id',
        fcmToken: token,
        platform: Platform.OS,
        userId: currentUserId, // if logged in
      })
    });
  } catch (error) {
    console.error('❌ Token error:', error);
  }
};

// Listen for token refresh
messaging().onTokenRefresh(token => {
  console.log('🔄 Token refreshed:', token);
  // Re-register with backend
  registerTokenWithBackend(token);
});
```

#### Flutter:
```dart
// Get token
String? token = await FirebaseMessaging.instance.getToken();
print('📱 FCM Token: $token');

// Register with backend
await registerToken(token);

// Listen for token refresh
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  print('🔄 Token refreshed: $newToken');
  registerToken(newToken);
});
```

---

### Issue 4: Permissions Not Granted

**Problem:** User ne notification permission deny kar diya

**Solution:** Permission check aur request karo

#### React Native:
```javascript
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      console.log('🔔 Permission:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    console.log('🔔 iOS Permission:', enabled);
    return enabled;
  }
};
```

#### Flutter:
```dart
// Request permission
FirebaseMessaging messaging = FirebaseMessaging.instance;

NotificationSettings settings = await messaging.requestPermission(
  alert: true,
  announcement: false,
  badge: true,
  carPlay: false,
  criticalAlert: false,
  provisional: false,
  sound: true,
);

print('🔔 Permission status: ${settings.authorizationStatus}');

if (settings.authorizationStatus == AuthorizationStatus.authorized) {
  print('✅ User granted permission');
} else {
  print('❌ User declined permission');
}
```

---

### Issue 5: Background Message Handler Not Set

**Problem:** Background/Killed state mein notifications handle nahi ho rahe

**Solution:**

#### React Native:
```javascript
import messaging from '@react-native-firebase/messaging';

// Background message handler (outside component)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔔 Background notification:', remoteMessage);
  // Process notification data
});
```

#### Flutter:
```dart
// Top-level function (outside class)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('🔔 Background notification: ${message.messageId}');
}

// In main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Set background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}
```

---

## 📱 Complete Implementation Example

### React Native (Complete Setup):

```javascript
// App.js or NotificationService.js
import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';

// 1. Create notification channel
PushNotification.createChannel({
  channelId: "default",
  channelName: "Default Notifications",
  importance: 4,
  vibrate: true,
});

// 2. Background handler (top level)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔔 Background:', remoteMessage);
});

const NotificationService = () => {
  useEffect(() => {
    // 3. Request permissions
    const requestPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      } else if (Platform.OS === 'ios') {
        await messaging().requestPermission();
      }
    };

    // 4. Get and register token
    const registerToken = async () => {
      const token = await messaging().getToken();
      console.log('📱 FCM Token:', token);
      
      // Send to backend
      await fetch('http://YOUR_BACKEND/api/v1/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'device-id',
          fcmToken: token,
          platform: Platform.OS,
        })
      });
    };

    // 5. Foreground handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('🔔 Foreground:', remoteMessage);
      
      // Show local notification
      PushNotification.localNotification({
        channelId: "default",
        title: remoteMessage.notification?.title,
        message: remoteMessage.notification?.body,
        playSound: true,
        soundName: 'default',
      });
    });

    // 6. Token refresh
    const unsubscribeRefresh = messaging().onTokenRefresh(token => {
      console.log('🔄 Token refreshed:', token);
      // Re-register
    });

    // Initialize
    requestPermission();
    registerToken();

    return () => {
      unsubscribe();
      unsubscribeRefresh();
    };
  }, []);

  return null;
};

export default NotificationService;
```

---

## 🔧 Testing Checklist

### Device Settings:
- ✅ Notifications enabled in device settings
- ✅ App notification permission granted
- ✅ Battery optimization disabled for app
- ✅ Data/WiFi connected

### App Code:
- ✅ Notification channel created (Android)
- ✅ Foreground handler implemented
- ✅ Background handler set
- ✅ Token registered with backend
- ✅ Permissions requested

### Backend (Already Working ✅):
- ✅ Firebase Admin initialized
- ✅ Notifications sending successfully
- ✅ Message format correct

---

## 🎯 Quick Debug Steps

1. **Check device settings:**
   - Settings → Apps → RodoFood → Notifications → Enable

2. **Check app logs:**
   ```bash
   # Android
   npx react-native log-android
   
   # iOS
   npx react-native log-ios
   ```

3. **Test with Firebase Console:**
   - Go to Firebase Console
   - Cloud Messaging → Send test message
   - Use your FCM token directly

4. **Verify token validity:**
   - Copy token from app logs
   - Send test from backend
   - Check if message ID is generated

---

## 💡 Common Issues

| Issue | Solution |
|-------|----------|
| Foreground nahi dikhta | Add onMessage handler + local notification |
| Background nahi aata | Set setBackgroundMessageHandler |
| Channel error | Create notification channel with ID "default" |
| Permission denied | Request at app start, show explanation |
| Token invalid | Refresh token, re-register with backend |

---

## 📞 Need More Help?

1. **Share app logs** - `npx react-native log-android`
2. **Test from Firebase Console** directly
3. **Check device notification settings**
4. **Verify FCM token is current**

Backend is **100% working** ✅ - ab sirf mobile app mein implement karna hai! 🚀
