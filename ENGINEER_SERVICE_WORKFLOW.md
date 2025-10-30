# Engineer Service Workflow Guide

## Overview
Engineers can receive service duties from the admin and fill/submit reports using the same interface they use for self-created services.

## Complete Workflow

### 1. Admin Creates Service Assignment
- Admin logs into admin panel
- Creates new engineering service
- Assigns it to specific engineer
- Service status: **"assigned"**
- Engineer receives the service in their "My Services" list

### 2. Engineer Receives & Views Service
- Engineer logs in with engineer role
- Navigates to **"My Services"** tab
- Sees all assigned services with filters:
  - **All Services** - Shows everything
  - **Assigned** - Shows new duties (yellow badge)
  - **In Progress** - Shows started services (blue badge)
  - **Completed** - Shows finished services (green badge)

### 3. Engineer Starts Service (Status: Assigned → In Progress)
**Steps:**
1. Click on service card to view details
2. Review service information:
   - Facility name and location
   - Scheduled date/time
   - Machine details
   - Service type (Installation/Maintenance/Repair/Service)
3. Click **"Start Service"** button
4. Fill required field:
   - **Condition Before Service*** (required)
   - Describe machine errors, issues, problems found
5. Click **"Start Service"** button (blue)
6. System updates status to **"in-progress"**

### 4. Engineer Completes Service (Status: In Progress → Completed)
**Steps:**
1. Click on the in-progress service
2. Click **"Update Report"** button
3. Fill all required fields:
   - **Condition Before Service*** - Already filled, can update
   - **Condition After Service*** (required) - Describe final state, tests passed, operational status
   - **Work Done / Notes** - Parts replaced, procedures performed, recommendations
   - **Other Personnel** (optional) - Hospital technicians present, their names
   - **Next Service Date** (optional) - When should next service be scheduled
4. Click **"Complete Service"** button (green)
5. System updates status to **"completed"**
6. Report is submitted to backend

## Form Fields Reference

### Required Fields (Cannot submit without these):
- ✅ **Condition Before Service** - Must be filled before starting
- ✅ **Condition After Service** - Must be filled before completing

### Optional Fields:
- ⭕ **Work Done / Notes** - Recommended but not required
- ⭕ **Other Personnel** - Names of assistants/hospital staff
- ⭕ **Next Service Date** - Future maintenance scheduling

## Example Service Report

### Sample "Condition Before Service":
```
Machine not powering on. Display shows error code E204. 
Customer reports issue started after power outage yesterday.
No visible damage to external components.
```

### Sample "Condition After Service":
```
Replaced damaged power supply unit (PSU).
Replaced blown capacitors C5 and C6.
Machine powers on successfully.
All diagnostic tests passed.
Display shows no errors.
Machine operational and calibrated.
```

### Sample "Work Done / Notes":
```
Work Performed:
- Replaced PSU (Part #12345-PSU-500W)
- Replaced capacitors C5, C6 (Part #67890-CAP-470uF)
- Performed full system diagnostics
- Calibrated sensors to factory specifications
- Tested all machine functions

Recommendations:
- Install surge protector to prevent future damage
- Schedule preventive maintenance in 3 months
- Train staff on proper shutdown procedures
```

### Sample "Other Personnel":
```
Hospital Technician: John Kamau, Radiology Department Head: Dr. Sarah Wanjiku
```

## Status Flow

```
ASSIGNED → IN PROGRESS → COMPLETED
   ↓            ↓             ↓
Start        Update        Final
Service      Report       Report
```

## API Integration

All form submissions call:
```
PUT https://app.codewithseth.co.ke/api/engineering-services/{serviceId}

Headers:
- Authorization: Bearer {token}
- Content-Type: application/json

Body (Start Service):
{
  "status": "in-progress",
  "conditionBefore": "...",
  "notes": "Started at [timestamp]"
}

Body (Complete Service):
{
  "status": "completed",
  "conditionBefore": "...",
  "conditionAfter": "...",
  "notes": "...",
  "otherPersonnel": ["..."],
  "nextServiceDate": "2025-01-15T00:00:00.000Z"
}
```

## Features Implemented

✅ **Admin assigns services** - Backend creates service with status="assigned"
✅ **Engineer receives services** - Shows in "My Services" list with yellow "ASSIGNED" badge
✅ **Same form for all services** - Whether admin-created or self-created, same interface
✅ **Start service workflow** - Fill condition before, changes status to in-progress
✅ **Complete service workflow** - Fill complete report, changes status to completed
✅ **Form validation** - Required fields must be filled before submission
✅ **Real-time updates** - After submission, service list refreshes automatically
✅ **Status filtering** - Filter by assigned/in-progress/completed
✅ **Timestamps** - Shows created and last updated dates

## Backend Requirements

For this workflow to function, backend must:
1. ✅ Implement POST /api/engineering-services (admin creates service)
2. ✅ Implement GET /api/engineering-services?engineerId={id} (engineer fetches services)
3. ✅ Implement PUT /api/engineering-services/{id} (engineer updates status/reports)
4. ✅ Support status transitions: assigned → in-progress → completed
5. ✅ Validate required fields (conditionBefore for start, conditionAfter for complete)

See `BACKEND_REQUIREMENTS.md` for complete implementation details.

## Testing Checklist

### Admin Side:
- [ ] Create service assignment via admin panel
- [ ] Select engineer from dropdown
- [ ] Fill facility details and machine info
- [ ] Set scheduled date
- [ ] Service appears with status="assigned"

### Engineer Side:
- [ ] Login with engineer role account
- [ ] Navigate to "My Services" tab
- [ ] See assigned service with yellow badge
- [ ] Click service to view details
- [ ] Click "Start Service"
- [ ] Fill "Condition Before Service"
- [ ] Submit successfully (status → in-progress, blue badge)
- [ ] Click service again
- [ ] Click "Update Report"
- [ ] Fill "Condition After Service" and other fields
- [ ] Click "Complete Service"
- [ ] Submit successfully (status → completed, green badge)
- [ ] Verify report saved in database

## Summary

✅ **Engineers receive services created by admin** - Shows in their list
✅ **Same interface for all services** - No difference between admin-created and self-created
✅ **Complete form workflow** - Start → Fill → Complete → Submit
✅ **Real-time status updates** - Immediate feedback on submission
✅ **Validation ensures completeness** - Cannot submit incomplete reports

**The implementation is complete and ready for use!**
