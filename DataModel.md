1. Core Master Tables (Applies to all Vendors)
These tables act as the central nervous system of your dashboard.
Vendor_Master (Static)
VendorID (Primary Key)
VendorCategory (Enum: Transport, Food, IT)
CompanyName, GSTIN, Address
POC_Name, POC_Phone, POC_Email, EscalationContact
BankAccountNo, IFSC_Code
MSA_StartDate, MSA_EndDate
Finance_Ledger (Finance)
InvoiceID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
BilledDate, DueDate, PeriodStartDate, PeriodEndDate
TotalAmountBilled, AmountPaid, AmountDue
PaymentStatus (Enum: Pending, Partial, Fully Paid)
InvoiceDocumentLink
Compliance_Tickets (Compliance)
TicketID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
ReportDate, RiskLevel (Enum: Low, Medium, High)
Priority (Enum: P0, P1, P2, P3, P4)
Category (Enum: Expiry, Discrepancy, Safety, Employee Complaint)
Description, ActionTaken, Status (Open, In-Progress, Resolved)

🚕 2. Transport Vendor Domain
Transport_Cars (Static Asset)
CarID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
CarNumber, CarModel, CarType, SeatingCapacity
PUC_Status, PUC_ExpiryDate
InsuranceExpiryDate, GPSTrackerID
Transport_Drivers (Static Asset)
DriverID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
Name, VendorEmployeeID, DOB, Gender
LicenseNumber, LicenseExpiryDate
GovID_Type, GovID_Number, BGV_Status
LanguagesSpoken
Transport_Trip_Logs (Dynamic)
TripID (Primary Key)
CarID (Foreign Key -> Transport_Cars)
DriverID (Foreign Key -> Transport_Drivers)
EmployeeID (Foreign Key -> Your Company's HR DB)
TripDate, PickupTime, DropTime
PickupLocation, DropLocation
DistanceDriven_KM, IncidentReported (Boolean)

🥗 3. Food Vendor Domain
Food_Vendor_Details (Static - Extension of Master)
VendorID (Primary Key, Foreign Key -> Vendor_Master)
FSSAI_Number, FSSAI_ExpiryDate
PestControlCert_Expiry, WaterQualityStatus
Food_Staff (Static Asset)
StaffID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
Name, VendorEmployeeID, DOB
GovID_Number, BGV_Status, TrainingCertStatus
MedicalFitness_ExpiryDate
Food_Item_Catalog (Static Asset)
ItemID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
ItemName, Calories, DietaryType (Veg/Non-Veg/Vegan)
AllergensInfo, IngredientsList
Food_Daily_Service (Dynamic)
ServiceID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
ServiceDate, MealType (Breakfast, Lunch, Snacks, Dinner)
PricePerPlate
PlatesBilledByVendor, ActualBadgesSwiped (Admin uses this to check for billing discrepancies)
Food_Menu_Mapping (Dynamic Linking)
MappingID (Primary Key)
ServiceID (Foreign Key -> Food_Daily_Service)
ItemID (Foreign Key -> Food_Item_Catalog)

💻 4. IT Vendor Domain
IT_Asset_Master (Static Asset)
AssetID (Primary Key)
VendorID (Foreign Key -> Vendor_Master)
AssetName, AssetCategory (Software, Hardware, WiFi)
BasePrice, BillingCycle (Monthly/Yearly)
ManagerApprovalRequired (Boolean)
SupportIncluded (Boolean)
IT_Software_Details (Dynamic & Static)
AssetID (Primary Key, Foreign Key -> IT_Asset_Master)
CurrentVersion, IsAutoRenewed (Boolean), RenewalDate
TotalLicensesPurchased, ActiveLicensesUsed (Admin checks this for waste)
DataPrivacyStatus
IT_Hardware_Details (Dynamic & Static)
AssetID (Primary Key, Foreign Key -> IT_Asset_Master)
ManufacturerDate, SerialNumber, MAC_Address
WarrantyExpiryDate, MaintenanceCost
HardwareStatus (Working, Needs Repair, Decommissioned)

🔗 Key Relationships Explained
One-to-Many (1:N): One Vendor can have many Invoices, Compliance Tickets, and Assets (Cars, Drivers, Food Items, Software).
Many-to-Many (M:N): Food menus are M:N. One daily service (e.g., Monday Lunch) contains many Food Items, and one Food Item (e.g., Rice) can appear in many daily services. The Food_Menu_Mapping table bridges this.
Cross-Referencing: The Transport_Trip_Logs table perfectly ties together your Driver, Car, and your Employee for dynamic tracking.
5. Admin Domain
To manage multiple vendor types, finances, and compliance, you will need Role-Based Access Control (RBAC). You don't want a Transport Admin accidentally approving an IT software invoice, and you definitely need an audit trail when a high-risk compliance ticket is closed.
Here is the data model to support the Admin side of your dashboard:
🛡️ 1. Core Admin & Access Control
These tables manage the identities and access levels of the internal employees managing the dashboard.
Admin_Users (The Profile)
AdminID (Primary Key)
EmployeeID (Foreign Key -> Your internal HR DB)
FullName, WorkEmail, Department
IsActive (Boolean - easy toggle when an admin leaves the company)
LastLoginTimestamp
Admin_Roles (The Job Function)
RoleID (Primary Key)
RoleName (Enum/String: Super Admin, Finance Controller, Transport Manager, Food Safety Officer, IT Procurement)
Description
Admin_User_Roles (The Mapping)
MappingID (Primary Key)
AdminID (Foreign Key -> Admin_Users)
RoleID (Foreign Key -> Admin_Roles) (This M:N table allows one person to hold multiple roles, e.g., someone managing both Food and Transport).

📝 2. Accountability & Audit Logs
When dealing with finances and compliance, accountability is non-negotiable. You need a system that tracks every action taken on the dashboard.
System_Audit_Logs (The Tracker)
LogID (Primary Key)
AdminID (Foreign Key -> Admin_Users)
ActionTaken (String: e.g., "Created Vendor", "Approved Invoice", "Closed P0 Ticket")
TargetTable (String: e.g., "Compliance_Tickets", "Finance_Ledger")
TargetID (The specific ID of the row altered)
Timestamp
PreviousValue (JSON - what the data looked like before)
NewValue (JSON - what the data looks like now)

🔗 3. Updates to Existing Vendor Tables
To make the Admin model work with the Vendor model we just built, we need to add a few foreign keys to your existing tables to connect the two worlds.
Update Vendor_Master:
Add OnboardedBy_AdminID (Who added this vendor to the system?)
Add AccountManager_AdminID (Which internal admin is the main owner of this vendor relationship?)
Update Finance_Ledger:
Add ApprovedBy_AdminID (Who authorized the final payout?)
Add ApprovalTimestamp
Update Compliance_Tickets:
Add AssignedTo_AdminID (Which admin is responsible for resolving this issue?)
Add ResolvedBy_AdminID (Who finally closed the ticket?)
Add AdminRemarks (Text field for the admin to leave notes on how the issue was handled).


