import { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { api } from '../api';

// ── Transport ─────────────────────────────────────────────
const TRIP_COLS = [
  { key: 'TripID', label: 'Trip ID' },
  { key: 'CarID', label: 'Car ID' },
  { key: 'DriverID', label: 'Driver ID' },
  { key: 'EmployeeID', label: 'Employee ID' },
  { key: 'TripDate', label: 'Date' },
  { key: 'PickupTime', label: 'Pickup' },
  { key: 'DropTime', label: 'Drop' },
  { key: 'PickupLocation', label: 'From' },
  { key: 'DropLocation', label: 'To' },
  { key: 'DistanceDriven_KM', label: 'KM' },
  { key: 'IncidentReported', label: 'Incident', render: v => v === 'true' ? <span className="badge badge-red">Yes</span> : <span className="badge badge-green">No</span> },
];

const EMPTY_TRIP = { CarID: '', DriverID: '', EmployeeID: '', TripDate: '', PickupTime: '', DropTime: '', PickupLocation: '', DropLocation: '', DistanceDriven_KM: '', IncidentReported: 'false' };

function TransportPulse() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_TRIP);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { api.getTrips().then(setTrips).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    if (!search) return trips;
    const q = search.toLowerCase();
    return trips.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
  }, [trips, search]);

  async function handleSave() {
    if (!form.CarID || !form.DriverID) return alert('Car ID and Driver ID are required.');
    setSaving(true);
    try {
      const row = await api.createTrip({ ...form, TripDate: form.TripDate || new Date().toISOString().slice(0, 10) });
      setTrips(p => [...p, row]);
      setShowModal(false); setForm(EMPTY_TRIP);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <input className="search-input" placeholder="Search trips…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Data</button>
        </div>
      </div>
      {loading ? <div className="loading">Loading trips…</div> : <DataTable columns={TRIP_COLS} data={filtered} />}
      {showModal && (
        <Modal title="Add Trip Log" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="form-grid">
            {[
              ['CarID', 'Car ID', 'e.g. CAR001'],
              ['DriverID', 'Driver ID', 'e.g. DRV001'],
              ['EmployeeID', 'Employee ID', 'e.g. EMP101'],
            ].map(([k, l, p]) => (
              <div key={k} className="form-group">
                <label className="form-label">{l} <span className="req">*</span></label>
                <input className="form-input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={p} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Trip Date <span className="req">*</span></label>
              <input type="date" className="form-input" value={form.TripDate} onChange={e => setForm(f => ({ ...f, TripDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Time</label>
              <input type="time" className="form-input" value={form.PickupTime} onChange={e => setForm(f => ({ ...f, PickupTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Drop Time</label>
              <input type="time" className="form-input" value={form.DropTime} onChange={e => setForm(f => ({ ...f, DropTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Location</label>
              <input className="form-input" value={form.PickupLocation} onChange={e => setForm(f => ({ ...f, PickupLocation: e.target.value }))} placeholder="e.g. Whitefield" />
            </div>
            <div className="form-group">
              <label className="form-label">Drop Location</label>
              <input className="form-input" value={form.DropLocation} onChange={e => setForm(f => ({ ...f, DropLocation: e.target.value }))} placeholder="e.g. Electronic City" />
            </div>
            <div className="form-group">
              <label className="form-label">Distance (KM)</label>
              <input type="number" className="form-input" value={form.DistanceDriven_KM} onChange={e => setForm(f => ({ ...f, DistanceDriven_KM: e.target.value }))} placeholder="e.g. 18.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Incident Reported</label>
              <select className="form-input" value={form.IncidentReported} onChange={e => setForm(f => ({ ...f, IncidentReported: e.target.value }))}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Food ──────────────────────────────────────────────────
const SVC_COLS = [
  { key: 'ServiceID', label: 'Service ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'ServiceDate', label: 'Date' },
  { key: 'MealType', label: 'Meal Type' },
  { key: 'PricePerPlate', label: 'Price/Plate (₹)' },
  { key: 'PlatesBilledByVendor', label: 'Billed Plates' },
  { key: 'ActualBadgesSwiped', label: 'Actual Badges' },
  {
    key: '_diff', label: 'Discrepancy',
    render: (_, row) => {
      const diff = parseInt(row.PlatesBilledByVendor) - parseInt(row.ActualBadgesSwiped);
      if (isNaN(diff)) return '—';
      return diff > 0 ? <span className="discrepancy">+{diff} plates</span> : <span className="badge badge-green">Match</span>;
    }
  },
];

const EMPTY_SVC = { VendorID: '', ServiceDate: '', MealType: 'Lunch', PricePerPlate: '', PlatesBilledByVendor: '', ActualBadgesSwiped: '' };

function FoodPulse() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_SVC);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMeal, setFilterMeal] = useState('');

  useEffect(() => { api.getFoodServices().then(setServices).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    return services.filter(r => {
      if (filterMeal && r.MealType !== filterMeal) return false;
      if (search) { const q = search.toLowerCase(); return Object.values(r).some(v => String(v).toLowerCase().includes(q)); }
      return true;
    });
  }, [services, search, filterMeal]);

  async function handleSave() {
    if (!form.VendorID) return alert('Vendor ID is required.');
    setSaving(true);
    try {
      const row = await api.createFoodService({ ...form, ServiceDate: form.ServiceDate || new Date().toISOString().slice(0, 10) });
      setServices(p => [...p, row]);
      setShowModal(false); setForm(EMPTY_SVC);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <input className="search-input" placeholder="Search services…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterMeal} onChange={e => setFilterMeal(e.target.value)}>
          <option value="">All Meal Types</option>
          <option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option>
        </select>
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Data</button>
        </div>
      </div>
      {loading ? <div className="loading">Loading services…</div> : <DataTable columns={SVC_COLS} data={filtered} />}
      {showModal && (
        <Modal title="Add Food Service" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vendor ID <span className="req">*</span></label>
              <input className="form-input" value={form.VendorID} onChange={e => setForm(f => ({ ...f, VendorID: e.target.value }))} placeholder="e.g. V003" />
            </div>
            <div className="form-group">
              <label className="form-label">Service Date</label>
              <input type="date" className="form-input" value={form.ServiceDate} onChange={e => setForm(f => ({ ...f, ServiceDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Meal Type</label>
              <select className="form-input" value={form.MealType} onChange={e => setForm(f => ({ ...f, MealType: e.target.value }))}>
                <option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price Per Plate (₹)</label>
              <input type="number" className="form-input" value={form.PricePerPlate} onChange={e => setForm(f => ({ ...f, PricePerPlate: e.target.value }))} placeholder="e.g. 150" />
            </div>
            <div className="form-group">
              <label className="form-label">Plates Billed by Vendor</label>
              <input type="number" className="form-input" value={form.PlatesBilledByVendor} onChange={e => setForm(f => ({ ...f, PlatesBilledByVendor: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Actual Badges Swiped</label>
              <input type="number" className="form-input" value={form.ActualBadgesSwiped} onChange={e => setForm(f => ({ ...f, ActualBadgesSwiped: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── IT ────────────────────────────────────────────────────
const SW_COLS = [
  { key: 'AssetID', label: 'Asset ID' },
  { key: 'CurrentVersion', label: 'Version' },
  { key: 'IsAutoRenewed', label: 'Auto-Renew', render: v => v === 'true' ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span> },
  { key: 'RenewalDate', label: 'Renewal Date' },
  { key: 'TotalLicensesPurchased', label: 'Total Licenses' },
  { key: 'ActiveLicensesUsed', label: 'Active', render: (v, row) => {
    const utilization = Math.round((parseInt(v) / parseInt(row.TotalLicensesPurchased)) * 100);
    return <span>{v} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({utilization}%)</span></span>;
  }},
  { key: 'DataPrivacyStatus', label: 'Privacy Status' },
];

const HW_COLS = [
  { key: 'AssetID', label: 'Asset ID' },
  { key: 'SerialNumber', label: 'Serial No.' },
  { key: 'ManufacturerDate', label: 'Mfr. Date' },
  { key: 'MAC_Address', label: 'MAC Address' },
  { key: 'WarrantyExpiryDate', label: 'Warranty Expiry' },
  { key: 'MaintenanceCost', label: 'Maint. Cost (₹)' },
  { key: 'HardwareStatus', label: 'Status', render: v => {
    const map = { Working: 'badge badge-green', 'Needs Repair': 'badge badge-amber', Decommissioned: 'badge badge-red' };
    return <span className={map[v] || 'badge badge-gray'}>{v}</span>;
  }},
];

const EMPTY_SW = { AssetID: '', CurrentVersion: '', IsAutoRenewed: 'false', RenewalDate: '', TotalLicensesPurchased: '', ActiveLicensesUsed: '', DataPrivacyStatus: '' };
const EMPTY_HW = { AssetID: '', ManufacturerDate: '', SerialNumber: '', MAC_Address: '', WarrantyExpiryDate: '', MaintenanceCost: '', HardwareStatus: 'Working' };

function ITPulse() {
  const [subTab, setSubTab] = useState('software');
  const [software, setSoftware] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formSW, setFormSW] = useState(EMPTY_SW);
  const [formHW, setFormHW] = useState(EMPTY_HW);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getITSoftware(), api.getITHardware()])
      .then(([sw, hw]) => { setSoftware(sw); setHardware(hw); })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (subTab === 'software') {
        const row = await api.createITSoftware(formSW);
        setSoftware(p => [...p, row]);
        setFormSW(EMPTY_SW);
      } else {
        const row = await api.createITHardware(formHW);
        setHardware(p => [...p, row]);
        setFormHW(EMPTY_HW);
      }
      setShowModal(false);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="tabs">
          <button className={`tab-btn${subTab === 'software' ? ' active' : ''}`} onClick={() => setSubTab('software')}>Software</button>
          <button className={`tab-btn${subTab === 'hardware' ? ' active' : ''}`} onClick={() => setSubTab('hardware')}>Hardware</button>
        </div>
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Data</button>
        </div>
      </div>
      {loading ? <div className="loading">Loading IT data…</div> : (
        subTab === 'software'
          ? <DataTable columns={SW_COLS} data={software} />
          : <DataTable columns={HW_COLS} data={hardware} />
      )}
      {showModal && (
        <Modal title="Add IT Data" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn${subTab === 'software' ? ' active' : ''}`} onClick={() => setSubTab('software')}>Software</button>
            <button className={`tab-btn${subTab === 'hardware' ? ' active' : ''}`} onClick={() => setSubTab('hardware')}>Hardware</button>
          </div>
          {subTab === 'software' ? (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Asset ID</label>
                <input className="form-input" value={formSW.AssetID} onChange={e => setFormSW(f => ({ ...f, AssetID: e.target.value }))} placeholder="e.g. ITA001" />
              </div>
              <div className="form-group">
                <label className="form-label">Current Version</label>
                <input className="form-input" value={formSW.CurrentVersion} onChange={e => setFormSW(f => ({ ...f, CurrentVersion: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Is Auto Renewed</label>
                <select className="form-input" value={formSW.IsAutoRenewed} onChange={e => setFormSW(f => ({ ...f, IsAutoRenewed: e.target.value }))}>
                  <option value="false">No</option><option value="true">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Renewal Date</label>
                <input type="date" className="form-input" value={formSW.RenewalDate} onChange={e => setFormSW(f => ({ ...f, RenewalDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Licenses Purchased</label>
                <input type="number" className="form-input" value={formSW.TotalLicensesPurchased} onChange={e => setFormSW(f => ({ ...f, TotalLicensesPurchased: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Active Licenses Used</label>
                <input type="number" className="form-input" value={formSW.ActiveLicensesUsed} onChange={e => setFormSW(f => ({ ...f, ActiveLicensesUsed: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label className="form-label">Data Privacy Status</label>
                <input className="form-input" value={formSW.DataPrivacyStatus} onChange={e => setFormSW(f => ({ ...f, DataPrivacyStatus: e.target.value }))} placeholder="e.g. GDPR Compliant" />
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Asset ID</label>
                <input className="form-input" value={formHW.AssetID} onChange={e => setFormHW(f => ({ ...f, AssetID: e.target.value }))} placeholder="e.g. ITA002" />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturer Date</label>
                <input type="date" className="form-input" value={formHW.ManufacturerDate} onChange={e => setFormHW(f => ({ ...f, ManufacturerDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input className="form-input" value={formHW.SerialNumber} onChange={e => setFormHW(f => ({ ...f, SerialNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">MAC Address</label>
                <input className="form-input" value={formHW.MAC_Address} onChange={e => setFormHW(f => ({ ...f, MAC_Address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Warranty Expiry Date</label>
                <input type="date" className="form-input" value={formHW.WarrantyExpiryDate} onChange={e => setFormHW(f => ({ ...f, WarrantyExpiryDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Maintenance Cost (₹)</label>
                <input type="number" className="form-input" value={formHW.MaintenanceCost} onChange={e => setFormHW(f => ({ ...f, MaintenanceCost: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label className="form-label">Hardware Status</label>
                <select className="form-input" value={formHW.HardwareStatus} onChange={e => setFormHW(f => ({ ...f, HardwareStatus: e.target.value }))}>
                  <option>Working</option><option>Needs Repair</option><option>Decommissioned</option>
                </select>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Main Pulse Page ───────────────────────────────────────
export default function Pulse() {
  const [vendor, setVendor] = useState('transport');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Pulse</div>
          <div className="page-subtitle">Dynamic activity data by vendor type</div>
        </div>
      </div>
      <div className="vendor-tabs">
        <button className={`vendor-tab${vendor === 'transport' ? ' active' : ''}`} onClick={() => setVendor('transport')}>🚕 Transport</button>
        <button className={`vendor-tab${vendor === 'food' ? ' active' : ''}`} onClick={() => setVendor('food')}>🥗 Food</button>
        <button className={`vendor-tab${vendor === 'it' ? ' active' : ''}`} onClick={() => setVendor('it')}>💻 IT</button>
      </div>
      {vendor === 'transport' && <TransportPulse />}
      {vendor === 'food' && <FoodPulse />}
      {vendor === 'it' && <ITPulse />}
    </div>
  );
}
