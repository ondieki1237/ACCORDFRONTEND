# API Configuration Update Summary

## Changes Made

### 1. All APIs Now Use Deployed Backend

**Previous Behavior:**
- Used `process.env.NEXT_PUBLIC_API_BASE_URL` with localhost fallback
- Could connect to local development server

**New Behavior:**
- **All APIs hardcoded to:** `https://app.codewithseth.co.ke/api`
- No localhost support - always uses production server

### Files Updated:
- ✅ `lib/aggressive-tracker.ts` - Location tracking
- ✅ `lib/api.ts` - Main API service
- ✅ `lib/api/engineeringService.ts` - Engineering API
- ✅ `components/saleshome/planner.tsx` - Weekly planner

---

## Enhanced Location Tracking Features

### 1. Batch Upload Support ✅

The location tracker now **always sends arrays** of locations:

```typescript
{
  "locations": [
    { latitude: -1.286, longitude: 36.817, accuracy: 10, timestamp: 1730131200000 },
    { latitude: -1.287, longitude: 36.818, accuracy: 12, timestamp: 1730131205000 },
    // ... up to 50 locations per batch
  ]
}
```

**Benefits:**
- Offline apps store multiple GPS points locally
- Batch upload when connection restored
- More efficient (fewer API calls)
- No data loss during temporary disconnections

### 2. Timestamp Preservation ✅

**Two distinct timestamps are maintained:**

| Timestamp Type | Location | Purpose |
|----------------|----------|---------|
| `location.timestamp` | Each GPS point | **When location was captured** (original time) |
| `deviceInfo.timestamp` | Request payload | **When data was sent** (sync time) |
| `syncedAt` | Backend database | **When server received it** |

**Example:**
```json
{
  "locations": [
    {
      "timestamp": 1730100000000,  // Captured at 10:00 AM (offline)
      // ... other fields
    }
  ],
  "deviceInfo": {
    "timestamp": 1730107200000  // Synced at 12:00 PM (online)
  }
}
```

This preserves the **actual travel timeline** even for delayed uploads.

### 3. Flexible Authentication ✅

**Mode 1: Authenticated (JWT Bearer Token) - Preferred**
```javascript
headers: {
  'Authorization': 'Bearer eyJhbGc...',
  'Content-Type': 'application/json'
}
body: {
  locations: [...],
  deviceInfo: {...}
  // No userId needed - extracted from JWT
}
```

**Mode 2: Unauthenticated (userId in body) - Fallback**
```javascript
headers: {
  'Content-Type': 'application/json'
  // No Authorization header
}
body: {
  userId: '507f1f77bcf86cd799439011',
  locations: [...],
  deviceInfo: {...}
}
```

**Frontend Logic:**
```typescript
// 1. Try to get JWT token
const token = authService.getAccessToken()
const user = authService.getCurrentUserSync()

// 2. Build headers
const headers = { 'Content-Type': 'application/json' }
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}

// 3. Build payload
const payload = { locations, deviceInfo }
if (!token && user?._id) {
  payload.userId = user._id  // Fallback for offline tracking
}
```

**Use Cases:**
- ✅ Normal operation: Uses JWT token
- ✅ Token expired but user cached: Uses userId from localStorage
- ✅ Offline tracking then sync: Uses userId when connection returns
- ❌ No token and no user ID: Skip upload (requires one authentication method)

---

## Backend Implementation Requirements

### Endpoint: `POST /api/location/track`

### Required Features

#### 1. Accept Batch Locations (1-100 items)
```javascript
if (!locations || !Array.isArray(locations) || locations.length === 0) {
  return res.status(400).json({ message: 'Invalid locations data' })
}

if (locations.length > 100) {
  return res.status(400).json({ message: 'Maximum 100 locations per request' })
}
```

#### 2. Flexible Authentication
```javascript
let userId;

// Try JWT first
const token = req.headers.authorization?.substring(7);
if (token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId || decoded._id;
  } catch (e) {
    // Token invalid, try body
  }
}

// Fallback to body
if (!userId && req.body.userId) {
  userId = req.body.userId;
}

if (!userId) {
  return res.status(401).json({ message: 'Authentication required' });
}
```

#### 3. Preserve Timestamps
```javascript
const locationDocs = locations.map(loc => ({
  user: userId,
  latitude: loc.latitude,
  longitude: loc.longitude,
  accuracy: loc.accuracy,
  timestamp: new Date(loc.timestamp),      // Original capture time
  deviceInfo: {
    timestamp: new Date(deviceInfo.timestamp) // Sync time
  },
  syncedAt: new Date()                      // Server receive time
}));
```

#### 4. Database Schema
```javascript
{
  user: ObjectId,
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  timestamp: Date,        // When GPS captured (can be old for offline data)
  speed: Number,
  heading: Number,
  altitude: Number,
  deviceInfo: {
    userAgent: String,
    platform: String,
    timestamp: Date       // When data was sent to server
  },
  syncedAt: Date,         // When server saved it
  createdAt: Date
}
```

---

## Frontend Behavior Summary

### Automatic Tracking
- ✅ Starts on login
- ✅ Auto-resumes on app load (if authenticated)
- ✅ Silent operation (no UI, no console logs)
- ✅ Continuous GPS monitoring

### Offline Support
- ✅ Buffers up to 50 locations in localStorage
- ✅ Auto-retry upload every 60 seconds
- ✅ Preserves original capture timestamps
- ✅ Syncs when connection restored

### Data Integrity
- ✅ Synchronous upload on app close (guaranteed delivery)
- ✅ Batch uploads for efficiency
- ✅ Fallback authentication with userId
- ✅ No data loss during disconnections

### Current Status
| Feature | Status |
|---------|--------|
| Frontend Implementation | ✅ Complete |
| Batch Upload Support | ✅ Complete |
| Timestamp Preservation | ✅ Complete |
| Flexible Authentication | ✅ Complete |
| Offline Buffering | ✅ Complete |
| API Endpoint | ⏳ **Needs Backend Implementation** |

---

## Testing the System

### 1. Test Normal Tracking
1. Login to app
2. Check browser DevTools > Network tab
3. Every 60 seconds, see POST to `/api/location/track`
4. Verify payload has locations array

### 2. Test Offline Buffering
1. Login and start tracking
2. Disconnect internet
3. Wait 2-3 minutes (locations buffering)
4. Check localStorage: `locationBuffer` key
5. Reconnect internet
6. See buffered locations upload

### 3. Test Batch Upload
1. Start tracking
2. Check network requests
3. Verify each POST contains **multiple locations** (not just 1)
4. Should see array of 1-50 items per request

### 4. Test Fallback Authentication
1. Login and start tracking
2. Manually expire JWT in browser
3. Keep tracking
4. Verify uploads continue with `userId` in body

---

## Migration Checklist

### Backend Developer
- [ ] Create `POST /api/location/track` endpoint
- [ ] Accept locations as array (1-100 items)
- [ ] Support JWT authentication
- [ ] Support userId in body (fallback)
- [ ] Preserve original timestamps
- [ ] Add syncedAt timestamp
- [ ] Create LocationTracking model
- [ ] Add database indexes
- [ ] Test with sample payload

### Deployment
- [ ] Backend deployed at `https://app.codewithseth.co.ke`
- [ ] `/api/location/track` endpoint accessible
- [ ] CORS configured for frontend domain
- [ ] Database ready for location data

### Frontend (Already Complete ✅)
- [x] All APIs use deployed URL
- [x] Batch upload implemented
- [x] Timestamp preservation
- [x] Flexible authentication
- [x] Offline buffering
- [x] Silent operation

---

## API Payload Examples

### Typical Request (3 locations)
```json
POST https://app.codewithseth.co.ke/api/location/track

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
    },
    {
      "latitude": -1.286391,
      "longitude": 36.817225,
      "accuracy": 12.3,
      "timestamp": 1730131205000,
      "speed": 1.2,
      "heading": 45.0,
      "altitude": 1796.0
    },
    {
      "latitude": -1.286393,
      "longitude": 36.817227,
      "accuracy": 11.1,
      "timestamp": 1730131210000,
      "speed": 2.5,
      "heading": 47.0,
      "altitude": 1797.0
    }
  ],
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 (Linux; Android 13; SM-G991B)...",
    "platform": "Linux armv8l",
    "timestamp": 1730131210000
  }
}
```

### With Fallback Authentication
```json
POST https://app.codewithseth.co.ke/api/location/track

{
  "userId": "507f1f77bcf86cd799439011",
  "locations": [...],
  "deviceInfo": {...}
}
```

### Expected Response
```json
{
  "success": true,
  "saved": 3,
  "message": "Location data saved successfully"
}
```

---

## Summary

✅ **All APIs now use:** `https://app.codewithseth.co.ke/api`  
✅ **Batch uploads:** 1-50 locations per request  
✅ **Timestamp preservation:** Original capture time + sync time  
✅ **Flexible auth:** JWT token OR userId in body  
✅ **Offline support:** LocalStorage buffering with auto-retry  
✅ **Silent operation:** No UI, no logs, completely invisible  

**Frontend is ready!** Just need backend endpoint implementation.
