# Admin Panel Requirements & User Interface Design

## Overview
This document outlines the complete admin panel requirements for managing sales reports, quotations, visits, and engineering services submitted from the ACCORD sales mobile/web application.

---

## 📋 Table of Contents
1. [Dashboard Overview](#dashboard-overview)
2. [Reports Management](#reports-management)
3. [Quotations Management](#quotations-management)
4. [Visits Management](#visits-management)
5. [Engineering Services Management](#engineering-services-management)
6. [User Management](#user-management)
7. [Analytics & Reporting](#analytics--reporting)
8. [Notifications & Alerts](#notifications--alerts)
9. [UI/UX Specifications](#uiux-specifications)

---

## 1. Dashboard Overview

### Homepage Statistics Cards

Display key metrics at a glance:

```
┌─────────────────────────────────────────────────────────────┐
│  ACCORD Admin Dashboard                           [Profile] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 📄 Reports│  │ 💰 Quotes │  │ 👥 Visits │  │ 🔧 Services│   │
│  │    24     │  │    18     │  │    42     │  │    15     │   │
│  │  Pending  │  │  Urgent   │  │ This Week │  │  Active   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  Quick Actions:                                              │
│  [View Pending Reports] [Respond to Quotations] [+New Service]│
│                                                               │
│  Recent Activity Feed:                                        │
│  • John Doe submitted weekly report (5 mins ago)             │
│  • Jane Smith requested quotation for X-Ray machine (15 mins)│
│  • Service #1234 completed by Engineer Mike (1 hour ago)     │
│  • New visit scheduled at Nairobi General Hospital (2 hours) │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Metrics**:
- Pending reports count
- Urgent quotations count  
- Visits this week count
- Active engineering services count
- Revenue pipeline value
- Top performing sales reps
- Response time averages

---

## 2. Reports Management

### Reports List View

**Features**:
- ✅ Filterable table/grid view
- ✅ Search by sales rep name, date range
- ✅ Filter by status (pending, reviewed, approved)
- ✅ Sort by submission date, sales rep, week
- ✅ Bulk actions (mark as reviewed, export)
- ✅ Pagination

**Table Columns**:
| Sales Rep | Week Range | Submitted Date | Status | PDF | Actions |
|-----------|------------|----------------|--------|-----|---------|
| John Doe | Jan 15-19 | 2025-01-19 17:30 | ⏳ Pending | [📄 View] | [👁️ View] [✅ Review] |
| Jane Smith | Jan 15-19 | 2025-01-19 16:45 | ✅ Reviewed | [📄 Download] | [👁️ View] [📝 Edit] |

**Filter Panel**:
```
Status:  [All ▼] [Pending] [Reviewed] [Approved]
Date Range:  [2025-01-01] to [2025-01-31]
Sales Rep:  [All Sales Reps ▼]
Search:  [🔍 Search by name, notes...]
```

### Report Detail View

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  📄 Weekly Report - John Doe                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📅 Week: January 15-19, 2025                               │
│  👤 Sales Rep: John Doe (john.doe@accord.com)              │
│  📞 Phone: +254712345678                                    │
│  ⏰ Submitted: January 19, 2025 at 5:30 PM                 │
│  📊 Status: ⏳ Pending Review                                │
│                                                               │
│  [📥 Download PDF]  [✅ Mark as Reviewed]  [❌ Reject]       │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  📋 Weekly Summary                                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ This week I focused on following up with leads from   │ │
│  │ last month's trade show. Successfully closed 2 deals  │ │
│  │ and generated 3 new quotations...                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  👥 Customer Visits (5 visits)                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. Nairobi General Hospital - Product demonstration   │ │
│  │ 2. Kenyatta National Hospital - Follow-up meeting     │ │
│  │ 3. Mombasa Medical Center - Installation support      │ │
│  │ 4. Eldoret Regional Hospital - Maintenance check      │ │
│  │ 5. Nakuru Clinic - Consultation and quotation         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  💰 Quotations Generated (3 quotations, KES 2.5M total)     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • X-Ray Machine for Nairobi General - KES 1.2M       │ │
│  │ • Ultrasound System for Mombasa Medical - KES 800K   │ │
│  │ • CT Scanner upgrade for Eldoret - KES 500K          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  🎯 New Leads (4 leads)                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • Kisumu Hospital - Interested in imaging equipment  │ │
│  │ • Thika Medical Center - Requesting catalog           │ │
│  │ • Machakos Clinic - Budget planning for Q2            │ │
│  │ • Nyeri Regional - RFP expected next month            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  ⚠️  Challenges Faced                                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Faced delays in getting meetings with procurement     │ │
│  │ teams. Some hospitals are in budget freeze until Q2.  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  ⚡ Next Week's Plan                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ • Follow up on 3 pending quotations                   │ │
│  │ • Schedule demos at 2 new hospitals                   │ │
│  │ • Attend medical equipment trade show in Nairobi      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  📝 Admin Notes (Optional)                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Add your review notes here...]                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  [💾 Save Notes]  [✅ Approve Report]  [❌ Request Revision] │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Actions Available**:
1. **Download PDF** - Get formatted PDF version
2. **Mark as Reviewed** - Change status to reviewed
3. **Approve Report** - Approve the report
4. **Request Revision** - Send back for corrections with notes
5. **Add Admin Notes** - Internal notes visible only to admins
6. **Print** - Print-friendly view
7. **Export** - Export to Excel/CSV

---

## 3. Quotations Management

### Quotations List View

**Features**:
- ✅ Priority-based sorting (high urgency first)
- ✅ Color-coded urgency indicators
- ✅ Filter by status, urgency, date, sales rep
- ✅ Quick response modal
- ✅ Bulk export

**Table Columns**:
| Urgency | Hospital | Equipment | Location | Contact | Sales Rep | Submitted | Status | Actions |
|---------|----------|-----------|----------|---------|-----------|-----------|--------|---------|
| 🔴 High | Nairobi General | X-Ray Machine | Nairobi | Dr. Smith | John Doe | 2h ago | ⏳ Pending | [📝 Respond] |
| 🟡 Medium | Mombasa Med | Ultrasound | Mombasa | Jane Lee | Mike Chen | 1d ago | ✅ Responded | [👁️ View] |
| 🟢 Low | Kisumu Hosp | Lab Equipment | Kisumu | Dr. Brown | Sarah Kim | 3d ago | ⏳ Pending | [📝 Respond] |

**Urgency Color Coding**:
- 🔴 **High** - Red background, bold text
- 🟡 **Medium** - Yellow background
- 🟢 **Low** - Green background

### Quotation Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  💰 Quotation Request #QUOT-2025-001234                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔴 URGENCY: HIGH                                            │
│                                                               │
│  🏥 Client Information:                                      │
│  Hospital: Nairobi General Hospital                          │
│  Location: Nairobi, Kenya                                    │
│  Contact: Dr. Jane Smith                                     │
│  Phone: +254712345678                                        │
│  Email: jane.smith@ngh.co.ke                                │
│                                                               │
│  📦 Equipment Requested:                                      │
│  X-Ray Machine Model 500                                     │
│                                                               │
│  👤 Requested By:                                            │
│  Sales Rep: John Doe (john.doe@accord.com)                  │
│  Phone: +254787654321                                        │
│  Submitted: January 20, 2025 at 10:30 AM                   │
│                                                               │
│  📊 Status: ⏳ Pending Response                               │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  📝 Your Response:                                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Compose response message...]                          │ │
│  │                                                         │ │
│  │                                                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
│  💵 Estimated Cost: KES [_______________]                    │
│                                                               │
│  📄 Attach Quotation Document:                               │
│  [📎 Choose File] or [Drag & Drop PDF]                      │
│                                                               │
│  [📧 Send Response] [💾 Save Draft] [🗑️ Mark as Not Viable] │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Response Workflow**:
1. Admin reviews quotation request
2. Calculates pricing
3. Prepares quotation document (PDF)
4. Uploads document
5. Writes response message
6. Sends response (notifies sales rep via email/app)
7. Sales rep downloads quotation and shares with client

---

## 4. Visits Management

### Visits Calendar View

**Features**:
- ✅ Monthly/weekly/daily calendar views
- ✅ Color-coded by visit purpose
- ✅ Click to view visit details
- ✅ Filter by sales rep, client type, location
- ✅ Export schedule

**Calendar Display**:
```
January 2025                                    [Month ▼] [Week] [Day]

Sun   Mon       Tue       Wed       Thu       Fri       Sat
      13        14        15        16        17        18
      
      🔵 Demo   🟢 Follow 🟡 Install 🔵 Demo  🟢 Follow
      Nairobi   Mombasa   Eldoret   Kisumu    Nakuru
      Hospital  Medical   Regional  Hospital  Clinic
      (John)    (Mike)    (Sarah)   (John)    (Jane)

      20        21        22        23        24        25
      
      🔵 Demo   🟢 Follow 🟡 Install ⚙️ Maint  🔵 Demo
      Thika     Nyeri     Machakos  Kitale    Kericho
      Clinic    Hospital  Medical   Hosp      Regional
      (Mike)    (John)    (Sarah)   (John)    (Jane)
```

**Color Legend**:
- 🔵 Blue - Demo/Sales visit
- 🟢 Green - Follow-up
- 🟡 Yellow - Installation
- ⚙️ Gray - Maintenance
- 🔴 Red - Urgent/High priority

### Visits List View

**Table Columns**:
| Date | Time | Client | Type | Purpose | Outcome | Sales Rep | Actions |
|------|------|--------|------|---------|---------|-----------|---------|
| Jan 20 | 9:00 AM | Nairobi General | Hospital | Demo | ✅ Successful | John Doe | [👁️ View] [📝 Edit] |
| Jan 20 | 2:00 PM | Mombasa Medical | Hospital | Follow-up | ⏳ Pending | Mike Chen | [👁️ View] [📞 Call] |

### Visit Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  👥 Visit Details - Nairobi General Hospital                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📅 Date: January 20, 2025                                  │
│  ⏰ Time: 9:00 AM                                            │
│  🎯 Purpose: Product Demonstration                           │
│  📊 Outcome: ✅ Successful                                    │
│                                                               │
│  🏥 Client Information:                                      │
│  Name: Nairobi General Hospital                              │
│  Type: Hospital                                              │
│  Location: Nairobi, Kenya                                    │
│                                                               │
│  👤 Contact Persons Met:                                     │
│  • Dr. Jane Smith (Procurement Manager)                     │
│    Phone: +254712345678                                      │
│    Email: jane.smith@ngh.co.ke                              │
│                                                               │
│  👨‍💼 Sales Rep: John Doe                                      │
│  📞 Phone: +254787654321                                     │
│  📧 Email: john.doe@accord.com                              │
│                                                               │
│  📝 Visit Notes: (from sales rep)                            │
│  Successfully demonstrated X-Ray Machine Model 500.          │
│  Procurement team showed strong interest. Requested          │
│  formal quotation with installation and training costs.      │
│                                                               │
│  ⏭️  Follow-up Required: ✅ Yes                               │
│  Next Steps: Send quotation by Jan 25                       │
│                                                               │
│  [📧 Email Report] [📥 Export] [🗑️ Delete]                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Engineering Services Management

See `BACKEND_REQUIREMENTS.md` for complete engineering services admin panel requirements.

**Key Features**:
- Assign services to engineers
- Track service progress
- View completed service reports
- Schedule recurring maintenance
- Generate service reports

---

## 6. User Management

### Users List View

**Features**:
- ✅ List all users (sales reps, engineers, admins)
- ✅ Filter by role, status, region
- ✅ Create new users
- ✅ Edit user details
- ✅ Deactivate/reactivate users
- ✅ Reset passwords

**Table Columns**:
| Name | Email | Phone | Role | Region | Status | Actions |
|------|-------|-------|------|--------|--------|---------|
| John Doe | john@accord.com | +254712... | Sales Rep | Nairobi | 🟢 Active | [✏️ Edit] [🔒 Reset PW] |
| Mike Chen | mike@accord.com | +254723... | Engineer | Mombasa | 🟢 Active | [✏️ Edit] [❌ Deactivate] |

### User Detail/Edit Form

```
┌─────────────────────────────────────────────────────────────┐
│  👤 User Profile - John Doe                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Personal Information:                                        │
│  First Name: [John          ]  Last Name: [Doe           ]  │
│  Email:      [john.doe@accord.com                        ]  │
│  Phone:      [+254712345678                              ]  │
│                                                               │
│  Role & Permissions:                                          │
│  Role:   [Sales Representative ▼]                           │
│  Region: [Nairobi ▼]                                         │
│  Status: [🟢 Active ▼]                                        │
│                                                               │
│  Permissions:                                                 │
│  ☑ Submit Reports                                            │
│  ☑ Create Quotations                                         │
│  ☑ Schedule Visits                                           │
│  ☐ Assign Engineering Services                              │
│  ☐ Manage Users                                              │
│  ☐ View Analytics                                            │
│                                                               │
│  Performance Metrics:                                         │
│  Reports Submitted: 52                                       │
│  Quotations Created: 38                                      │
│  Visits Completed: 145                                       │
│  Average Response Time: 2.3 hours                           │
│                                                               │
│  [💾 Save Changes] [🔒 Reset Password] [❌ Deactivate]       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Analytics & Reporting

### Analytics Dashboard

**Key Metrics to Display**:

1. **Sales Performance**
   - Total quotations by period
   - Conversion rates
   - Revenue pipeline
   - Win/loss ratio

2. **Activity Metrics**
   - Visits per week by sales rep
   - Average visits per day
   - Visit outcomes distribution
   - Follow-up rate

3. **Report Submission**
   - On-time submission rate
   - Average report quality score
   - Late submissions count

4. **Response Times**
   - Average quotation response time
   - Average report review time
   - Urgent quotation handling time

**Charts & Visualizations**:
```
Sales Pipeline by Month                    Visits by Client Type
┌─────────────────────┐                   ┌─────────────────────┐
│ [Bar Chart]         │                   │ [Pie Chart]         │
│ Jan: KES 2.5M       │                   │ Hospitals: 45%      │
│ Feb: KES 3.2M       │                   │ Clinics: 30%        │
│ Mar: KES 2.8M       │                   │ Labs: 15%           │
│ Apr: KES 4.1M       │                   │ Other: 10%          │
└─────────────────────┘                   └─────────────────────┘

Top Performing Sales Reps                 Quotation Response Times
┌─────────────────────┐                   ┌─────────────────────┐
│ 1. John Doe: 15     │                   │ [Line Graph]        │
│ 2. Jane Smith: 12   │                   │ Target: 24h         │
│ 3. Mike Chen: 10    │                   │ Avg: 18h            │
│ 4. Sarah Kim: 8     │                   │ Trending down ⬇     │
└─────────────────────┘                   └─────────────────────┘
```

### Export Options

**Available Exports**:
- 📊 Excel - All data tables
- 📄 PDF - Reports and summaries
- 📧 CSV - Raw data for analysis
- 📈 Power BI - Integration datasets

---

## 8. Notifications & Alerts

### Notification Center

**Features**:
- ✅ Real-time notifications
- ✅ Email notifications
- ✅ SMS alerts for urgent items
- ✅ Notification preferences

**Notification Types**:
```
┌─────────────────────────────────────────────────────────────┐
│  🔔 Notifications                              [Mark All Read]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🆕 New Report Submitted                               5m ago│
│  John Doe submitted weekly report for Jan 15-19              │
│  [View Report]                                               │
│                                                               │
│  🔴 Urgent Quotation Request                          15m ago│
│  High priority quotation from Nairobi General Hospital       │
│  [Respond Now]                                               │
│                                                               │
│  ✅ Service Completed                                  1h ago│
│  Engineer Mike completed service at Mombasa Medical          │
│  [View Report]                                               │
│                                                               │
│  📅 Visit Scheduled                                    2h ago│
│  Jane Smith scheduled visit at Kisumu Hospital tomorrow      │
│  [View Details]                                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Email Notification Templates**:

1. **New Report Submitted**
```
Subject: New Weekly Report - John Doe (Jan 15-19)

Hi Admin,

A new weekly report has been submitted:

Sales Rep: John Doe
Week: January 15-19, 2025
Submitted: January 19 at 5:30 PM

Key Highlights:
• 5 customer visits completed
• 3 quotations generated (KES 2.5M total)
• 4 new leads identified

View full report: [Link]
Download PDF: [Link]

---
ACCORD Admin System
```

2. **Urgent Quotation Alert**
```
Subject: 🔴 URGENT: Quotation Request - Nairobi General Hospital

Hi Admin,

A high-priority quotation request requires immediate attention:

Hospital: Nairobi General Hospital
Equipment: X-Ray Machine Model 500
Urgency: HIGH
Contact: Dr. Jane Smith (+254712345678)
Requested by: John Doe

Please respond within 24 hours.

Respond now: [Link]

---
ACCORD Admin System
```

---

## 9. UI/UX Specifications

### Design System

**Colors**:
- Primary: #00aeef (Accord Blue)
- Secondary: #0096d6 (Darker Blue)
- Success: #10b981 (Green)
- Warning: #f59e0b (Orange)
- Danger: #ef4444 (Red)
- Gray: #6b7280

**Typography**:
- Headings: Inter, 600 weight
- Body: Inter, 400 weight
- Monospace: Fira Code

**Component Library**:
- Use shadcn/ui or Material-UI
- Consistent spacing (4px grid)
- Rounded corners (8px-16px)
- Neumorphic shadows for cards

### Responsive Design

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Considerations**:
- Touch-friendly buttons (min 44px)
- Collapsible sidebars
- Bottom navigation for admins on mobile
- Swipe gestures for actions

### Accessibility

**Requirements**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode
- Focus indicators
- Alt text for images
- ARIA labels

### Performance

**Targets**:
- Initial load: < 2 seconds
- Time to interactive: < 3 seconds
- Page transitions: < 300ms
- API response time: < 500ms

---

## Implementation Checklist

### Phase 1: Core Functionality (Week 1-2)
- [ ] User authentication & authorization
- [ ] Dashboard with statistics cards
- [ ] Reports list view
- [ ] Report detail view with PDF download
- [ ] Quotations list view
- [ ] Quotation response form
- [ ] Basic notifications

### Phase 2: Enhanced Features (Week 3-4)
- [ ] Visits calendar view
- [ ] Visits list view
- [ ] Engineering services management
- [ ] User management
- [ ] Admin notes system
- [ ] Bulk actions
- [ ] Export functionality

### Phase 3: Analytics & Polish (Week 5-6)
- [ ] Analytics dashboard
- [ ] Charts and visualizations
- [ ] Advanced filtering
- [ ] Email notification templates
- [ ] SMS alerts
- [ ] Mobile responsive design
- [ ] Accessibility improvements
- [ ] Performance optimization

---

## Technical Stack Recommendations

### Frontend
- **Framework**: Next.js 14 or React + Vite
- **UI Library**: shadcn/ui or Material-UI
- **State Management**: Zustand or Redux Toolkit
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts or Chart.js
- **Tables**: TanStack Table (React Table)
- **Date Pickers**: react-day-picker
- **PDF Viewer**: react-pdf

### Backend
- **Framework**: Node.js + Express or NestJS
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer + AWS S3
- **PDF Generation**: Puppeteer or PDFKit
- **Email**: Nodemailer + SendGrid/AWS SES
- **SMS**: Twilio or Africa's Talking

### Deployment
- **Frontend**: Vercel or Netlify
- **Backend**: AWS EC2, DigitalOcean, or Heroku
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3 or DigitalOcean Spaces
- **CDN**: Cloudflare
- **Monitoring**: Sentry + LogRocket

---

## Summary

This admin panel provides comprehensive management of:

✅ **Weekly Reports** - Review, approve, download PDFs
✅ **Quotations** - Respond to requests, attach documents
✅ **Visits** - Calendar view, track outcomes
✅ **Engineering Services** - Assign, track, review
✅ **Users** - Manage team members, permissions
✅ **Analytics** - Performance metrics, trends
✅ **Notifications** - Real-time alerts, email/SMS

The interface is designed to be intuitive, responsive, and efficient for admins to process high volumes of submissions while maintaining quality oversight.
