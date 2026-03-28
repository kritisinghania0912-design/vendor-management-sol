const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

// ── Demo Accounts (auth) ──────────────────────────────────
const DEMO_USERS = [
  { email: 'admin@vendorsecure.com', password: 'Admin@123', name: 'Kriti Sharma', role: 'admin', vendorId: null, vendorName: null, vendorCategory: null, department: 'Operations', avatarInitials: 'KS' },
  { email: 'ops@swiftcabs.com',      password: 'Swift@123', name: 'Ramesh Kumar',  role: 'vendor', vendorId: 'V001', vendorName: 'SwiftCabs Pvt Ltd',     vendorCategory: 'Transport', department: 'Operations', avatarInitials: 'RK' },
  { email: 'ops@cityride.com',        password: 'City@123',  name: 'Sunita Rao',    role: 'vendor', vendorId: 'V002', vendorName: 'CityRide Solutions',      vendorCategory: 'Transport', department: 'Operations', avatarInitials: 'SR' },
  { email: 'ops@greenleaf.com',       password: 'Green@123', name: 'Priya Mehta',   role: 'vendor', vendorId: 'V003', vendorName: 'GreenLeaf Catering',      vendorCategory: 'Food',      department: 'Operations', avatarInitials: 'PM' },
  { email: 'helpdesk@techcore.com',   password: 'Tech@123',  name: 'Ananya Sharma', role: 'vendor', vendorId: 'V005', vendorName: 'TechCore Systems',        vendorCategory: 'IT',        department: 'IT Support', avatarInitials: 'AS' },
];

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = DEMO_USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.get('/api/auth/accounts', (req, res) => {
  res.json(DEMO_USERS.map(({ password: _, ...u }) => u));
});

// Helper: filter by vendorId query param
function filterByVendor(data, req) {
  const { vendorId } = req.query;
  if (!vendorId) return data;
  return data.filter(r => r.VendorID === vendorId);
}

// Helper: read a CSV file and return array of objects
function readCSV(filename) {
  return new Promise((resolve, reject) => {
    const results = [];
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return resolve([]);
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Helper: append a row to CSV
function appendCSV(filename, row) {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const headers = content.split('\n')[0];
  const keys = headers.split(',');
  const line = keys.map(k => {
    const val = row[k.trim()] ?? '';
    return String(val).includes(',') ? `"${val}"` : val;
  }).join(',');
  fs.appendFileSync(filePath, '\n' + line);
}

// ── Vendors ──────────────────────────────────────────────
app.get('/api/vendors', async (req, res) => {
  const data = await readCSV('vendors.csv');
  res.json(filterByVendor(data, req));
});

app.get('/api/vendors/:id', async (req, res) => {
  const data = await readCSV('vendors.csv');
  const vendor = data.find(v => v.VendorID === req.params.id);
  vendor ? res.json(vendor) : res.status(404).json({ error: 'Not found' });
});

// ── Finance ───────────────────────────────────────────────
app.get('/api/finance', async (req, res) => {
  const data = await readCSV('finance_ledger.csv');
  res.json(filterByVendor(data, req));
});

// ── Issues (Compliance Tickets) ───────────────────────────
app.get('/api/issues', async (req, res) => {
  const data = await readCSV('compliance_tickets.csv');
  res.json(filterByVendor(data, req));
});

app.post('/api/issues', async (req, res) => {
  const data = await readCSV('compliance_tickets.csv');
  const newId = 'T' + String(data.length + 1).padStart(3, '0');
  const row = { TicketID: newId, ...req.body, Status: req.body.Status || 'Open' };
  appendCSV('compliance_tickets.csv', row);
  res.status(201).json(row);
});

app.patch('/api/issues/:id', async (req, res) => {
  const filePath = path.join(DATA_DIR, 'compliance_tickets.csv');
  const data = await readCSV('compliance_tickets.csv');
  const idx = data.findIndex(t => t.TicketID === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data[idx] = { ...data[idx], ...req.body };
  // Rewrite entire CSV
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r => Object.values(r).map(v => String(v).includes(',') ? `"${v}"` : v).join(','));
  fs.writeFileSync(filePath, [headers, ...rows].join('\n'));
  res.json(data[idx]);
});

// ── Transport: Cars ───────────────────────────────────────
app.get('/api/transport/cars', async (req, res) => {
  const data = await readCSV('transport_cars.csv');
  res.json(filterByVendor(data, req));
});

app.post('/api/transport/cars', async (req, res) => {
  const row = req.body;
  appendCSV('transport_cars.csv', row);
  res.status(201).json(row);
});

// ── Transport: Drivers ────────────────────────────────────
app.get('/api/transport/drivers', async (req, res) => {
  const data = await readCSV('transport_drivers.csv');
  res.json(filterByVendor(data, req));
});

app.post('/api/transport/drivers', async (req, res) => {
  const row = req.body;
  appendCSV('transport_drivers.csv', row);
  res.status(201).json(row);
});

// ── Transport: Trip Logs ──────────────────────────────────
app.get('/api/transport/trips', async (req, res) => {
  const [trips, cars] = await Promise.all([readCSV('transport_trip_logs.csv'), readCSV('transport_cars.csv')]);
  const { vendorId } = req.query;
  if (!vendorId) return res.json(trips);
  const vendorCars = new Set(cars.filter(c => c.VendorID === vendorId).map(c => c.CarID));
  res.json(trips.filter(t => vendorCars.has(t.CarID)));
});

app.post('/api/transport/trips', async (req, res) => {
  const data = await readCSV('transport_trip_logs.csv');
  const newId = 'TR' + String(data.length + 1).padStart(3, '0');
  const row = { TripID: newId, ...req.body };
  appendCSV('transport_trip_logs.csv', row);
  res.status(201).json(row);
});

// ── Food: Vendor Details ──────────────────────────────────
app.get('/api/food/details', async (req, res) => {
  const data = await readCSV('food_vendor_details.csv');
  res.json(data);
});

// ── Food: Staff ───────────────────────────────────────────
app.get('/api/food/staff', async (req, res) => {
  const data = await readCSV('food_staff.csv');
  res.json(filterByVendor(data, req));
});

app.post('/api/food/staff', async (req, res) => {
  const data = await readCSV('food_staff.csv');
  const newId = 'FS' + String(data.length + 1).padStart(3, '0');
  const row = { StaffID: newId, ...req.body };
  appendCSV('food_staff.csv', row);
  res.status(201).json(row);
});

// ── Food: Item Catalog ────────────────────────────────────
app.get('/api/food/catalog', async (req, res) => {
  const data = await readCSV('food_item_catalog.csv');
  res.json(filterByVendor(data, req));
});

app.post('/api/food/catalog', async (req, res) => {
  const data = await readCSV('food_item_catalog.csv');
  const newId = 'ITEM' + String(data.length + 1).padStart(3, '0');
  const row = { ItemID: newId, ...req.body };
  appendCSV('food_item_catalog.csv', row);
  res.status(201).json(row);
});

// ── Food: Daily Service ───────────────────────────────────
app.get('/api/food/services', async (req, res) => {
  const data = await readCSV('food_daily_service.csv');
  res.json(filterByVendor(data, req));
});

app.post('/api/food/services', async (req, res) => {
  const data = await readCSV('food_daily_service.csv');
  const newId = 'SVC' + String(data.length + 1).padStart(3, '0');
  const row = { ServiceID: newId, ...req.body };
  appendCSV('food_daily_service.csv', row);
  res.status(201).json(row);
});

// ── IT: Asset Master ──────────────────────────────────────
app.get('/api/it/assets', async (req, res) => {
  const data = await readCSV('it_asset_master.csv');
  res.json(filterByVendor(data, req));
});

app.post('/api/it/assets', async (req, res) => {
  const data = await readCSV('it_asset_master.csv');
  const newId = 'ITA' + String(data.length + 1).padStart(3, '0');
  const row = { AssetID: newId, ...req.body };
  appendCSV('it_asset_master.csv', row);
  res.status(201).json(row);
});

// ── IT: Software Details ──────────────────────────────────
app.get('/api/it/software', async (req, res) => {
  const { vendorId } = req.query;
  const [sw, assets] = await Promise.all([readCSV('it_software_details.csv'), readCSV('it_asset_master.csv')]);
  if (!vendorId) return res.json(sw);
  const vendorAssets = new Set(assets.filter(a => a.VendorID === vendorId).map(a => a.AssetID));
  res.json(sw.filter(s => vendorAssets.has(s.AssetID)));
});

app.post('/api/it/software', async (req, res) => {
  const row = req.body;
  appendCSV('it_software_details.csv', row);
  res.status(201).json(row);
});

// ── IT: Hardware Details ──────────────────────────────────
app.get('/api/it/hardware', async (req, res) => {
  const { vendorId } = req.query;
  const [hw, assets] = await Promise.all([readCSV('it_hardware_details.csv'), readCSV('it_asset_master.csv')]);
  if (!vendorId) return res.json(hw);
  const vendorAssets = new Set(assets.filter(a => a.VendorID === vendorId).map(a => a.AssetID));
  res.json(hw.filter(h => vendorAssets.has(h.AssetID)));
});

app.post('/api/it/hardware', async (req, res) => {
  const row = req.body;
  appendCSV('it_hardware_details.csv', row);
  res.status(201).json(row);
});

// ── Dashboard summary ─────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  const { vendorId } = req.query;
  const [allVendors, allIssues, allFinance, allTrips, allCars, allServices] = await Promise.all([
    readCSV('vendors.csv'),
    readCSV('compliance_tickets.csv'),
    readCSV('finance_ledger.csv'),
    readCSV('transport_trip_logs.csv'),
    readCSV('transport_cars.csv'),
    readCSV('food_daily_service.csv'),
  ]);

  // Filter by vendor if provided
  const vendors  = vendorId ? allVendors.filter(v => v.VendorID === vendorId) : allVendors;
  const issues   = vendorId ? allIssues.filter(i => i.VendorID === vendorId) : allIssues;
  const finance  = vendorId ? allFinance.filter(f => f.VendorID === vendorId) : allFinance;
  const services = vendorId ? allServices.filter(s => s.VendorID === vendorId) : allServices;
  const vendorCars = vendorId ? new Set(allCars.filter(c => c.VendorID === vendorId).map(c => c.CarID)) : null;
  const trips = vendorId ? allTrips.filter(t => vendorCars.has(t.CarID)) : allTrips;

  const openIssues = issues.filter(i => i.Status !== 'Resolved');
  const pendingInvoices = finance.filter(f => f.PaymentStatus === 'Pending' || f.PaymentStatus === 'Partial');
  const totalAmountDue = finance.reduce((sum, f) => sum + parseFloat(f.AmountDue || 0), 0);
  const highRisk = issues.filter(i => i.RiskLevel === 'High' && i.Status !== 'Resolved');

  const byCategory = vendors.reduce((acc, v) => {
    acc[v.VendorCategory] = (acc[v.VendorCategory] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalVendors: vendors.length,
    openIssues: openIssues.length,
    pendingInvoices: pendingInvoices.length,
    totalAmountDue,
    highRiskIssues: highRisk.length,
    vendorsByCategory: byCategory,
    recentIssues: issues.slice(-5).reverse(),
    recentTrips: trips.slice(-5).reverse(),
  });
});

app.listen(PORT, () => {
  console.log(`VMS Backend running on http://localhost:${PORT}`);
});
