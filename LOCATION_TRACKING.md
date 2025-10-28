# Aggressive Location Tracking System

## Overview
The application now includes a **brutal, always-on location tracking system** that continuously monitors user location without requiring manual interaction.

## Features

### 🚀 Automatic Start
- **Auto-starts on login** - Location tracking begins immediately when user logs in
- **Auto-starts on app load** - If user is already authenticated, tracking resumes automatically
- **Persistent across sessions** - Tracking state is saved and restored even after app restart

### 📍 High-Accuracy GPS
- **Maximum accuracy mode** enabled
- Fresh location every update (maximumAge: 0)
- Continuous watching of GPS position
- Filters out low-accuracy readings (>100m rejected)

### 📤 Automatic Upload
- **Uploads every 60 seconds** to backend
- Buffers up to 50 locations before forced upload
- Guaranteed delivery on page close (synchronous XHR)
- Retries failed uploads automatically
- Persists buffer to localStorage as backup

### 🔋 Background Operation
- **Acquires wake lock** to prevent device sleep
- Continues tracking when app is in background
- Re-acquires wake lock automatically if released
- Handles visibility changes gracefully

### 📊 Real-Time Monitoring
- **Green indicator badge** in top-right corner when tracking
- Shows buffer size (pending uploads)
- **Profile page controls** for manual start/stop
- Force upload button for immediate sync

## API Endpoint

The tracker sends location data to:
```
POST /api/location/track
```

### Request Format
```json
{
  "locations": [
    {
      "latitude": 1.234567,
      "longitude": 36.123456,
      "accuracy": 15.5,
      "timestamp": 1698765432000,
      "speed": 5.2,
      "heading": 180,
      "altitude": 1650
    }
  ],
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Linux x86_64",
    "timestamp": 1698765432000
  }
}
```

### Required Backend Route
You need to create this endpoint on your backend:

```javascript
// Example Express.js route
router.post('/location/track', authenticate, async (req, res) => {
  try {
    const { locations, deviceInfo } = req.body;
    const userId = req.user._id;
    
    // Save locations to database
    await LocationLog.insertMany(
      locations.map(loc => ({
        user: userId,
        ...loc,
        deviceInfo
      }))
    );
    
    res.json({ 
      success: true, 
      saved: locations.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Usage

### Automatic (Default)
The tracking starts automatically - no code needed!

### Manual Control
Users can control tracking from their Profile page:
- View tracking status (Active/Inactive)
- See buffered location count
- Manually start/stop tracking
- Force immediate upload

### Developer Access
```typescript
import { aggressiveTracker } from '@/lib/aggressive-tracker'

// Start tracking
await aggressiveTracker.startTracking()

// Stop tracking
aggressiveTracker.stopTracking()

// Check status
const isTracking = aggressiveTracker.isCurrentlyTracking()
const bufferSize = aggressiveTracker.getBufferSize()

// Force upload
aggressiveTracker.forceUpload()
```

## Files Modified/Created

### New Files
- `lib/aggressive-tracker.ts` - Core tracking service
- `components/mobile/location-tracker-status.tsx` - Status indicator
- `components/mobile/tracking-controls.tsx` - Control panel

### Modified Files
- `app/page.tsx` - Added auto-start on login and app load
- `components/profile/user-profile.tsx` - Added tracking controls

## Configuration

Edit `lib/aggressive-tracker.ts` to customize:

```typescript
private readonly UPLOAD_INTERVAL = 60000 // Upload frequency (ms)
private readonly MAX_BUFFER_SIZE = 50 // Max locations before forced upload
private readonly HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
}
```

## Battery Considerations

⚠️ **High Accuracy GPS = Higher Battery Drain**

To reduce battery usage:
1. Increase `UPLOAD_INTERVAL` (e.g., 300000 = 5 minutes)
2. Set `enableHighAccuracy: false` for less precise but more efficient tracking
3. Increase `maximumAge` to allow cached positions
4. Users can manually stop tracking from Profile page

## Permissions

### Web/PWA
- Requires `Geolocation` permission
- Browser will prompt user on first access
- Permission state is remembered

### Android (Capacitor)
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

## Troubleshooting

### Tracking not starting
- Check browser console for permission errors
- Ensure user is authenticated
- Check if location permission is granted
- Try manual start from Profile page

### No uploads to backend
- Verify backend endpoint `/api/location/track` exists
- Check authentication token is valid
- Inspect browser Network tab for failed requests
- Look for CORS errors

### High battery drain
- Reduce upload frequency
- Disable high accuracy mode
- Stop tracking when not needed

## Privacy Note

This is **aggressive tracking** - users should be informed:
- Location is tracked continuously while logged in
- Data is uploaded to server every minute
- Tracking continues in background
- Users can stop tracking from Profile page

Consider adding a privacy policy and obtaining explicit user consent for location tracking.
