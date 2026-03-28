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
  res.json(data);
});

app.get('/api/vendors/:id', async (req, res) => {
  const data = await readCSV('vendors.csv');
  const vendor = data.find(v => v.VendorID === req.params.id);
  vendor ? res.json(vendor) : res.status(404).json({ error: 'Not found' });
});

// ── Finance ───────────────────────────────────────────────
app.get('/api/finance', async (req, res) => {
  const data = await readCSV('finance_ledger.csv');
  res.json(data);
});

// ── Issues (Compliance Tickets) ───────────────────────────
app.get('/api/issues', async (req, res) => {
  const data = await readCSV('compliance_tickets.csv');
  res.json(data);
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
  res.json(data);
});

app.post('/api/transport/cars', async (req, res) => {
  const row = req.body;
  appendCSV('transport_cars.csv', row);
  res.status(201).json(row);
});

// ── Transport: Drivers ────────────────────────────────────
app.get('/api/transport/drivers', async (req, res) => {
  const data = await readCSV('transport_drivers.csv');
  res.json(data);
});

app.post('/api/transport/drivers', async (req, res) => {
  const row = req.body;
  appendCSV('transport_drivers.csv', row);
  res.status(201).json(row);
});

// ── Transport: Trip Logs ──────────────────────────────────
app.get('/api/transport/trips', async (req, res) => {
  const data = await readCSV('transport_trip_logs.csv');
  res.json(data);
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
  res.json(data);
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
  res.json(data);
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
  res.json(data);
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
  res.json(data);
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
  const data = await readCSV('it_software_details.csv');
  res.json(data);
});

app.post('/api/it/software', async (req, res) => {
  const row = req.body;
  appendCSV('it_software_details.csv', row);
  res.status(201).json(row);
});

// ── IT: Hardware Details ──────────────────────────────────
app.get('/api/it/hardware', async (req, res) => {
  const data = await readCSV('it_hardware_details.csv');
  res.json(data);
});

app.post('/api/it/hardware', async (req, res) => {
  const row = req.body;
  appendCSV('it_hardware_details.csv', row);
  res.status(201).json(row);
});

// ── Dashboard summary ─────────────────────────────────────
app.get('/api/dashboard', async (req, res) => {
  const [vendors, issues, finance, trips, services] = await Promise.all([
    readCSV('vendors.csv'),
    readCSV('compliance_tickets.csv'),
    readCSV('finance_ledger.csv'),
    readCSV('transport_trip_logs.csv'),
    readCSV('food_daily_service.csv'),
  ]);

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
