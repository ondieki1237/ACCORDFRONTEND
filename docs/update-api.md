# Internal App Update System - Quick Start

**Status:** ✅ Ready to use (APK Download & Install)

---

## How It Works (Simple)

1. **App starts** → Calls `/api/app-updates/check`
2. **Server responds** → "Update available? Yes/No" with download URL
3. **If yes** → App shows update dialog
4. **User clicks Download** → APK downloads with progress
5. **APK saved** → Native installer triggered
6. **User installs** → App updates!

---

## APK Location on Backend

The APK file should be served from:
```
https://app.codewithseth.co.ke/downloads/app-debug.apk
```

---

## API Endpoint

**Check for Update:**
```
POST /api/app-updates/check
Content-Type: application/json

{
  "role": "sales",           // Required
  "platform": "android",     // Required: android, ios, web
  "currentVersion": "1.0.0"  // Optional: current app version
}
```

**Response:**
```json
{
  "success": true,
  "updateAvailable": false
}
```

Or if update available:
```json
{
  "success": true,
  "updateAvailable": true,
  "update": {
    "version": "1.1.0",
    "releaseNotes": "Bug fixes and improvements",
    "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-debug.apk",
    "updateMethod": "apk",
    "forced": false
  }
}
```

---

## Create an Update (Admin Only)

**Request:**
```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.1.0",
    "platform": "android",
    "targetRoles": ["sales"],
    "releaseNotes": "Bug fixes and new features",
    "downloadUrl": "https://app.codewithseth.co.ke/downloads/app-debug.apk",
    "updateMethod": "apk",
    "forced": false,
    "isActive": true
  }'
```

---

## Update Flow

### Step 1: User sees update prompt
- Version number displayed
- Release notes shown
- "Download & Install" button

### Step 2: Download with progress
- Progress bar shows download %
- File saved to app cache

### Step 3: Install triggered
- Android package installer opens
- User confirms installation
- App restarts with new version

---

## Android Permissions Required

The app needs these permissions in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
```

The `REQUEST_INSTALL_PACKAGES` permission allows the app to trigger the Android package installer.

---

## Native Plugin

A custom Capacitor plugin `AppUpdaterPlugin` handles:
- Checking if install permission is granted
- Opening permission settings if needed
- Triggering the APK installer with FileProvider

Location: `android/app/src/main/java/com/ACCORD/business/AppUpdaterPlugin.java`

---

## Forced Updates

```json
{
  "forced": true,
  "version": "2.0.0",
  "releaseNotes": "Critical security update"
}
```

When `forced: true`:
- User cannot dismiss the dialog
- Must update to continue using the app

---

## Mobile App Code

### Simple Check (React Native)
```javascript
const checkForUpdate = async () => {
  const response = await fetch('https://app.codewithseth.co.ke/api/app-updates/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'sales',
      platform: 'android',
      currentVersion: '1.0.0'
    })
  });

  const data = await response.json();

  if (data.updateAvailable) {
    if (data.update.forced) {
      showBlockingModal(data.update);
    } else {
      showUpdatePrompt(data.update);
    }
  }
};

const showUpdatePrompt = (update) => {
  Alert.alert(
    'Update Available',
    update.releaseNotes,
    [
      { text: 'Later', onPress: () => {} },
      { text: 'Update Now', onPress: () => {
        if (update.requiresRestart) {
          Alert.alert('Restart', 'Please restart the app');
        }
      }}
    ]
  );
};
```

---

## What Changed

| Before | After |
|--------|-------|
| Had to download APK | No download needed |
| External URLs | Internal API |
| Slow updates | Fast updates |
| Complex setup | Simple setup |

---

## Admin API Endpoints

```
GET  /api/app-updates              List updates
POST /api/app-updates              Create update
GET  /api/app-updates/:id          Get update
PUT  /api/app-updates/:id          Edit update
DELETE /api/app-updates/:id        Delete update
```

All require: `authenticate` + `authorize('admin')`

---

## Test It Now

```bash
# Check for updates (public endpoint - no auth needed)
curl -X POST https://app.codewithseth.co.ke/api/app-updates/check \
  -H "Content-Type: application/json" \
  -d '{"role":"sales","platform":"android","currentVersion":"1.0.0"}'

# Should return:
# {"success":true,"updateAvailable":false}
# or
# {"success":true,"updateAvailable":true,"update":{...}}
```

---

## Key Points

✅ App downloads APK from backend server  
✅ Progress bar shows download status  
✅ Native installer handles installation  
✅ **Forced updates** block app usage until installed  
✅ Version tracking prevents re-prompting after install  
✅ Works offline-first (checks on app start)  

---

## Files Modified

### Frontend
- `components/update/UpdateChecker.tsx` - Download & install UI
- `package.json` - Added `@capacitor/filesystem`

### Android Native
- `AndroidManifest.xml` - Added `REQUEST_INSTALL_PACKAGES` permission
- `AppUpdaterPlugin.java` - Native plugin for APK installation
- `MainActivity.java` - Registers the plugin

### Backend
- `/downloads/app-debug.apk` - The APK file to serve
- `/api/app-updates/check` - Returns update info with `downloadUrl`

---

## Admin API Endpoints

```
GET  /api/app-updates              List updates
POST /api/app-updates              Create update
GET  /api/app-updates/:id          Get update
PUT  /api/app-updates/:id          Edit update
DELETE /api/app-updates/:id        Delete update
```

All require: `authenticate` + `authorize('admin')`

---

**Ready to use!** Build the APK and deploy to test the update flow.
