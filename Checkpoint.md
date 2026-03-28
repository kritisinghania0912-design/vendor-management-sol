# VendorSecure — Build Checkpoints

## Overview
Vendor Management System (VMS) for small startups. Frontend (Vite React, port 3000) calls backend (Node.js Express, port 5000) which serves data from local CSV files.

---

## Checkpoint 1: Backend Setup
- [ ] Create `backend/` folder with `package.json`
- [ ] Install dependencies: `express`, `cors`, `csv-parser`
- [ ] Create `backend/data/` folder with all CSV files:
  - `vendors.csv` — Vendor_Master
  - `finance_ledger.csv` — Finance_Ledger
  - `compliance_tickets.csv` — Compliance_Tickets
  - `transport_cars.csv` — Transport_Cars
  - `transport_drivers.csv` — Transport_Drivers
  - `transport_trip_logs.csv` — Transport_Trip_Logs
  - `food_vendor_details.csv` — Food_Vendor_Details
  - `food_staff.csv` — Food_Staff
  - `food_item_catalog.csv` — Food_Item_Catalog
  - `food_daily_service.csv` — Food_Daily_Service
  - `food_menu_mapping.csv` — Food_Menu_Mapping
  - `it_asset_master.csv` — IT_Asset_Master
  - `it_software_details.csv` — IT_Software_Details
  - `it_hardware_details.csv` — IT_Hardware_Details
- [ ] Create `backend/index.js` — Express server with REST endpoints
- [ ] REST API routes:
  - `GET /api/vendors` — all vendors
  - `GET /api/vendors/:id` — single vendor
  - `GET /api/finance` — finance ledger
  - `GET /api/issues` — compliance tickets
  - `POST /api/issues` — create ticket
  - `GET /api/transport/cars` — vehicle registry
  - `GET /api/transport/drivers` — driver registry
  - `GET /api/transport/trips` — trip logs
  - `POST /api/transport/trips` — add trip log
  - `GET /api/food/services` — food daily services
  - `POST /api/food/services` — add food service
  - `GET /api/food/staff` — food staff
  - `GET /api/food/catalog` — food item catalog
  - `GET /api/it/assets` — IT asset master
  - `GET /api/it/software` — IT software details
  - `POST /api/it/software` — add software record
  - `GET /api/it/hardware` — IT hardware details
  - `POST /api/it/hardware` — add hardware record

---

## Checkpoint 2: Frontend Scaffolding
- [ ] Create `frontend/` with `vite@latest` React JS project
- [ ] Configure Vite to run on port 3000
- [ ] Install dependencies: `react-router-dom`
- [ ] Set up folder structure:
  - `src/pages/` — Dashboard, Issues, Pulse, Registry
  - `src/components/` — Sidebar, Header, Table, Modal, Pagination
  - `src/styles/` — global CSS, component CSS
  - `src/api/` — API helper functions
- [ ] Configure React Router with routes for all 4 pages

---

## Checkpoint 3: Shared Components
- [ ] **Sidebar** — Left nav with Logo (VendorSecure), icons + labels: Dashboard, Issues, Pulse, Registry. Active state highlight.
- [ ] **Header** — "Hi Kriti!" greeting, notification bell icon, user profile icon. Fixed at top.
- [ ] **DataTable** — Reusable table with: column headers, sortable columns, filter dropdown, pagination ("Showing X out of Y entries"), row actions (view/edit/archive).
- [ ] **Modal** — Reusable popup with form fields, Save + Cancel buttons.
- [ ] **Pagination** — Page number buttons (1, 2, 3...) with prev/next arrows.
- [ ] **VendorSelector** — Dropdown to switch between Transport / Food / IT vendor context.

---

## Checkpoint 4: Dashboard Page
- [ ] Summary KPI cards (total vendors, active issues, pending invoices, compliance score)
- [ ] Active Issues preview list (top compliance tickets)
- [ ] Vendor category breakdown
- [ ] Recent activity feed

---

## Checkpoint 5: Issues Page (`/issues`)
- [ ] Table showing Compliance_Tickets data
- [ ] Columns: TicketID, VendorID, ReportDate, RiskLevel, Priority, Category, Description, Status
- [ ] Filter by: RiskLevel, Priority, Category, Status
- [ ] Sort by any column
- [ ] Pagination (10 per page)
- [ ] "Add Issue" button → Modal with form fields

---

## Checkpoint 6: Pulse Page (`/pulse`)
- [ ] Vendor type tabs/selector: Transport | Food | IT
- [ ] **Transport Pulse**: Table of Transport_Trip_Logs (TripID, CarID, DriverID, EmployeeID, TripDate, PickupTime, DropTime, PickupLocation, DropLocation, DistanceDriven_KM, IncidentReported)
  - "Add Data" → Modal with all trip fields
- [ ] **Food Pulse**: Table of Food_Daily_Service (ServiceID, VendorID, ServiceDate, MealType, PricePerPlate, PlatesBilledByVendor, ActualBadgesSwiped, MappingID, ServiceID, ItemID)
  - "Add Data" → Modal with food service fields
- [ ] **IT Pulse**: Table of IT Software + Hardware (toggle between Software/Hardware tabs)
  - Software: AssetID, CurrentVersion, IsAutoRenewed, RenewalDate, TotalLicensesPurchased, ActiveLicensesUsed, DataPrivacyStatus
  - Hardware: AssetID, ManufacturerDate, SerialNumber, MAC_Address, WarrantyExpiryDate, MaintenanceCost, HardwareStatus
  - "Add Data" → Modal with Software/Hardware toggle tabs
- [ ] Filter + Sort on all tables
- [ ] Pagination (10 per page)

---

## Checkpoint 7: Registry Page (`/registry`)
- [ ] Vendor type selector: Transport | Food | IT
- [ ] **Transport Registry**: Combined view of Transport_Cars + Transport_Drivers
  - Cars: CarID, VendorID, CarNumber, CarModel, CarType, SeatingCapacity, PUC_Status, PUC_ExpiryDate, InsuranceExpiryDate, GPSTrackerID
  - Drivers: DriverID, VendorID, Name, LicenseNumber, LicenseExpiryDate, BGV_Status, LanguagesSpoken
- [ ] **Food Registry**: Food_Staff + Food_Item_Catalog
  - Staff: StaffID, VendorID, Name, BGV_Status, MedicalFitness_ExpiryDate, TrainingCertStatus
  - Catalog: ItemID, VendorID, ItemName, Calories, DietaryType, AllergensInfo
- [ ] **IT Registry**: IT_Asset_Master (AssetID, VendorID, AssetName, AssetCategory, BasePrice, BillingCycle, SupportIncluded)
- [ ] "Add Asset" button → Modal popup
- [ ] Row actions: View, Edit, Archive
- [ ] Filter + Sort + Pagination

---

## Checkpoint 8: API Wiring & Data Flow
- [ ] All pages fetch data from backend via `fetch('/api/...')`
- [ ] Frontend proxy configured in `vite.config.js` to route `/api` → `localhost:5000`
- [ ] POST endpoints update CSV files on disk
- [ ] Loading states and empty states handled in UI

---

## Checkpoint 9: Final Styling
- [ ] Match wireframe layout: left sidebar (dark/accent), white main content
- [ ] Blue (#1a73e8 or similar) CTA buttons ("Add Data", "Add Asset")
- [ ] Table row hover states
- [ ] Compliance expiry warnings styled red/amber
- [ ] Responsive layout for standard desktop viewport
- [ ] Favicon and app title "VendorSecure"
