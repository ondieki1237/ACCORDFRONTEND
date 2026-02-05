# ACCORD App Update System

**Date:** February 5, 2026  
**Status:** ✅ FULLY ALIGNED - Frontend matches Backend

---

## Overview

The ACCORD mobile app checks for updates from the backend server and downloads/installs new APK versions directly within the app.

---

## Update Flow

```
┌─────────────────┐   POST /api/app-updates/check   ┌─────────────────┐
│   ACCORD App    │ ────────────────────────────────▶│    Backend      │
│   (Frontend)    │                                  │    Server       │
└────────┬────────┘                                  └────────┬────────┘
         │                                                    │
         │◀─── JSON: updateAvailable, versionName, apkUrl ────│
         │                                                    │
    ┌────▼────┐                                               │
    │ Compare │                                               │
    │ versions│                                               │
    └────┬────┘                                               │
         │                                                    │
    (if updateAvailable)                                      │
         │                                                    │
         │       GET /downloads/app-release.apk              │
         │───────────────────────────────────────────────────▶│
         │                                                    │
         │◀──────────── APK Binary Stream ────────────────────│
         │                                                    │
    ┌────▼────┐                                            
    │ Download│                                            
    │ & Save  │                                            
    └────┬────┘                                            
         │                                                 
    ┌────▼────┐                                            
    │ Install │                                            
    │   APK   │                                            
    └─────────┘                                            
```

---

## Backend API (Already Implemented)

### Version Check Endpoint

**Endpoint:** `POST /api/app-updates/check`

**Request Body:**
```json
{
  "role": "sales",
  "platform": "android",
  "currentVersion": "1.1.0"
}
```

**Response:**
```json
{
  "updateAvailable": true,
  "update": {
    "versionCode": 120,
    "versionName": "1.2.0",
    "apkUrl": "https://app.codewithseth.co.ke/downloads/app-release.apk",
    "forceUpdate": false,
    "changelog": "Bug fixes and improvements"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `updateAvailable` | boolean | Whether an update is available |
| `update.versionCode` | number | Numeric version code (e.g., 120) |
| `update.versionName` | string | Semantic version (e.g., "1.2.0") |
| `update.apkUrl` | string | Full URL to download the APK |
| `update.forceUpdate` | boolean | If true, user cannot dismiss update |
| `update.changelog` | string | Release notes text |

### APK Download Endpoint

**Endpoint:** `GET /downloads/app-release.apk`

**Requirements:**
- Serve the APK file with proper headers
- Support `Content-Length` header (required for progress tracking)
- Content-Type: `application/vnd.android.package-archive`

---

## Frontend Implementation

### Components

| File | Purpose |
|------|---------|
| `components/update/UpdateChecker.tsx` | Main update UI component |
| `android/.../AppUpdaterPlugin.java` | Native APK installer plugin |

### Update Check Trigger

- Runs on app startup (inside `MobileLayout`)
- Sends POST request with `role`, `platform`, `currentVersion`
- Shows update dialog if `updateAvailable: true`

### Field Mapping (Frontend ↔ Backend)

| Frontend Uses | Backend Returns | Status |
|---------------|-----------------|--------|
| `versionName` | `versionName` | ✅ Aligned |
| `apkUrl` | `apkUrl` | ✅ Aligned |
| `changelog` | `changelog` | ✅ Aligned |
| `forceUpdate` | `forceUpdate` | ✅ Aligned |
| `versionCode` | `versionCode` | ✅ Aligned |

### Download Process

1. Fetch APK with progress tracking via `ReadableStream`
2. Save to device cache using `@capacitor/filesystem`
3. Trigger native Android installer via custom plugin

### Version Tracking

- `localStorage` stores the last applied version (`versionName`)
- Prevents re-prompting after user installs update
- `sessionStorage` tracks dismissed versions (non-forced only)

---

## Android Native Plugin

### AppUpdaterPlugin.java

Located at: `android/app/src/main/java/com/ACCORD/business/AppUpdaterPlugin.java`

**Methods:**
| Method | Description |
|--------|-------------|
| `installApk(path)` | Triggers Android APK installer |
| `canInstallApk()` | Checks if app has install permission |
| `openInstallPermissionSettings()` | Opens Android settings for install permission |

### Required Permissions

```xml
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

---

## Release Process

### To Release a New Version:

1. **Build new APK:**
   ```bash
   ./build-apk.sh
   ```

2. **Upload APK to backend:**
   ```bash
   cp android/app/build/outputs/apk/debug/app-debug.apk /path/to/backend/downloads/app-release.apk
   ```

3. **Update backend version:**
   - Increment `versionCode` and `versionName` in backend config
   - Update `changelog` with release notes

4. **Users see update:**
   - On next app launch, update dialog appears
   - User taps "Download & Install"
   - APK downloads with progress bar
   - Android installer opens

---

## Testing

### Test Update Check:
```bash
curl -X POST https://app.codewithseth.co.ke/api/app-updates/check \
  -H "Content-Type: application/json" \
  -d '{"role":"sales","platform":"android","currentVersion":"1.0.0"}'
```

### Expected Response:
```json
{
  "updateAvailable": true,
  "update": {
    "versionCode": 120,
    "versionName": "1.2.0",
    "apkUrl": "https://app.codewithseth.co.ke/downloads/app-release.apk",
    "forceUpdate": false,
    "changelog": "Bug fixes and improvements"
  }
}
```

### Test APK Download:
```bash
curl -I https://app.codewithseth.co.ke/downloads/app-release.apk
# Should show: Content-Type: application/vnd.android.package-archive
# Should show: Content-Length: <file size>
```

---

## Summary

| Component | Status |
|-----------|--------|
| Backend endpoint | ✅ `/api/app-updates/check` implemented |
| APK download route | ✅ `/downloads/app-release.apk` works |
| Frontend UpdateChecker | ✅ Aligned with backend field names |
| Native APK installer | ✅ AppUpdaterPlugin implemented |
| Progress tracking | ✅ Uses ReadableStream + Content-Length |
| Force update support | ✅ `forceUpdate` field supported |

**Status:** ✅ Fully aligned and ready for production
