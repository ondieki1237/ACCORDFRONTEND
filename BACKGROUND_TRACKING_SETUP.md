# Background Location Tracking Setup

## Install Required Plugin

Run this command to install the background geolocation plugin:

```bash
npm install @capacitor-community/background-geolocation
npx cap sync
```

## What This Enables

### True Background Tracking
- ✅ Tracks location even when app is **completely closed**
- ✅ Tracks when device is **locked/screen off**
- ✅ Tracks when app is **not started**
- ✅ Starts automatically on **device boot**
- ✅ Continues tracking 24/7 as long as device is on

### How It Works
1. **Native Android Service** - Runs as a foreground service with persistent notification
2. **Boot Receiver** - Automatically starts tracking when device boots
3. **Battery Optimized** - Uses Android's fused location provider
4. **Offline Support** - Stores locations locally, syncs when online

## Configuration Required

### 1. Update package.json

Add to dependencies:
```json
{
  "dependencies": {
    "@capacitor-community/background-geolocation": "^2.0.0"
  }
}
```

### 2. Update Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Location Permissions -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    
    <!-- Required for background tracking -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Internet for syncing -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application>
        <!-- Your existing config -->
        
        <!-- Boot Receiver - Start tracking on device boot -->
        <receiver 
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>
        
        <!-- Background Location Service -->
        <service
            android:name="com.transistorsoft.locationmanager.service.TrackingService"
            android:foregroundServiceType="location"
            android:enabled="true"
            android:exported="false" />
            
    </application>
</manifest>
```

### 3. Gradle Configuration

Edit `android/app/build.gradle`:

```gradle
android {
    // ... existing config
    
    defaultConfig {
        // ... existing config
        
        // Required for background location
        minSdkVersion 23
        targetSdkVersion 34
    }
}

dependencies {
    // ... existing dependencies
    
    // Background geolocation (added automatically by plugin)
}
```

### 4. Proguard Rules (if using)

Edit `android/app/proguard-rules.pro`:

```proguard
# Background Geolocation
-keep class com.transistorsoft.** { *; }
-dontwarn com.transistorsoft.**
```

## Testing

### 1. Build and Install
```bash
npm install @capacitor-community/background-geolocation
npx cap sync
npx cap open android
```

Build and install the APK on your device.

### 2. Grant Permissions
When the app first runs, it will request:
- Location permission
- Background location permission (Android 10+)
- Notification permission (Android 13+)

**Important:** On Android 10+, you must grant "Allow all the time" for background tracking.

### 3. Test Background Tracking
1. Open the app and login
2. Close the app completely (swipe away from recent apps)
3. Check notification bar - you should see "Location tracking active"
4. Move around with your device
5. Reboot the device
6. Background tracking should continue automatically

### 4. Verify Data Upload
Check your backend logs:
- Locations should upload every 60 seconds
- Even when app is closed
- Even after device reboot

## Battery Impact

### Optimized Settings (Recommended)
- **Update interval:** 60 seconds (battery friendly)
- **Distance filter:** 10 meters (reduces redundant updates)
- **Activity type:** AutomotiveNavigation (for driving)

### High Accuracy (Battery Intensive)
- **Update interval:** 10 seconds
- **Distance filter:** 5 meters
- **Activity type:** Fitness (for walking/running)

## Troubleshooting

### Tracking Stops After Some Time
- Check if battery optimization is disabled for your app
- Settings > Apps > Your App > Battery > Unrestricted

### Not Starting on Boot
- Ensure RECEIVE_BOOT_COMPLETED permission is granted
- Check if app has "Autostart" permission (some manufacturers)

### High Battery Drain
- Increase update interval (90-120 seconds)
- Increase distance filter (20-50 meters)
- Use ActivityType.Other instead of Fitness

### Locations Not Uploading
- Check internet connection
- Verify backend endpoint is accessible
- Check app logs for errors

## Notification

When background tracking is active, Android requires a persistent notification. This ensures the user knows location is being tracked.

The notification shows:
- Title: "Location Tracking Active"
- Message: "ACCORD is tracking your location in the background"
- Icon: Your app icon
- Cannot be dismissed (by design for security)

## Privacy Compliance

⚠️ **Important:** Background location tracking has privacy implications.

**Required:**
1. Clear privacy policy explaining location tracking
2. User consent before enabling tracking
3. Ability to opt-out/disable tracking
4. Transparent notification when tracking is active
5. Data retention policies

**Recommended:**
1. In-app explanation of why location is needed
2. Option to view collected location data
3. Ability to delete historical data
4. Regular reminders that tracking is active

## Summary

After setup, your app will:
- ✅ Track location 24/7 when device is on
- ✅ Continue tracking when app is closed
- ✅ Resume tracking after device reboot
- ✅ Store locations offline, sync when online
- ✅ Show persistent notification (required by Android)
- ✅ Optimize for battery life

This is true background tracking - the app doesn't need to be running!
