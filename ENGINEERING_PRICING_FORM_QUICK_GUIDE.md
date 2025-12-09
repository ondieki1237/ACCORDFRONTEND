# Engineering Pricing Form - Quick Reference

## 🎯 What Changed?

### Before ❌
- Manual entry for all machine details
- "Claim" terminology
- No machine search functionality
- Engineers had to remember facility/location details

### After ✅
- Smart machine search for Maintenance/Service
- "Fill" terminology (more user-friendly)
- 3-way sorting (Facility, Location, Machine)
- Auto-populated facility and location
- Mobile-optimized interface

---

## 🔄 Form Behavior by Activity Type

| Feature | Installation | Maintenance | Service | Pre-visit |
|---------|-------------|------------|---------|-----------|
| Machine Search | ❌ | ✅ | ✅ | ❌ |
| Auto-fill Fields | ❌ | ✅ | ✅ | ❌ |
| Manual Entry | ✅ | ✅ | ✅ | ✅ |
| Sort Options | ❌ | ✅ | ✅ | ❌ |

---

## 🎬 Form Walkthrough

### Step 1: Choose Activity Type
```
[ 🔧 Installation  ]
[ 🛠️ Maintenance  ] ← Select this to get machine search
[ ⚙️ Service      ] ← Or this
[ 👁️ Pre-visit     ]
```

### Step 2: Enter Transport Fare
```
Transport Fare (KES): [________] e.g. 1500
```

### Step 3A: For Maintenance/Service - Search Machine
```
Search Machine * 

[ Sort by Facility  ] [ Sort by Location ] [ Sort by Machine ]

🔍 Search machine name, model, facility, location...

╔═══════════════════════════════════════╗
║ Results:                              ║
║                                       ║
║ ✓ X-Ray Scanner PRO (Model XR-2000) ║
║   🏥 Kenyatta National Hospital       ║
║   📍 Nairobi CBD                      ║
║   Next Service: Jan 15, 2026          ║
║                                       ║
║ ✓ CT Scanner (Model CT-5000)         ║
║   🏥 Nairobi Hospital                 ║
║   📍 Upper Hill                       ║
║   Next Service: Feb 1, 2026           ║
║                                       ║
╚═══════════════════════════════════════╝
```

### Step 3B: After Selection
```
✓ Selected: X-Ray Scanner PRO
  Model XR-2000 • Kenyatta National Hospital

Location: [Nairobi CBD          ] (Auto-filled, read-only)
Facility: [Kenyatta National...] (Auto-filled, read-only)
```

### Step 3C: For Installation/Pre-visit - Manual Entry
```
Location: [e.g. Nairobi CBD] (Manual entry)
Facility: [e.g. Hospital  ] (Manual entry)
Machine:  [e.g. X-Ray 500 ] (Manual entry)
```

### Step 4: Add Other Charges (Optional)
```
Other Charges

[+ Add Charge]

Description: [e.g. Lunch]     Amount: [500 KES]
[X] Description: [Accommodation] Amount: [1000 KES]
```

### Step 5: Review Total
```
Total Expenses: KES 3,000.00
```

### Step 6: Submit
```
[✓ Submit Expense Details] [Cancel]
```

---

## 🔍 Search & Sort Examples

### Sort by Facility
```
Facilities are alphabetically sorted:
- Apollo Hospitals
- Aga Khan Hospital
- Kenyatta National Hospital
- Nairobi Hospital
```

### Sort by Location
```
Locations are alphabetically sorted:
- Heliopolis
- Nairobi CBD
- Upper Hill
- Westlands
```

### Sort by Machine
```
Machines are alphabetically sorted:
- CT Scanner
- Dialysis Machine
- Ultrasound Machine
- X-Ray Scanner
```

---

## ✨ Smart Features

### 🔄 Real-time Search
Type as you search - results update instantly:
```
"X" → Shows all machines/facilities with X
"X-Ray" → Narrows to X-Ray machines
"Nairobi" → Shows machines in Nairobi
```

### 🏷️ Visual Badges
```
🏥 Facility Name (Emerald Green)
📍 Location Name (Blue)
📅 Next Service Date (Gray)
```

### ⚡ Auto-Population
When you select a machine:
```
Location field: Auto-filled ✓ (read-only)
Facility field: Auto-filled ✓ (read-only)
Machine ID: Sent to backend for tracking
```

### ⚠️ Error Handling
If machine API fails:
```
"Warning: Could not load machines list. 
You can still enter details manually."
```

---

## 📱 Mobile Experience

- **Large touch targets:** 44px+ buttons
- **Scrollable dropdown:** Max 256px height
- **Responsive layout:** Adapts to small screens
- **Loading feedback:** Spinner while fetching
- **One-tap selection:** Click to select machine
- **Keyboard friendly:** Optimized input fields

---

## 🐛 Bug Fixes Included

1. ✅ Select dropdown empty value error - FIXED
2. ✅ filteredMachines.map runtime error - FIXED
3. ✅ Type safety checks added throughout
4. ✅ Graceful error handling for API failures

---

## 📊 Technical Details

### API Calls
```javascript
// When Maintenance/Service selected
GET /api/machines (limit: 1000)
// Returns array of Machine objects with facility details
```

### State Management
```javascript
machines[]           // All machines from API
filteredMachines[]   // Search/sort results
selectedMachine{}    // Currently selected machine
searchQuery          // Current search text
sortBy               // Current sort field
showMachineList      // Dropdown visibility
```

### Form Data Sent to Backend
```javascript
{
  engineerId: string
  activityType: string // maintenance | service | installation | previsit
  fare: number
  location: string
  facility: string
  machineId?: string   // NEW: Machine ID if maintenance/service
  otherCharges: [{
    description: string
    amount: number
  }]
}
```

---

## ✅ Ready to Use

The form is now:
- **Mobile-friendly** for field engineers
- **Intelligent** with machine search
- **Fast** with auto-population
- **Reliable** with error handling
- **Production-ready** with no errors

Deploy with confidence! 🚀
