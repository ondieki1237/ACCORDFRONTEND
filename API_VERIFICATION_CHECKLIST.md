# API Verification Checklist

This document summarizes the APIs that the frontend is currently using for **Weekly Planners** and **Weekly Reports**. Please verify with the backend team that these endpoints exist and are functional.

---

## 🔵 Weekly Reports API

### **Status:** ✅ Frontend Implementation Complete

### Endpoints Used:

#### 1. Submit Weekly Report
```
POST https://app.codewithseth.co.ke/api/reports
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "weekStart": "2025-01-15",
  "weekEnd": "2025-01-19",
  "content": {
    "metadata": {
      "author": "John Doe",
      "submittedAt": "2025-01-19T17:30:00.000Z",
      "weekRange": "1/15/2025 - 1/19/2025"
    },
    "sections": [
      {
        "id": "summary",
        "title": "Weekly Summary",
        "content": "..."
      },
      {
        "id": "visits",
        "title": "Customer Visits",
        "content": "..."
      },
      {
        "id": "quotations",
        "title": "Quotations Generated",
        "content": "..."
      },
      {
        "id": "leads",
        "title": "New Leads",
        "content": "..."
      },
      {
        "id": "challenges",
        "title": "Challenges Faced",
        "content": "..."
      },
      {
        "id": "next-week",
        "title": "Next Week's Plan",
        "content": "..."
      }
    ]
  },
  "isDraft": false
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "_id": "report_abc123",
    "userId": "user_xyz789",
    "weekStart": "2025-01-15",
    "weekEnd": "2025-01-19",
    "content": { ... },
    "isDraft": false,
    "pdfUrl": null,
    "status": "pending",
    "createdAt": "2025-01-19T17:30:00.000Z",
    "updatedAt": "2025-01-19T17:30:00.000Z"
  }
}
```

#### 2. Save Draft Report
```
POST https://app.codewithseth.co.ke/api/reports/draft
```
- Same request body as above with `isDraft: true`

#### 3. Get My Reports
```
GET https://app.codewithseth.co.ke/api/reports/my
```

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "report_123",
      "weekStart": "2025-01-15",
      "weekEnd": "2025-01-19",
      "content": { ... },
      "status": "pending",
      "createdAt": "2025-01-19T17:30:00.000Z"
    }
  ]
}
```

#### 4. Get All Reports (Admin?)
```
GET https://app.codewithseth.co.ke/api/reports
```

**Frontend Files:**
- `components/saleshome/reportcreate.tsx` (lines 99, 260, 341)
- `components/saleshome/page.tsx` (lines 147, 187)

---

## 🟡 Weekly Planner API

### **Status:** ⚠️ Frontend Implementation Complete, Backend Verification Needed

### Endpoints Used:

#### 1. Submit Weekly Planner
```
POST https://app.codewithseth.co.ke/api/planner
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {accessToken}"
}
```

**Request Body:**
```json
{
  "weekCreatedAt": "2025-01-20T10:00:00.000Z",
  "days": [
    {
      "day": "Monday",
      "date": "2025-01-20",
      "place": "Nairobi",
      "means": "Matatu",
      "allowance": "2000",
      "prospects": "Visit 3 hospitals"
    },
    {
      "day": "Tuesday",
      "date": "2025-01-21",
      "place": "Mombasa",
      "means": "Bus",
      "allowance": "5000",
      "prospects": "Meet with procurement team"
    }
    // ... Wednesday, Thursday, Friday
  ],
  "notes": ""
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Planner submitted successfully",
  "data": {
    "_id": "planner_abc123",
    "userId": "user_xyz789",
    "weekCreatedAt": "2025-01-20T10:00:00.000Z",
    "days": [ ... ],
    "notes": "",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:00:00.000Z"
  }
}
```

#### 2. Get My Planners ⚠️ **REQUIRED - NOT YET IMPLEMENTED**
```
GET https://app.codewithseth.co.ke/api/planner/my
```

**Headers:**
```json
{
  "Authorization": "Bearer {accessToken}"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "planner_123",
      "userId": "user_xyz789",
      "weekCreatedAt": "2025-01-20T10:00:00.000Z",
      "days": [
        {
          "day": "Monday",
          "date": "2025-01-20",
          "place": "Nairobi",
          "means": "Matatu",
          "allowance": "2000",
          "prospects": "Visit 3 hospitals"
        }
        // ... more days
      ],
      "notes": "",
      "createdAt": "2025-01-20T10:00:00.000Z",
      "updatedAt": "2025-01-20T10:00:00.000Z"
    }
  ]
}
```

**Frontend Files:**
- `components/saleshome/planner.tsx` (line 69) - Submit planner
- `app/planners/page.tsx` - **NEW** View planners page (requires GET endpoint)

**⚠️ IMPORTANT:** The frontend now has a dedicated `/planners` page that attempts to fetch planners using `GET /api/planner/my`. This endpoint MUST be implemented on the backend for the viewing functionality to work.

---

## ✅ Verification Checklist

Please confirm with the backend team:

### Weekly Reports API
- [ ] `POST /api/reports` - Submit report
- [ ] `POST /api/reports/draft` - Save draft report
- [ ] `GET /api/reports/my` - Get user's reports
- [ ] `GET /api/reports` - Get all reports (admin)
- [ ] PDF generation working for submitted reports
- [ ] Email notifications to admin on new report submission

### Weekly Planner API
- [ ] `POST /api/planner` - Submit planner
- [ ] `GET /api/planner/my` - Get user's planners (NEEDS IMPLEMENTATION)
- [ ] `GET /api/planner` - Get all planners (admin, optional)

### Admin Endpoints (from documentation)
- [ ] `GET /api/admin/reports` - List all reports with filters
- [ ] `GET /api/admin/reports/:id` - Get specific report
- [ ] `PUT /api/admin/reports/:id` - Update report status/review

---

## 🚨 Issues Found

1. **Planner API Not Documented** - The planner endpoint is being used but not documented in `BACKEND_API_DOCUMENTATION.md`
2. **No Planner Retrieval** - Missing `GET /api/planner/my` endpoint to fetch submitted planners
3. **No Planner Admin View** - No admin endpoints documented for viewing/managing planners

---

## 📝 Next Steps

1. **Backend Team:** Verify all endpoints exist and are functional
2. **Backend Team:** Implement missing `GET /api/planner/my` endpoint
3. **Frontend Team:** Create a page to view submitted planners and reports
4. **Documentation Team:** Add planner API to `BACKEND_API_DOCUMENTATION.md`
