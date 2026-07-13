# 📱 Mobile App - Push Notification Debug Checklist

## ✅ Backend Status: PERFECT!

Backend successfully sending notifications:
- ✅ Direct token: Working
- ✅ Topic (all_restaurants): Working  
- ✅ Topic (all_users): Working
- ✅ Message IDs generated
- ✅ No errors

**Problem is 100% on mobile app side!**

---

## 🔍 Issue Diagnosis

### Test 1: Check Mobile App Logs

```bash
# React Native Android
npx react-native log-android

# React Native iOS
npx react-native log-ios

# Flutter
flutter logs
```

**Look for:**
```
📱 FOREGROUND NOTIFICATION RECEIVED
Notification: ...
```

**If you see this:**
- ✅ Notification received by app
- ❌ Not displayed (display logic issue)

**If you DON'T see this:**
- ❌ App not receiving FCM messages
- ❌ FCM not properly configured

---

## 🔧 Fix: React Native

### Step 1: Check Firebase Setup

```javascript
// Check if Firebase is initialized
import messaging from '@react-native-firebase/messaging';

async function checkSetup() {
  try {
    const token = await messaging().getToken();
    console.log('✅ FCM Token:', token);
    
    const authStatus = await messaging().hasPermission();
    console.log('✅ Permission:', authStatus);
    
    return true;
  } catch (error) {
    console.error('❌ FCM Setup Error:', error);
    return false;
  }
}
```

---

### Step 2: Add Foreground Handler

```javascript
// App.js or main component
import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

function App() {
  useEffect(() => {
    // Create notification channel (Android)
    async function createChannel() {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    }
    createChannel();

    // Foreground message handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 FOREGROUND NOTIFICATION RECEIVED');
      console.log('Title:', remoteMessage.notification?.title);
      console.log('Body:', remoteMessage.notification?.body);
      console.log('Data:', remoteMessage.data);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Display notification
      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    return unsubscribe;
  }, []);

  return <YourApp />;
}
```

---

### Step 3: Add Background Handler

```javascript
// index.js (TOP OF FILE, before AppRegistry)
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📱 Background notification:', remoteMessage);
});

// Then your normal AppRegistry code
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

---

### Step 4: Request Permissions

```javascript
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

async function requestNotificationPermission() {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('❌ Notification permission denied');
          return false;
        }
      }
    }
    
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('❌ iOS notification permission denied');
        return false;
      }
    }
    
    console.log('✅ Notification permission granted');
    return true;
  } catch (error) {
    console.error('❌ Permission request error:', error);
    return false;
  }
}
```

---

## 🔧 Fix: Flutter

### Step 1: Setup Firebase Messaging

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Background handler (top-level function)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('📱 Background notification: ${message.messageId}');
}

// In main()
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}
```

---

### Step 2: Foreground Handler

```dart
class _MyAppState extends State<MyApp> {
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  @override
  void initState() {
    super.initState();
    
    // Initialize local notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    final InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);
    
    flutterLocalNotificationsPlugin.initialize(initializationSettings);
    
    // Create channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'default',
      'Default Notifications',
      importance: Importance.high,
    );
    
    flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
    
    // Foreground handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      print('📱 FOREGROUND NOTIFICATION RECEIVED');
      print('Title: ${message.notification?.title}');
      print('Body: ${message.notification?.body}');
      print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Display notification
      if (message.notification != null) {
        flutterLocalNotificationsPlugin.show(
          message.hashCode,
          message.notification!.title,
          message.notification!.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              'default',
              'Default Notifications',
              importance: Importance.high,
              priority: Priority.high,
            ),
          ),
        );
      }
    });
  }
}
```

---

## 📋 Quick Checklist

| Item | Status | How to Fix |
|------|--------|------------|
| Firebase initialized | ❓ | Check token generation works |
| Permissions granted | ❓ | Request in app startup |
| Notification channel created | ❓ | Create with id "default" |
| Foreground handler set | ❓ | Add `onMessage` listener |
| Background handler set | ❓ | Add `setBackgroundMessageHandler` |
| App in foreground | ❓ | Keep app open while testing |
| Device notifications enabled | ❓ | Check Settings → Apps → Notifications |
| Battery optimization off | ❓ | Settings → Battery → Unrestricted |

---

## 🧪 Test Steps

### 1. Add Logging

Add comprehensive logs in mobile app to see what's happening.

### 2. Test App State

- **Foreground (app open):** Should show via `onMessage` handler
- **Background (app minimized):** Should show system notification
- **Killed (app closed):** Should show system notification

### 3. Check Device Settings

- Settings → Apps → Your App → Notifications → ON
- Settings → Battery → Your App → Unrestricted
- Do Not Disturb → OFF

---

## 💡 Common Mistakes

### 1. Missing Notification Channel (Android)
```javascript
// MUST create channel with id "default"
await notifee.createChannel({
  id: 'default', // Backend sends this channelId
  name: 'Default Notifications',
  importance: AndroidImportance.HIGH,
});
```

### 2. Not Displaying Foreground Notifications
```javascript
// Backend sends notification
// But app doesn't display it!

// FIX: Add display logic in onMessage
messaging().onMessage(async (message) => {
  // Display using notifee or local notifications
  await notifee.displayNotification({ ... });
});
```

### 3. Background Handler Not Set
```javascript
// index.js - MUST be at TOP before AppRegistry
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification');
});
```

---

## 🆘 Still Not Working?

Share these logs:

```bash
# Mobile app logs
npx react-native log-android > mobile-logs.txt

# Share:
# 1. mobile-logs.txt
# 2. Are you seeing "FOREGROUND NOTIFICATION RECEIVED"?
# 3. Any errors in logs?
# 4. App state when testing (foreground/background/killed)?
```

---

## ✅ Success Criteria

When working properly, you'll see in mobile logs:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 FOREGROUND NOTIFICATION RECEIVED
Title: 🎯 Direct Token Test
Body: Direct notification to vendor device!
Data: { type: 'direct', timestamp: '...' }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

AND notification will appear on device! 📱✅
