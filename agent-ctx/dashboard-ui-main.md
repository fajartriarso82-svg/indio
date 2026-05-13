# Task: Staff Dashboard UI Components

## Summary
Created 8 component files in `/home/z/my-project/src/components/dashboard/` and updated `page.tsx` to use the new `DashboardLayout` component instead of the old `StaffDashboard`.

## Files Created

### 1. `DashboardLayout.tsx`
- Main dashboard shell with top navbar, left sidebar, and content area
- Sidebar with navigation: Dashboard, Projects, Clients, Vendors
- Mobile responsive (sidebar collapses on mobile with overlay)
- Manages `activeModule` state and renders the corresponding module
- Props: `{ staff, onLogout }`

### 2. `DashboardHome.tsx`
- Overview page with 4 stat cards (Active Projects, Total Clients, Total Vendors, Pending Invoices)
- Recent projects list (fetches from `/api/projects?limit=5`)
- Quick action buttons that navigate to other modules
- Pro tip card

### 3. `ClientModule.tsx`
- Full CRUD for clients with table listing, search
- Add/Edit dialog with fields: name, address, phone, email, picName, picPhone, picEmail, type (dropdown), notes
- Delete confirmation dialog with AlertDialog
- Fetches from `/api/clients` and `/api/clients/[id]`

### 4. `VendorModule.tsx`
- Full CRUD for vendors with table listing, search
- Add/Edit dialog with fields: name, address, phone, email, picName, picPhone, category (dropdown), bankName, bankAccount, bankHolder, notes
- Delete confirmation dialog
- Fetches from `/api/vendors` and `/api/vendors/[id]`

### 5. `ProjectModule.tsx`
- Project list view with search, filter by type (PENGADAAN/JASA) and status
- Table with project info, type badge, client, status badge, items count
- Clicking a row navigates to ProjectDetail
- New Project button opens ProjectForm dialog

### 6. `ProjectForm.tsx`
- Dialog for creating projects
- Project type selector, name, client dropdown (auto-fills PIC info), PO number, internal PIC
- Dynamic items table with add/remove rows, auto-calculated totals
- Grand total display with IDR currency formatting
- Submits via POST `/api/projects`

### 7. `ProjectDetail.tsx`
- Full project detail with back button and status update actions
- 3 tabs: Info, RAB, Documents
- **Info tab**: Project summary card, Laba/Rugi calculator (PO total vs actual costs), Progress notes (add/view)
- **RAB tab**: Items list with purchase actions per item (split purchases from vendors), Additional costs section (ACCESSORIES, SHIPPING, OPERATIONAL, OTHER)
- **Documents tab**: Surat Jalan list + create, BAST list + create, Invoice list + create, Kuitansi list + create

### 8. `DocumentFormDialogs.tsx`
- `SuratJalanForm`: SJ number, date, checker/driver names, items (select from project items or manual)
- `BASTForm`: BAST number, date, import from Surat Jalan, items
- `InvoiceForm`: Invoice number, date, due date, payment method (CASH/TEMPO/TERMIN), items with amounts, termin schedule for TERMIN method
- `KuitansiForm`: Kuitansi number, date, amount, payment method (CASH/TRANSFER/TEMPO), link to Invoice/BAST, items

## Files Modified

### `page.tsx`
- Added import: `import DashboardLayout from '@/components/dashboard/DashboardLayout'`
- Changed `<StaffDashboard staff={staff} onLogout={handleLogout} />` to `<DashboardLayout staff={staff} onLogout={handleLogout} />`

## Verification
- ESLint: ✅ No errors
- Next.js Build: ✅ Successful build with all routes
