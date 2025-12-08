# ACCORD Frontend - Complete Project Study & Documentation

**Generated:** December 8, 2025  
**Project Type:** Mobile-first Business Management Application (Phone App)  
**Tech Stack:** Next.js 14, React 18, TypeScript, Capacitor 7, Tailwind CSS  
**API Base URL:** `https://app.codewithseth.co.ke/api`

---

## 📱 **PROJECT OVERVIEW**

ACCORD is a **hybrid mobile application** (iOS & Android) built with Next.js and Capacitor, designed for field sales teams and engineers managing medical equipment. It features GPS tracking, offline support, visit management, lead tracking, quotations, and comprehensive analytics.

### **Key Characteristics**
- **Mobile-First Design:** Touch gestures, PWA capabilities, optimized for mobile devices
- **Offline Support:** Local storage with Capacitor Preferences, automatic sync when online
- **Native Features:** GPS tracking, geolocation, background tracking, wake locks
- **Role-Based Access:** Sales reps, engineers, admins, managers
- **Real-Time Data:** Live dashboard updates, activity tracking, location heatmaps

---

## 📂 **COMPLETE FILE STRUCTURE & PURPOSES**

### **Root Configuration Files**

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: React 18, Next.js 14, Capacitor 7, TanStack Query, Radix UI, Tailwind CSS |
| `capacitor.config.json` | Mobile app configuration (appId: com.ACCORD.business), native permissions |
| `tsconfig.json` | TypeScript configuration with strict mode |
| `next.config.mjs` | Next.js config: static export for Capacitor, image optimization |
| `tailwind.config.js` | Design system with ACCORD blue (#00aeef), custom animations |
| `postcss.config.mjs` | PostCSS with Tailwind processing |
| `.gitignore` | Excludes node_modules, .next, out, android/build |

### **Build Scripts**

| File | Purpose |
|------|---------|
| `build-apk.sh` | Android APK build script: npm build → cap sync → gradle assembleRelease |
| `build_ios.sh` | iOS build script: npm build → cap sync → xcodebuild |

### **Mobile Platform**

```
android/
├── app/
│   ├── build.gradle            # Android app configuration, SDK versions
│   ├── src/main/                # Android native code, manifest, resources
│   └── capacitor.build.gradle  # Capacitor Android integration
├── gradle/                      # Gradle wrapper for building
├── settings.gradle              # Project modules
└── local.properties             # SDK paths (git-ignored)

ios/ (not shown but similar structure)
```

### **Application Core (`app/`)**

| File/Directory | Purpose |
|----------------|---------|
| `app/layout.tsx` | Root layout: theme, fonts (Geist), service worker, offline indicator, sync button, back button handler, analytics |
| `app/page.tsx` | **Main entry point**: Auth check, login/register forms, dashboard routing, role detection (sales/engineer/admin) |
| `app/globals.css` | Global styles: Tailwind base, CSS variables for theming, mobile safe area support |

**Pages:**
```
app/
├── communications/
│   ├── group/page.tsx           # Group messaging interface
│   └── personalized/page.tsx    # 1-on-1 messaging
├── planners/page.tsx            # Visit planning & scheduling
├── reports/page.tsx             # Weekly report submission
└── request/page.tsx             # Quotation request form
```

### **Component Library (`components/`)**

#### **Core Infrastructure**

| Component | Purpose |
|-----------|---------|
| `QueryProvider.tsx` | TanStack React Query wrapper with dev tools |
| `theme-provider.tsx` | Next-themes dark/light mode provider |
| `service-worker-registration.tsx` | PWA service worker for offline functionality |

#### **Authentication (`components/auth/`)**

| Component | Purpose |
|-----------|---------|
| `login-form.tsx` | Email/password login, token storage, error handling |
| `register-form.tsx` | User registration with role selection (sales, engineer, admin) |

#### **Layout & Navigation (`components/layout/`)**

| Component | Purpose |
|-----------|---------|
| `mobile-nav.tsx` | Bottom navigation bar with Home, Calendar, Cart, User, Wrench icons |

#### **Mobile Features (`components/mobile/`)**

| Component | Purpose |
|-----------|---------|
| `back-button-handler.tsx` | Hardware back button interception (Android) |
| `mobile-optimizations.tsx` | Touch target sizing, safe area handling, viewport adjustments |
| `touch-gestures.tsx` | Swipe navigation between pages with threshold control |
| `pwa-install.tsx` | PWA install prompt for iOS/Android |
| `offline-indicator.tsx` | Network status badge (online/offline) |
| `offline-indicator-new.tsx` | Enhanced offline indicator with retry |
| `sync-button.tsx` | Manual sync trigger for pending data |
| `location-tracker-status.tsx` | GPS tracking status display |
| `tracking-controls.tsx` | Start/stop trail recording controls |

#### **Visits Management (`components/visits/`)**

| Component | Purpose |
|-----------|---------|
| `visit-management.tsx` | Main container: list view, create/edit forms |
| `visit-list.tsx` | Paginated visit list with filters (date, client, status) |
| `visit-detail.tsx` | Single visit view: client info, contacts, products, notes |
| `create-visit-form.tsx` | **Primary visit form**: facility typeahead, follow-up selector, contacts, products, offline draft saving |
| `visit-history-selector.tsx` | Follow-up visit selector: fetches `/api/facilities/visited`, shows facility names |
| `followup-visit-form.tsx` | Follow-up specific form with reference to original visit |
| `engineer-visit-management.tsx` | Engineer-specific visit interface |
| `engineering-service-detail.tsx` | Service record detail view |
| `engineering-services-list.tsx` | Engineer service history list |
| `engineer/` | Engineer-specific components |

#### **Leads Management (`components/leads/`)**

| Component | Purpose |
|-----------|---------|
| `lead-management.tsx` | Main container for lead pipeline |
| `lead-list.tsx` | Paginated lead list with status filters |
| `lead-form.tsx` | Create/edit lead: contact info, interest level, follow-up date |

#### **Machines/Equipment (`components/machines/`)**

| Component | Purpose |
|-----------|---------|
| `machine-management.tsx` | Equipment inventory management |
| `machine-list.tsx` | List of machines with filters (type, location, status) |
| `machine-detail.tsx` | Machine detail: specs, service history, client |

#### **Products (`components/products/`)**

| Component | Purpose |
|-----------|---------|
| `product-management.tsx` | Offline product catalog management |
| (Additional components for product browsing, filtering) | |

#### **Engineering Pricing/Expenses (`components/engineering-pricing/`)**

| Component | Purpose |
|-----------|---------|
| `pricing-management.tsx` | Main container for engineer expense claims |
| `pricing-form.tsx` | Submit new expense claim with fare, location, other charges |
| `pricing-list.tsx` | Paginated list of pricing records with filters |
| `pricing-detail.tsx` | View complete expense claim details |

#### **Quotations (`components/quotations/`)**

| Component | Purpose |
|-----------|---------|
| `quotation-form.tsx` | Request quotation for client |
| `quotation-list.tsx` | Quotation history and status tracking |

#### **Trails/GPS (`components/trails/`)**

| Component | Purpose |
|-----------|---------|
| `trail-management.tsx` | GPS trail recording and history |
| `trail-map.tsx` | Leaflet map visualization of trails |

#### **Dashboard (`components/saleshome/`)**

| Component | Purpose |
|-----------|---------|
| `page.tsx` | Sales rep dashboard: metrics, recent activity, charts |
| `engineer-dashboard.tsx` | Engineer dashboard: assigned services, machine status |

#### **Profile (`components/profile/`)**

| Component | Purpose |
|-----------|---------|
| `user-profile.tsx` | User settings, role info, logout |

#### **UI Library (`components/ui/`)**

- Radix UI primitives: button, input, select, dialog, card, toast, etc.
- Styled with Tailwind CSS using shadcn/ui pattern

---

## 🔗 **COMPLETE API ENDPOINT MAPPING**

All endpoints use the base URL: `https://app.codewithseth.co.ke/api`

### **Authentication Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request Body |
|--------|----------|---------|---------------|--------------|
| POST | `/auth/login` | User login | No | `{ email, password }` |
| POST | `/auth/register` | User registration | No | `{ employeeId, firstName, lastName, email, password, role, region, territory, department? }` |
| POST | `/auth/logout` | User logout | No | `{ refreshToken }` |
| POST | `/auth/refresh` | Refresh access token | No | `{ refreshToken }` |
| GET | `/auth/me` | Get current user profile | Yes | None |

**Response Format:**
```json
{
  "data": {
    "user": {
      "id": "string",
      "employeeId": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "string",
      "region": "string",
      "territory": "string",
      "department": "string"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
}
```

**Token Management:**
- Access token stored in `localStorage.accessToken`
- Refresh token stored in `localStorage.refreshToken`
- Auto-refresh on 401 responses
- Token passed in header: `Authorization: Bearer <accessToken>`

---

### **Dashboard Endpoints**

| Method | Endpoint | Purpose | Auth Required | Query Params |
|--------|----------|---------|---------------|--------------|
| GET | `/dashboard/overview` | Overview metrics | Yes | `startDate?, endDate?, region?` |
| GET | `/dashboard/recent-activity` | Recent activity feed | Yes | `limit?` (default: 20) |
| GET | `/dashboard/performance` | Performance metrics | Yes | `startDate?, endDate?, region?` |
| GET | `/dashboard/heatmap/sales` | Sales location heatmap data | Yes | None |

**Response Example (`/dashboard/overview`):**
```json
{
  "success": true,
  "data": {
    "totalVisits": 145,
    "totalTrails": 67,
    "recentActivity": [...],
    "performance": {
      "visitsThisMonth": 42,
      "trailsThisMonth": 18,
      "averageVisitDuration": 120,
      "completionRate": 0.85
    }
  }
}
```

---

### **Visits Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/visits` | List visits (paginated) | Yes | `page?, limit?, startDate?, endDate?` |
| GET | `/visits/:id` | Get single visit | Yes | None |
| POST | `/visits` | Create new visit | Yes | Visit payload (see below) |
| PUT | `/visits/:id` | Update visit | Yes | Partial visit payload |
| DELETE | `/visits/:id` | Delete visit | Yes | None |

**Visit Creation Payload:**
```json
{
  "date": "2025-01-20T09:00:00.000Z",
  "startTime": "2025-01-20T09:00:00.000Z",
  "client": {
    "name": "Nairobi General Hospital",
    "type": "hospital",
    "level": "5",
    "location": "Nairobi, Kenya"
  },
  "visitPurpose": "demo",
  "visitOutcome": "successful",
  "contacts": [
    {
      "name": "Dr. Jane Smith",
      "role": "procurement",
      "phone": "+254712345678",
      "email": "jane.smith@ngh.co.ke"
    }
  ],
  "productsOfInterest": [
    { "name": "X-Ray Machine", "notes": "Model 500" }
  ],
  "notes": "Discussed pricing and delivery timeline",
  "isFollowUpRequired": true
}
```

**Visit Purpose Values:**
- `demo`, `followup`, `installation`, `maintenance`, `consultation`, `sales`, `other`

**Visit Outcome Values:**
- `successful`, `pending`, `followup_required`, `no_interest`

**Client Types:**
- `hospital`, `clinic`, `pharmacy`, `lab`, `imaging_center`, `other`

**Contact Roles:**
- `doctor`, `nurse`, `admin`, `procurement`, `it_manager`, `ceo`, `other`

---

### **Trails (GPS Tracking) Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/trails` | List trails (paginated) | Yes | `page?, limit?, startDate?, endDate?` |
| GET | `/trails/:id` | Get single trail | Yes | None |
| POST | `/trails` | Create new trail | Yes | Trail payload (see below) |
| PUT | `/trails/:id` | Update trail | Yes | Partial trail payload |
| DELETE | `/trails/:id` | Delete trail | Yes | None |

**Trail Creation Payload:**
```json
{
  "date": "2025-01-20",
  "startTime": "2025-01-20T08:00:00.000Z",
  "endTime": "2025-01-20T17:00:00.000Z",
  "path": {
    "type": "LineString",
    "coordinates": [
      [-1.286389, 36.817223],
      [-1.292066, 36.821945],
      [-1.298456, 36.830123]
    ]
  },
  "stops": [
    {
      "name": "Hospital Visit",
      "coordinates": [-1.292066, 36.821945],
      "timestamp": 1737366000000
    }
  ],
  "deviceInfo": {
    "platform": "Android",
    "version": "13"
  }
}
```

---

### **Leads Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/leads` | List leads (paginated) | Yes | `page?, limit?, status?, priority?` |
| GET | `/leads/:id` | Get single lead | Yes | None |
| POST | `/leads` | Create new lead | Yes | Lead payload (see below) |
| PUT | `/leads/:id` | Update lead | Yes | Partial lead payload |
| PUT | `/admin/leads/:id` | Admin update lead | Yes (Admin) | Partial lead payload |
| DELETE | `/leads/:id` | Delete lead | Yes | None |

**Lead Creation Payload:**
```json
{
  "facilityName": "County General Hospital",
  "location": "Mombasa, Kenya",
  "contactPerson": "Dr. John Kamau",
  "contactPhone": "+254722123456",
  "contactEmail": "john.kamau@cgh.co.ke",
  "interestLevel": "high",
  "productInterest": "CT Scanner, X-Ray Machine",
  "estimatedValue": 5000000,
  "status": "new",
  "priority": "high",
  "followUpDate": "2025-02-01",
  "notes": "Budget approved, decision in Q1"
}
```

**Lead Status Values:**
- `new`, `contacted`, `qualified`, `proposal`, `negotiation`, `closed_won`, `closed_lost`

**Interest Levels:**
- `low`, `medium`, `high`, `very_high`

**Priority Levels:**
- `low`, `medium`, `high`, `urgent`

---

### **Facilities Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/facilities` | Search facilities (typeahead) | Yes | `search, limit?` |
| GET | `/facilities/:id` | Get facility by ID | Yes | None |
| GET | `/facilities/visited` | Get user's visited facilities | Yes | None |
| POST | `/facilities` | Create facility | Yes | Facility payload |

**Facility Search Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "properties": {
        "name": "Nairobi General Hospital",
        "amenity": "hospital",
        "healthcare": "hospital",
        "address": "Nairobi, Kenya"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [36.817223, -1.286389]
      }
    }
  ]
}
```

**Visited Facilities Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Nairobi General Hospital",
      "type": "hospital",
      "level": "5",
      "location": "Nairobi, Kenya"
    }
  ]
}
```

---

### **Follow-Up Visits Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/follow-up-visits` | List follow-up visits | Yes | `page?, limit?, status?` |
| GET | `/follow-up-visits/:id` | Get single follow-up | Yes | None |
| POST | `/follow-up-visits` | Create follow-up | Yes | Follow-up payload |
| PUT | `/follow-up-visits/:id` | Update follow-up | Yes | Partial payload |
| DELETE | `/follow-up-visits/:id` | Delete follow-up | Yes | None |

---

### **Engineering Services Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/engineering-services` | List services | Yes | `page?, limit?, engineerId?, status?` |
| GET | `/engineering-services/:id` | Get service detail | Yes | None |
| POST | `/engineering-services` | Create service record | Yes | Service payload (see below) |
| PUT | `/engineering-services/:id` | Update service | Yes | Partial payload |
| DELETE | `/engineering-services/:id` | Delete service | Yes | None |

**Service Creation Payload:**
```json
{
  "date": "2025-01-20",
  "facility": {
    "name": "Mombasa Hospital",
    "location": "Mombasa, Kenya"
  },
  "serviceType": "preventive",
  "machineDetails": "X-Ray Machine - Model XR-500",
  "conditionBefore": "Machine showing error code E42",
  "conditionAfter": "Fully operational, error resolved",
  "otherPersonnel": "Hospital technician assisted",
  "nextServiceDate": "2025-04-20",
  "engineerInCharge": {
    "name": "John Engineer",
    "phone": "+254711222333"
  }
}
```

**Service Types:**
- `preventive`, `corrective`, `installation`, `training`, `inspection`

---

### **Machines (Equipment) Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/machines` | List machines | Yes | `page?, limit?, type?, status?` |
| GET | `/machines/:id` | Get machine detail | Yes | None |
| GET | `/machines/:id/services` | Get machine service history | Yes | `page?, limit?` |
| POST | `/machines` | Create machine record | Yes | Machine payload |
| PUT | `/machines/:id` | Update machine | Yes | Partial payload |
| DELETE | `/machines/:id` | Delete machine | Yes | None |

---

### **Quotations Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/quotations` | List quotations | Yes | `page?, limit?, status?` |
| GET | `/quotations/:id` | Get quotation detail | Yes | None |
| POST | `/quotations` | Request quotation | Yes | Quotation payload (see below) |
| PUT | `/quotations/:id` | Update quotation | Yes | Partial payload |
| DELETE | `/quotations/:id` | Delete quotation | Yes | None |

**Quotation Request Payload:**
```json
{
  "hospital": "Nairobi General Hospital",
  "location": "Nairobi, Kenya",
  "equipmentRequired": "X-Ray Machine Model 500",
  "urgency": "high",
  "contactName": "Dr. Jane Smith",
  "contactEmail": "jane.smith@ngh.co.ke",
  "contactPhone": "+254712345678"
}
```

**Urgency Levels:**
- `low`, `medium`, `high`

---

### **Engineering Pricing (Expenses) Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/engineering-pricing` | List pricing records | Yes | `page?, limit?, engineerId?, activityType?, fromDate?, toDate?` |
| GET | `/engineering-pricing/:id` | Get single pricing record | Yes | None |
| POST | `/engineering-pricing` | Submit expense claim | Yes | Pricing payload (see below) |
| PUT | `/engineering-pricing/:id` | Update pricing record | Yes (Admin/Manager) | Partial payload |
| DELETE | `/engineering-pricing/:id` | Delete pricing record | Yes (Admin/Manager) | None |

**Pricing Submission Payload:**
```json
{
  "engineerId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "activityType": "installation",
  "fare": 1500,
  "location": "Nairobi CBD",
  "facility": "Kenyatta National Hospital",
  "machine": "X-Ray Model 500",
  "otherCharges": [
    {
      "description": "Lunch",
      "amount": 500
    },
    {
      "description": "Accommodation",
      "amount": 3000
    }
  ]
}
```

**Activity Types:**
- `installation`, `maintenance`, `service`, `previsit`

**Field Requirements:**
- `engineerId`, `activityType`, `fare`: Required
- `location`: Required if activityType is `installation`
- `facility`, `machine`, `otherCharges`: Optional

**Response Example:**
```json
{
  "status": "success",
  "message": "Pricing record created successfully",
  "data": {
    "_id": "...",
    "engineerId": "...",
    "activityType": "installation",
    "fare": 1500,
    "location": "Nairobi CBD",
    "facility": "Kenyatta National Hospital",
    "otherCharges": [...],
    "createdAt": "2025-12-08T10:00:00.000Z"
  }
}
```

---

### **Reports Endpoints**

| Method | Endpoint | Purpose | Auth Required | Request/Query |
|--------|----------|---------|---------------|---------------|
| GET | `/reports` | List reports | Yes | `page?, limit?, weekStart?, weekEnd?` |
| GET | `/reports/:id` | Get report detail | Yes | None |
| POST | `/reports` | Submit weekly report | Yes | Report payload (see docs) |
| PUT | `/reports/:id` | Update report | Yes | Partial payload |
| DELETE | `/reports/:id` | Delete report | Yes | None |

---

## 🔐 **AUTHENTICATION & AUTHORIZATION FLOW**

### **Login Flow**

```
1. User enters email/password in LoginForm
   ↓
2. POST /auth/login with credentials
   ↓
3. Backend validates credentials
   ↓
4. Backend returns { user, tokens: { accessToken, refreshToken } }
   ↓
5. Frontend stores:
   - localStorage.accessToken
   - localStorage.refreshToken
   - localStorage.currentUser (JSON)
   ↓
6. authService.setTokens() updates state
   ↓
7. App redirects to dashboard based on role
```

### **Protected API Call Flow**

```
1. User triggers API call (e.g., fetch visits)
   ↓
2. apiService.makeRequest() adds Authorization header
   ↓
3. If 401 Unauthorized response:
   ↓
4. Auto-refresh: POST /auth/refresh with refreshToken
   ↓
5. If refresh succeeds:
   - Store new tokens
   - Retry original request
   ↓
6. If refresh fails:
   - Clear tokens
   - Redirect to login
```

### **Token Refresh**

- **Access Token:** Short-lived (1-2 hours)
- **Refresh Token:** Long-lived (7-30 days)
- **Auto-refresh:** On 401 responses
- **Manual refresh:** Backend can send `X-New-Access-Token` header

### **Role-Based Access**

Detected in `app/page.tsx`:
```typescript
const userRole = user?.role?.toLowerCase() || ''
setIsEngineer(userRole.includes('engineer') || userRole === 'engineer')
setIsAdmin(userRole.includes('admin') || userRole === 'admin' || userRole === 'manager')
```

**Role-Specific Features:**
- **Sales Rep:** Visits, leads, trails, quotations, products
- **Engineer:** Engineering services, machines, service history
- **Admin/Manager:** All features + admin endpoints (e.g., `/admin/leads/:id`)

---

## 💾 **OFFLINE STORAGE & SYNC**

### **Storage Mechanism: Capacitor Preferences**

Located in `lib/offline-storage.ts`

**Stored Data:**
```typescript
interface CachedData {
  user: any
  visits: any[]
  trails: any[]
  leads: any[]
  followUpVisits: any[]
  lastSyncTime: number
  pendingSync: {
    visits: any[]
    trails: any[]
    engineerVisits: any[]
    leads: any[]
    followUpVisits: any[]
  }
}
```

**Storage Keys:**
- `accord_user_data`: Current user profile
- `accord_visits_cache`: Cached visit history
- `accord_trails_cache`: Cached trail history
- `accord_leads_cache`: Cached leads
- `accord_pending_sync`: Unsynced data queue
- `accord_last_sync`: Last sync timestamp
- `accord_offline_status`: Network status

### **Offline Workflow**

#### **Creating Data Offline**

```
1. User creates visit while offline
   ↓
2. apiService.createVisit() detects offline (navigator.onLine = false)
   ↓
3. Data saved to offlineStorage.addToPendingSync('visits', visitData)
   ↓
4. Returns mock response: { id: 'offline_visit_123...', _createdOffline: true }
   ↓
5. UI shows "Saved Offline" toast
```

#### **Syncing When Online**

```
1. Device connects to internet
   ↓
2. 'online' event fires
   ↓
3. offlineStorage.handleOnline() triggered
   ↓
4. Pending visits/trails/leads fetched from storage
   ↓
5. For each pending item:
   - POST to respective endpoint
   - If success: remove from pending
   - If failure: keep in pending
   ↓
6. UI shows sync status (success count, failed count)
```

### **Draft Saving (Visit Form)**

Located in `components/visits/create-visit-form.tsx`

```typescript
// Auto-save draft every 1 second
useEffect(() => {
  const saveDraft = async () => {
    await Preferences.set({ key: DRAFT_KEY, value: JSON.stringify(formData) })
  }
  const timeoutId = setTimeout(saveDraft, 1000)
  return () => clearTimeout(timeoutId)
}, [formData])

// Restore draft on mount
useEffect(() => {
  const loadDraft = async () => {
    const { value } = await Preferences.get({ key: DRAFT_KEY })
    if (value) {
      setFormData(JSON.parse(value))
      toast({ title: "Draft Restored" })
    }
  }
  loadDraft()
}, [])
```

### **Sync Button (`components/mobile/sync-button.tsx`)**

Manual sync trigger:
```typescript
const handleSync = async () => {
  // 1. Fetch pending data
  const pendingVisits = await offlineStorage.getPendingVisits()
  
  // 2. Attempt to sync each item
  for (const visit of pendingVisits) {
    await apiService.createVisit(visit)
  }
  
  // 3. Show result toast
}
```

---

## 📍 **GPS TRACKING & LOCATION FEATURES**

### **Background Tracking Service**

Located in `lib/background-tracker.ts`

**Capabilities:**
- Continuous GPS tracking (5-30 second intervals)
- Wake lock to prevent device sleep
- Auto-save trails to database
- Offline trail recording
- Service worker for background processing

**Usage:**
```typescript
// Start tracking
const session = await backgroundTracker.startTracking()

// Add stop/waypoint
backgroundTracker.addStop("Hospital Visit", [lat, lng])

// Stop and save
const completedSession = await backgroundTracker.stopTracking()
```

**Trail Data Structure:**
```typescript
interface TrackingSession {
  id: string
  startTime: number
  coordinates: number[][]  // [[lat, lng], [lat, lng], ...]
  isActive: boolean
  stops: {
    name: string
    coordinates: number[]
    timestamp: number
  }[]
}
```

### **Native Tracking (Capacitor)**

Located in `lib/native-background-tracker.ts`

Uses Capacitor plugins:
- `@capacitor/geolocation`: GPS access
- `@capacitor-community/background-geolocation`: Background tracking

**Permissions Required:**
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`
- iOS: Location permissions (always/when in use)

### **Location Features**

1. **Trail Recording:** Live GPS tracking with path visualization
2. **Sales Heatmap:** Location-based sales data visualization
3. **Visit Geotagging:** Auto-capture location for visits
4. **Distance Calculation:** Haversine formula for route distance

---

## 📦 **CAPACITOR NATIVE FEATURES**

### **Installed Plugins**

From `package.json`:
```json
{
  "@capacitor/android": "^7.4.3",
  "@capacitor/app": "^7.1.0",
  "@capacitor/cli": "^7.4.3",
  "@capacitor/core": "^7.4.4",
  "@capacitor/geolocation": "^7.1.5",
  "@capacitor/preferences": "^7.0.2",
  "@capacitor-community/background-geolocation": "^1.2.26"
}
```

### **Native Capabilities**

| Feature | Plugin | Purpose |
|---------|--------|---------|
| Offline Storage | `@capacitor/preferences` | Key-value storage (replaces localStorage) |
| GPS Tracking | `@capacitor/geolocation` | Real-time location access |
| Background Tracking | `@capacitor-community/background-geolocation` | Track location when app is backgrounded |
| App State | `@capacitor/app` | Detect app background/foreground, hardware back button |
| PWA Features | Built-in | Service worker, manifest, install prompt |

### **Permissions Configuration**

From `capacitor.config.json`:
```json
{
  "plugins": {
    "Geolocation": {
      "permissions": ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"]
    },
    "Camera": {
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    },
    "LocalNotifications": {
      "smallIcon": "ic_stat_icon_config_sample",
      "iconColor": "#00aeef"
    }
  }
}
```

### **Android Manifest (auto-generated)**

Location: `android/app/src/main/AndroidManifest.xml`

Key permissions:
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION` (for trail tracking)
- `INTERNET`
- `WRITE_EXTERNAL_STORAGE` (for photos)

---

## 🎨 **UI/UX DESIGN SYSTEM**

### **Color Palette**

**Primary:**
- ACCORD Blue: `#00aeef` (used for headers, buttons, brand elements)
- Gradient: `from-[#00aeef] to-[#0096d6]`

**Semantic Colors:**
- Success: `emerald-500`
- Error: `red-500`
- Warning: `yellow-500`
- Info: `blue-500`

### **Typography**

**Fonts:**
- Sans-serif: `Geist Sans` (variable font)
- Monospace: `Geist Mono`

**Sizes:**
- Headings: `text-3xl` to `text-4xl` (24-36px)
- Body: `text-base` (16px)
- Small: `text-sm` (14px)

### **Spacing & Layout**

**Safe Area Handling:**
```css
/* globals.css */
body {
  padding-bottom: env(safe-area-inset-bottom);
  padding-top: env(safe-area-inset-top);
}
```

**Touch Targets:**
- Minimum: 44px × 44px (iOS guideline)
- Buttons: `h-12` (48px)
- Input fields: `h-12`

### **Mobile Optimizations**

1. **Touch Gestures:** Swipe navigation between pages (threshold: 80px)
2. **Keyboard Handling:** Auto-scroll when keyboard opens
3. **Pull-to-Refresh:** Native refresh gestures
4. **Bottom Navigation:** Fixed navigation bar with 5 tabs
5. **Haptic Feedback:** (if implemented)

### **Neomorphism Design**

Cards use soft shadows:
```css
box-shadow: 12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff
```

### **Responsive Design**

Breakpoints:
- Mobile: < 768px (default)
- Tablet: ≥ 768px (`md:`)
- Desktop: ≥ 1024px (`lg:`)

---

## 🔄 **STATE MANAGEMENT**

### **Global State**

**Auth State:** Managed in `lib/auth.ts`
```typescript
class AuthService {
  private accessToken: string | null
  private refreshToken: string | null
  private currentUser: User | null
  
  // Synced to localStorage on changes
}
```

**Offline State:** Managed in `lib/offline-storage.ts`
```typescript
class OfflineStorageService {
  private listeners: Set<(data: CachedData) => void>
  private statusListeners: Set<(status: OfflineStatus) => void>
  
  // Event-driven updates
}
```

### **Component State**

**React Query (TanStack Query):**
```typescript
// QueryProvider.tsx
<QueryClientProvider client={queryClient}>
  <ReactQueryDevtools initialIsOpen={false} />
  {children}
</QueryClientProvider>
```

Used for:
- Data fetching with caching
- Automatic refetching
- Optimistic updates
- Pagination

**Local Component State:**
```typescript
// Example: create-visit-form.tsx
const [formData, setFormData] = useState<VisitFormData>(...)
const [isSubmitting, setIsSubmitting] = useState(false)
const [facilitySuggestions, setFacilitySuggestions] = useState<any[]>([])
```

### **Form State**

**Manual State Management:**
- Visit form: Local state with draft auto-save
- Lead form: Controlled inputs with validation
- Quotation form: Controlled inputs

**React Hook Form:** (installed but not widely used yet)

---

## 🧩 **KEY COMPONENTS DEEP DIVE**

### **Visit Creation Form**

Location: `components/visits/create-visit-form.tsx`

**Features:**
1. **Facility Typeahead:**
   - Searches local `facilities.json` (10k+ facilities)
   - Debounced search (300ms delay)
   - Keyboard navigation (Arrow Up/Down, Enter, Escape)
   - Auto-fills location, client type, hospital level

2. **Follow-Up Visit Selection:**
   - If `visitPurpose = 'followup'`, shows `visit-history-selector`
   - Fetches user's visited facilities from `/api/facilities/visited`
   - Clicking a facility auto-fills form fields

3. **Dynamic Fields:**
   - Contacts: Add/remove multiple contacts
   - Products of Interest: Add/remove multiple products
   - Validation: At least one contact required

4. **Offline Draft Saving:**
   - Auto-saves form to Capacitor Preferences every 1 second
   - Restores draft on mount
   - Clears draft on successful submission or cancel

5. **Navigation Blocking:**
   - Blocks hardware back button while form is active
   - Prevents accidental data loss

6. **Submission:**
   - Online: POST to `/api/visits`
   - Offline: Save to pending sync queue
   - Shows appropriate toast (success/offline/error)

### **API Service**

Location: `lib/api.ts`

**Core Method: `makeRequest()`**

```typescript
private async makeRequest(endpoint: string, options: RequestInit = {}) {
  let token = authService.getAccessToken()
  
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  // Check for new access token in response headers (auto-refresh)
  const newAccessToken = response.headers.get('X-New-Access-Token')
  if (newAccessToken) {
    authService.setTokens(newAccessToken, refreshToken)
  }

  // If 401, try to refresh token and retry
  if (response.status === 401) {
    const refreshToken = authService.getRefreshToken()
    if (refreshToken) {
      // POST /auth/refresh
      // If success: retry original request
      // If fail: logout
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${errorMsg}`)
  }

  return await response.json()
}
```

**Error Handling:**
1. Network errors → offline storage
2. 401 Unauthorized → auto-refresh token
3. 400+ errors → throw with backend message
4. Success → cache data if applicable

### **Offline Storage Service**

Location: `lib/offline-storage.ts`

**Key Methods:**

```typescript
// Cache data
async cacheVisits(visits: any[]): Promise<void>
async cacheTrails(trails: any[]): Promise<void>
async cacheLeads(leads: any[]): Promise<void>

// Get cached data
async getCachedVisits(): Promise<any[]>
async getCachedTrails(): Promise<any[]>
async getCachedLeads(): Promise<any[]>

// Pending sync queue
async addToPendingSync(type: 'visits' | 'trails' | 'leads', data: any): Promise<void>
async getPendingSync(): Promise<CachedData['pendingSync']>
async clearPendingSync(type: string): Promise<void>

// Event listeners
subscribe(listener: (data: CachedData) => void): () => void
subscribeToStatus(listener: (status: OfflineStatus) => void): () => void
```

**Sync Strategy:**
1. **Optimistic UI:** Show offline data immediately
2. **Background Sync:** Sync pending items when online
3. **Cache-First:** Use cached data if API fails
4. **Manual Sync:** Sync button for user-triggered sync

---

## 📊 **DATA FLOW EXAMPLES**

### **Example 1: Creating a Visit**

```
User fills out visit form
  ↓
Clicks "Record Visit"
  ↓
create-visit-form.tsx: handleSubmit()
  ↓
apiService.createVisit(visitData)
  ↓
Check if online
  ↓
[IF ONLINE]
  POST /api/visits
    ↓
  Success: Clear draft, show toast, call onSuccess()
    ↓
  visit-management.tsx: Refetch visits
    ↓
  visit-list.tsx: Re-render with new visit

[IF OFFLINE]
  offlineStorage.addToPendingSync('visits', visitData)
    ↓
  Show "Saved Offline" toast
    ↓
  When online: Auto-sync pending visits
```

### **Example 2: Facility Typeahead**

```
User types "Nairobi" in Facility Name input
  ↓
onChange fires, updates formData.clientName
  ↓
useEffect triggers fetchFacilities(query)
  ↓
Debounce (300ms delay)
  ↓
Search local facilities.json
  ↓
Filter by name.includes(query.toLowerCase())
  ↓
setFacilitySuggestions(results.slice(0, 10))
  ↓
Dropdown renders with suggestions
  ↓
User clicks a suggestion
  ↓
onClick handler:
  - updateField('clientName', facility.name)
  - updateField('location', facility.coordinates)
  - updateField('clientType', facility.amenity)
  - Close dropdown
```

### **Example 3: Follow-Up Visit Selection**

```
User selects "Follow Up" in Visit Purpose
  ↓
formData.visitPurpose === 'followup'
  ↓
Conditional render: <VisitHistorySelector />
  ↓
useEffect: Fetch /api/facilities/visited
  ↓
Response: [{ name, type, level, location }, ...]
  ↓
Render facility names in list
  ↓
User clicks a facility
  ↓
onSelect(facility) callback:
  - updateField('followUpOf', facility.name + location + level)
  - updateField('clientName', facility.name)
  - updateField('clientType', facility.type)
  - updateField('hospitalLevel', facility.level)
  - updateField('location', facility.location)
  - Focus clientName input (shows autofill happened)
```

---

## 🚀 **BUILD & DEPLOYMENT**

### **Development**

```bash
# Install dependencies
npm install

# Run dev server (web)
npm run dev
# Accessible at http://localhost:3000

# Type-check
npx tsc --noEmit
```

### **Build for Production (Web)**

```bash
npm run build
# Creates static export in /out directory

npm start
# Serves production build
```

### **Build for Mobile**

#### **Android:**

```bash
# 1. Build Next.js app
npm run build

# 2. Sync web assets to Capacitor
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. Build APK/AAB in Android Studio
# Or via command line:
cd android
./gradlew assembleRelease  # APK
./gradlew bundleRelease    # AAB (Play Store)
```

**Build Script:** `build-apk.sh`
```bash
#!/bin/bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
cd ..
echo "APK at: android/app/build/outputs/apk/release/app-release.apk"
```

#### **iOS:**

```bash
# 1. Build Next.js app
npm run build

# 2. Sync web assets to Capacitor
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. Build in Xcode (select device, Product > Archive)
```

**Build Script:** `build_ios.sh`

### **Deployment Checklist**

- [ ] Update version in `package.json`, `capacitor.config.json`
- [ ] Test on physical devices (Android & iOS)
- [ ] Verify offline functionality
- [ ] Test location permissions
- [ ] Verify API endpoints (production URL)
- [ ] Generate signed APK/AAB (Android)
- [ ] Generate IPA (iOS)
- [ ] Upload to Play Store / App Store

---

## 🧪 **TESTING STRATEGY**

### **Current Testing**

No automated tests in `package.json`. Manual testing workflow:

1. **Component Testing:** Visual inspection in dev mode
2. **API Testing:** Postman collection (`postman_kmhfr_local_collection.json`)
3. **Offline Testing:** Use Chrome DevTools → Network → Offline
4. **Mobile Testing:** Test on physical devices via USB debugging

### **Suggested Testing Setup**

```json
{
  "scripts": {
    "test": "jest",
    "test:e2e": "playwright test",
    "test:unit": "jest --testPathPattern=unit"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

---

## 🐛 **DEBUGGING & MONITORING**

### **Console Logging**

Extensive logging in `lib/api.ts`:
```typescript
console.log('🌐 API Request:', { endpoint, fullUrl, method, hasToken })
console.log('📥 API Response received:', { status, responseData })
console.error('❌ Backend error response:', errorData)
```

Emoji prefixes for quick filtering:
- 🌐 Network requests
- 📥 API responses
- ❌ Errors
- ✅ Success
- 🔄 Token refresh
- 📍 GPS updates
- 💾 Cache operations

### **Error Handling**

**API Errors:**
```typescript
try {
  const response = await apiService.createVisit(visitData)
  toast({ title: "Visit Created" })
} catch (error: any) {
  toast({ title: "Failed to Create Visit", description: error.message, variant: "destructive" })
}
```

**Offline Fallback:**
```typescript
try {
  const response = await apiService.getVisits()
  return response.data
} catch (error) {
  console.warn('Failed to fetch visits, using cached data:', error)
  const cachedVisits = await offlineStorage.getCachedVisits()
  return { data: cachedVisits, _fromCache: true }
}
```

### **Production Monitoring**

**Vercel Analytics:** Installed in `app/layout.tsx`
```tsx
import { Analytics } from "@vercel/analytics/next"
<Analytics />
```

---

## 📖 **DOCUMENTATION FILES**

The project includes extensive markdown documentation:

| File | Purpose |
|------|---------|
| `README.md` | Project overview, setup, deployment |
| `BACKEND_API_DOCUMENTATION.md` | Complete backend API reference (1080 lines) |
| `FACILITIES.md` | Facilities API endpoints |
| `LEADS_BACKEND_API.md` | Leads API specification |
| `FOLLOWUP_VISIT_BACKEND_API.md` | Follow-up visits API |
| `ENGINEER_APP_IMPLEMENTATION_GUIDE.md` | Engineer features guide |
| `ENGINEERING_SERVICES_IMPLEMENTATION.md` | Engineering services spec |
| `MACHINES.md` | Equipment/machines management |
| `QUOTATION_SYSTEM_COMPLETE.md` | Quotation system guide |
| `PRODUCT_CATALOG_IMPLEMENTATION.md` | Offline product catalog |
| `LOCATION_TRACKING.md` | GPS tracking implementation |
| `OFFLINE_TESTING_GUIDE.md` | How to test offline features |
| `INSTALLATION.md` | Setup instructions |

---

## 🎯 **KEY TAKEAWAYS**

### **What Makes This a Phone Application**

1. **Capacitor Integration:** Hybrid app (web + native) for iOS/Android
2. **Native Plugins:** GPS, offline storage, background geolocation, app state
3. **Mobile UI/UX:** Touch gestures, bottom navigation, safe area handling, mobile-optimized forms
4. **Offline-First:** Local storage with Capacitor Preferences, sync queue
5. **PWA Capabilities:** Service worker, manifest, install prompt
6. **Build Process:** Android Studio (APK/AAB), Xcode (IPA)

### **Core Features**

1. **Visit Management:** Create, list, detail, follow-up visits
2. **GPS Tracking:** Real-time trail recording with background support
3. **Lead Pipeline:** Sales lead tracking and management
4. **Quotations:** Request and track product quotations
5. **Engineering Services:** Service records for field engineers
6. **Dashboard:** Real-time metrics, heatmaps, activity feed
7. **Offline Support:** Full offline create/read with automatic sync

### **Technology Highlights**

- **Next.js 14:** React framework with SSG for static export
- **Capacitor 7:** Native bridge for iOS/Android
- **TypeScript:** Type-safe development
- **TanStack Query:** Data fetching and caching
- **Radix UI:** Accessible component primitives
- **Tailwind CSS:** Utility-first styling
- **Leaflet:** Map visualization

### **API Architecture**

- **RESTful API:** Standard HTTP methods (GET, POST, PUT, DELETE)
- **JWT Authentication:** Access + refresh token pattern
- **Pagination:** Page/limit query params
- **Filtering:** Query params for date ranges, status, region
- **Offline Sync:** Pending queue with retry logic

---

## 📞 **SUPPORT & MAINTENANCE**

**Project Owner:** ACCORD Medical  
**Backend URL:** `https://app.codewithseth.co.ke/api`  
**Frontend Repo:** (Current workspace)

**Common Issues:**

1. **Token Expiration:**
   - Solution: Auto-refresh implemented, check refresh token validity

2. **Offline Sync Failures:**
   - Solution: Check pending sync queue, verify API connectivity, inspect error logs

3. **GPS Not Working:**
   - Solution: Verify permissions in Android manifest, check location services enabled

4. **Build Errors:**
   - Android: Check Gradle version, SDK paths in `local.properties`
   - iOS: Verify Xcode version, provisioning profiles

5. **TypeScript Errors:**
   - Solution: Run `npx tsc --noEmit` to check, fix type mismatches

**Useful Commands:**

```bash
# Clear cache
rm -rf node_modules .next out
npm install

# Reset Capacitor
npx cap sync
npx cap copy

# View Android logs
adb logcat | grep Capacitor

# iOS logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Accord"'
```

---

## 🎓 **LEARNING RESOURCES**

- **Next.js:** https://nextjs.org/docs
- **Capacitor:** https://capacitorjs.com/docs
- **React Query:** https://tanstack.com/query/latest
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com/primitives

---

**END OF PROJECT STUDY**

This document provides a complete understanding of the ACCORD Frontend application. It covers every major file, all API endpoints, authentication flow, offline storage, mobile features, and deployment processes. Use this as a reference for development, debugging, and onboarding new team members.
