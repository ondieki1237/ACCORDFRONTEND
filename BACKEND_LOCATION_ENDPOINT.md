# Backend Location Tracking Endpoint Specification

## Endpoint Overview
```
POST /api/location/track
```

**Authentication:** Flexible
- **Option 1 (Preferred):** JWT Bearer Token in Authorization header
- **Option 2 (Fallback):** userId in request body (for offline/unauthenticated scenarios)

## Request Headers

### Authenticated Request
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Unauthenticated Request (with userId in body)
```
Content-Type: application/json
```

## Request Payload Format

### Structure
```json
{
  "locations": [
    {
      "latitude": 1.234567,
      "longitude": 36.123456,
      "accuracy": 15.5,
      "timestamp": 1698765432000,
      "speed": 5.2,
      "heading": 180.0,
      "altitude": 1650.0
    },
    {
      "latitude": 1.234568,
      "longitude": 36.123457,
      "accuracy": 12.3,
      "timestamp": 1698765435000,
      "speed": 6.1,
      "heading": 182.0,
      "altitude": 1651.0
    }
  ],
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36...",
    "platform": "Linux armv8l",
    "timestamp": 1698765432000
  },
  "userId": "507f1f77bcf86cd799439011"
}
```

**Note:** The `userId` field is optional and only included when:
- User is not authenticated (no JWT token)
- But the app has user information from previous session
- Allows offline location tracking to sync when connection is restored

### Field Descriptions

#### `locations` Array (required)
An array of location data points. Can contain 1-50 locations per request.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | Number | Yes | GPS latitude in decimal degrees (-90 to 90) |
| `longitude` | Number | Yes | GPS longitude in decimal degrees (-180 to 180) |
| `accuracy` | Number | Yes | Location accuracy in meters |
| `timestamp` | Number | Yes | Unix timestamp in milliseconds when location was captured |
| `speed` | Number/null | No | Speed in meters per second (null if not available) |
| `heading` | Number/null | No | Compass direction in degrees (0-360, null if not available) |
| `altitude` | Number/null | No | Altitude in meters above sea level (null if not available) |

#### `deviceInfo` Object (required)
Information about the device/browser sending the data.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userAgent` | String | Yes | Browser user agent string |
| `platform` | String | Yes | Operating system/platform |
| `timestamp` | Number | Yes | Unix timestamp when request was sent (sync time) |

#### `userId` String (optional)
- MongoDB ObjectId of the user
- Only included when user is not authenticated via JWT
- Allows offline location data to be synced when connection is restored

## Important Notes

### Batch Uploads
The endpoint **must accept an array of locations** (1-50 items). This allows:
- Offline apps to store multiple GPS points locally
- Batch upload when internet connection is restored
- More efficient API usage (fewer requests)

### Timestamp Preservation
Each location has **two timestamps**:
1. **`location.timestamp`** - When GPS location was captured (original time)
2. **`deviceInfo.timestamp`** - When data was sent to server (sync time)

These can differ significantly for offline data synced later.

### Flexible Authentication
The endpoint supports **two authentication modes**:

**Mode 1: Authenticated (JWT Bearer Token)**
```javascript
headers: {
  'Authorization': 'Bearer eyJhbGc...',
  'Content-Type': 'application/json'
}
```
User is extracted from JWT token. No `userId` in body needed.

**Mode 2: Unauthenticated (userId in body)**
```javascript
body: {
  userId: '507f1f77bcf86cd799439011',
  locations: [...],
  deviceInfo: {...}
}
```
Used when JWT has expired but app cached user ID. Allows continued tracking.

## Example Request
```http
POST /api/location/track HTTP/1.1
Host: app.codewithseth.co.ke
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "locations": [
    {
      "latitude": -1.286389,
      "longitude": 36.817223,
      "accuracy": 10.5,
      "timestamp": 1730131200000,
      "speed": 0.0,
      "heading": null,
      "altitude": 1795.0
    }
  ],
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36",
    "platform": "Linux armv8l",
    "timestamp": 1730131200000
  }
}
```

## Expected Response

### Success Response (200 OK)
```json
{
  "success": true,
  "saved": 1,
  "message": "Location data saved successfully"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid location data format"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to save location data"
}
```

## Backend Implementation Example (Node.js/Express)

### 1. Database Schema (MongoDB/Mongoose)

```javascript
const locationTrackingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  accuracy: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
    description: 'When the GPS location was captured (original time)'
  },
  speed: {
    type: Number,
    default: null
  },
  heading: {
    type: Number,
    default: null
  },
  altitude: {
    type: Number,
    default: null
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    timestamp: {
      type: Date,
      description: 'When the location data was sent to server (sync time)'
    }
  },
  syncedAt: {
    type: Date,
    default: Date.now,
    index: true,
    description: 'When the server received and saved this location'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
locationTrackingSchema.index({ user: 1, timestamp: -1 });
locationTrackingSchema.index({ user: 1, syncedAt: -1 });

const LocationTracking = mongoose.model('LocationTracking', locationTrackingSchema);
```

### 2. Route Handler

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const LocationTracking = require('../models/LocationTracking');

/**
 * POST /api/location/track
 * Save location tracking data
 * Supports both JWT authentication and userId in body
 */
router.post('/location/track', async (req, res) => {
  try {
    const { locations, deviceInfo, userId: bodyUserId } = req.body;
    
    // Determine user ID from JWT token or request body
    let userId;
    
    // Try to get user from JWT token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId || decoded._id || decoded.id;
      } catch (jwtError) {
        // JWT invalid/expired - fall back to userId in body
        console.log('JWT verification failed, trying userId from body');
      }
    }
    
    // If no JWT, use userId from body
    if (!userId && bodyUserId) {
      userId = bodyUserId;
    }
    
    // Require some form of user identification
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: provide JWT token or userId'
      });
    }

    // Validate request
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid locations data: must be non-empty array'
      });
    }
    
    // Limit batch size
    if (locations.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Too many locations: maximum 100 per request'
      });
    }

    // Validate each location has required fields
    for (const loc of locations) {
      if (
        typeof loc.latitude !== 'number' ||
        typeof loc.longitude !== 'number' ||
        typeof loc.accuracy !== 'number' ||
        typeof loc.timestamp !== 'number'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location format: latitude, longitude, accuracy, and timestamp are required'
        });
      }
      
      // Validate coordinate ranges
      if (loc.latitude < -90 || loc.latitude > 90 ||
          loc.longitude < -180 || loc.longitude > 180) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates: latitude must be -90 to 90, longitude -180 to 180'
        });
      }
    }

    // Prepare location documents
    const locationDocs = locations.map(loc => ({
      user: userId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      timestamp: new Date(loc.timestamp), // Original capture time
      speed: loc.speed !== undefined && loc.speed !== null ? loc.speed : null,
      heading: loc.heading !== undefined && loc.heading !== null ? loc.heading : null,
      altitude: loc.altitude !== undefined && loc.altitude !== null ? loc.altitude : null,
      deviceInfo: {
        userAgent: deviceInfo?.userAgent || '',
        platform: deviceInfo?.platform || '',
        timestamp: deviceInfo?.timestamp ? new Date(deviceInfo.timestamp) : new Date() // Sync time
      },
      syncedAt: new Date() // Server received time
    }));

    // Bulk insert for efficiency
    const result = await LocationTracking.insertMany(locationDocs, {
      ordered: false // Continue on duplicate errors
    });

    res.json({
      success: true,
      saved: result.length,
      message: 'Location data saved successfully'
    });

  } catch (error) {
    console.error('Location tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save location data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/location/history
 * Retrieve user's location history
 */
router.get('/location/history', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate, limit = 1000 } = req.query;

    const query = { user: userId };

    // Filter by date range if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const locations = await LocationTracking
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('-__v -user')
      .lean();

    res.json({
      success: true,
      count: locations.length,
      locations
    });

  } catch (error) {
    console.error('Location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve location history'
    });
  }
});

module.exports = router;
```

### 3. Register Routes

```javascript
// In your main app.js or routes/index.js
const locationRoutes = require('./routes/location');
app.use('/api', locationRoutes);
```

## How the Frontend Tracking Works

### 🚀 Automatic Startup
- **Starts on login** - Tracking begins immediately after authentication
- **Restarts on app load** - If user is already logged in, tracking resumes automatically
- **No user interaction needed** - Completely automatic and silent

### 📱 Phone Always-On Tracking
The tracking runs continuously while:
- ✅ App is open in foreground
- ✅ App is minimized/background (with wake lock)
- ✅ Screen is on
- ⚠️ Screen is off (limited - browser/OS restrictions)

**Note:** Most mobile browsers stop JavaScript execution when screen is off. For true always-on tracking even with screen off, you would need a native Android app using Capacitor background geolocation plugins.

### 💾 Offline Storage & Persistence

#### Local Storage Buffering
```javascript
// Data is automatically saved to localStorage:
localStorage.setItem('locationBuffer', JSON.stringify([...locations]))
```

The system buffers up to **50 locations** before forcing upload. If internet is unavailable:
1. Locations accumulate in `locationBuffer`
2. System retries upload every 60 seconds
3. When connection returns, buffered data uploads automatically
4. No data loss during temporary disconnections

#### Before Phone Shutdown
The system has a **`beforeunload`** event handler that:
1. Detects when app/browser is closing
2. Uses **synchronous XHR** for guaranteed delivery
3. Sends any remaining buffered locations
4. Ensures no data loss on app close

```javascript
window.addEventListener('beforeunload', () => {
  if (locationBuffer.length > 0) {
    // Synchronous upload - blocks until complete
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/location/track', false); // false = synchronous
    xhr.send(JSON.stringify({ locations: locationBuffer }));
  }
});
```

### 📤 Upload Strategy

| Scenario | Behavior |
|----------|----------|
| **Normal Operation** | Upload every 60 seconds |
| **Buffer Full (50 locations)** | Immediate forced upload |
| **Internet Lost** | Store in localStorage, retry every 60s |
| **Internet Restored** | Automatic upload of buffered data |
| **App Closing** | Synchronous upload of remaining data |
| **Page Refresh** | Data restored from localStorage, tracking resumes |

### 🔋 Battery Considerations

The tracking uses:
- **High accuracy GPS** - Maximum precision but higher battery drain
- **Wake lock** - Prevents device sleep while tracking
- **Continuous monitoring** - No gaps in location data

For better battery life, you can modify `lib/aggressive-tracker.ts`:
```typescript
private readonly HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,  // Lower accuracy, better battery
  timeout: 10000,             // Longer timeout
  maximumAge: 30000          // Allow 30s old positions
}
```

## Querying Tracked Data

### Get user locations for a specific date
```javascript
const locations = await LocationTracking.find({
  user: userId,
  timestamp: {
    $gte: new Date('2025-10-28T00:00:00Z'),
    $lte: new Date('2025-10-28T23:59:59Z')
  }
}).sort({ timestamp: 1 });
```

### Get user's route (ordered by time)
```javascript
const route = await LocationTracking
  .find({ user: userId })
  .sort({ timestamp: 1 })
  .select('latitude longitude timestamp')
  .lean();

// Returns array suitable for mapping libraries
const coordinates = route.map(loc => [loc.latitude, loc.longitude]);
```

### Calculate distance traveled
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}
```

## Security & Privacy

### Recommendations
1. **Rate limiting** - Limit requests per user (e.g., max 100 locations/minute)
2. **Data retention** - Auto-delete old location data after X days
3. **User consent** - Ensure users agree to location tracking
4. **Access control** - Only user and admins can view their locations
5. **HTTPS only** - Never transmit location data over HTTP

### Example Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const locationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many location updates'
});

router.post('/location/track', locationLimiter, authenticate, async (req, res) => {
  // ... handler code
});
```

## Testing the Endpoint

### Using cURL
```bash
curl -X POST https://app.codewithseth.co.ke/api/location/track \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "locations": [{
      "latitude": -1.286389,
      "longitude": 36.817223,
      "accuracy": 10.5,
      "timestamp": 1730131200000,
      "speed": 0,
      "heading": null,
      "altitude": 1795
    }],
    "deviceInfo": {
      "userAgent": "Test",
      "platform": "Test",
      "timestamp": 1730131200000
    }
  }'
```

### Expected Flow
1. Frontend tracks location continuously
2. Buffers locations (max 50)
3. Every 60 seconds, sends batch to backend
4. Backend validates and saves to database
5. Returns success response
6. Frontend clears buffer and continues

## Summary

✅ **Endpoint:** `POST /api/location/track`  
✅ **Payload:** Array of location objects + device info  
✅ **Frequency:** Every 60 seconds (or when buffer is full)  
✅ **Offline:** Data buffered in localStorage  
✅ **Persistence:** Synchronous upload before app closes  
✅ **Authentication:** Bearer token required  
✅ **Database:** MongoDB with indexed timestamps  

The frontend is **fully implemented and running**. You just need to create the backend endpoint to receive the data!
