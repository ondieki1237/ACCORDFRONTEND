# Leads Management Feature

## Overview
The Leads section has been added to replace the Quotations section in the ACCORD mobile application. This feature allows sales representatives to capture comprehensive lead information during field visits.

## What Was Changed

### 1. New Components Created
- **`components/leads/lead-form.tsx`** - Comprehensive form for capturing lead information
- **`components/leads/lead-list.tsx`** - Display and search leads with filtering
- **`components/leads/lead-management.tsx`** - Main management wrapper component

### 2. Updated Core Files

#### `lib/api.ts`
Added new API methods for leads management:
- `getLeads(page, limit, filters)` - Fetch leads with pagination and filters
- `getLeadById(leadId)` - Get single lead details
- `createLead(leadData)` - Create new lead (with offline support)
- `updateLead(leadId, leadData)` - Update existing lead
- `deleteLead(leadId)` - Delete a lead

#### `lib/offline-storage.ts`
Extended offline storage to support leads:
- `cacheLeads()` - Cache leads data locally
- `getCachedLeads()` - Retrieve cached leads
- Added leads to pending sync queue
- Updated sync methods to include leads

#### `app/page.tsx`
- Replaced `QuotationManagement` with `LeadManagement`
- Updated navigation from "Quotes" to "Leads"
- Changed icon from `ClipboardList` to `TrendingUp`
- Updated page routing to use "leads" instead of "quotations"

## Lead Form Fields

### 1. Facility Information
- **Facility Name** (required) - Name of the healthcare facility
- **Facility Type** - Hospital, Clinic, Diagnostic Center, Laboratory, Pharmacy, Medical Center, Other
- **Hospital Level** - Level 1-6, Private Hospital, Other
- **Location** (required) - Physical address
- **Current Equipment** - Existing medical equipment at the facility

### 2. Contact Person
- **Full Name** (required) - Primary contact person
- **Role/Position** - Their position in the facility
- **Phone Number** (required) - Contact phone
- **Email Address** - Contact email

### 3. Equipment of Interest
- **Equipment Name/Description** (required) - What they're interested in buying
- **Category** - Imaging, Laboratory, Surgical, Patient Monitoring, Diagnostic, Life Support, Other
- **Quantity Needed** - Number of units required
- **Pain Points/Requirements** - Problems they're trying to solve

### 4. Budget & Timeline
- **Estimated Budget** - Amount with currency (KES, USD, EUR)
- **Expected Purchase Date** - When they plan to buy
- **Urgency / Timeline** - Open text field for flexibility (e.g., "2 days", "3 months", "1 year", "ASAP")

### 5. Competitor Analysis
- **Competitor Information & Analysis** - Single comprehensive field for:
  - Competitors being considered
  - Competitor strengths and weaknesses
  - Why they should choose us
  - Competitor pricing or offers
  - Our competitive advantages

### 6. Additional Information
- **Lead Source** - Field Visit, Phone Call, Email, Referral, Event, Website, Other
- **Lead Status** - New, Contacted, Qualified, Proposal Sent, In Negotiation, Won, Lost
- **Additional Notes** - Any other relevant information

## Features

### Offline Support
- ✅ Create leads while offline - saved locally
- ✅ Automatic sync when connection restored
- ✅ Cached leads available offline
- ✅ Offline indicator in the UI

### Mobile-Optimized
- ✅ Touch-friendly form controls
- ✅ Mobile-first responsive design
- ✅ Smooth animations and transitions
- ✅ Bottom navigation for easy access

### Search & Filter
- ✅ Search by facility name, location, contact, or equipment
- ✅ Visual statistics dashboard
- ✅ Status and priority badges
- ✅ Quick access to lead details

## Navigation Location

The Leads section replaces Quotations in the bottom navigation bar:
- **Position**: 4th icon from left
- **Icon**: TrendingUp (📈)
- **Label**: "Leads"

## Backend Requirements

The backend API should implement these endpoints:

```
GET    /api/leads              - Get all leads (with pagination)
GET    /api/leads/:id          - Get single lead
POST   /api/leads              - Create new lead
PUT    /api/leads/:id          - Update lead
DELETE /api/leads/:id          - Delete lead
```

Expected lead data structure matches the form fields above.

## Testing Checklist

- [ ] Create a new lead while online
- [ ] Create a new lead while offline
- [ ] Verify offline lead syncs when online
- [ ] Search and filter leads
- [ ] View lead details
- [ ] Edit existing lead
- [ ] Delete a lead
- [ ] Check mobile navigation works
- [ ] Verify all form validations
- [ ] Test on Android device (via Capacitor)

## Notes

- All form fields follow the ACCORD design system (blue/cyan gradient theme)
- Forms include proper validation and error handling
- Offline/online status is clearly indicated
- The component integrates seamlessly with existing mobile optimizations
- Background tracking and permissions remain unchanged
