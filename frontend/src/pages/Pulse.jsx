import { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { TableSkeleton } from '../components/Skeleton';
import { makeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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
  const { vendorParam } = useAuth();
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_TRIP);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterIncident, setFilterIncident] = useState('');

  useEffect(() => {
    const api = makeApi(vendorParam);
    api.getTrips().then(setTrips).finally(() => setLoading(false));
  }, [vendorParam]);

  const filtered = useMemo(() => trips.filter(r => {
    if (filterIncident && r.IncidentReported !== filterIncident) return false;
    if (search) { const q = search.toLowerCase(); return Object.values(r).some(v => String(v).toLowerCase().includes(q)); }
    return true;
  }), [trips, search, filterIncident]);

  const totalKm = useMemo(() => trips.reduce((s, t) => s + parseFloat(t.DistanceDriven_KM || 0), 0), [trips]);
  const incidents = useMemo(() => trips.filter(t => t.IncidentReported === 'true').length, [trips]);

  async function handleSave() {
    if (!form.CarID || !form.DriverID) {
      toast('Car ID and Driver ID are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const api = makeApi(vendorParam);
      const row = await api.createTrip({ ...form, TripDate: form.TripDate || new Date().toISOString().slice(0, 10) });
      setTrips(p => [...p, row]); setShowModal(false); setForm(EMPTY_TRIP);
      toast('Trip logged successfully.', 'success');
    } catch {
      toast('Failed to save trip. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="cards-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="card"><div className="card-label">Total Trips</div><div className="card-value">{trips.length}</div></div>
        <div className="card"><div className="card-label">Total KM</div><div className="card-value">{totalKm.toFixed(1)}</div></div>
        <div className="card"><div className="card-label">Incidents</div><div className={`card-value${incidents > 0 ? ' red' : ' green'}`}>{incidents}</div></div>
      </div>
      <div className="table-toolbar">
        <div className="search-wrap">
          <input className="search-input" placeholder="Search trips…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search trips" />
        </div>
        <select className="filter-select" value={filterIncident} onChange={e => setFilterIncident(e.target.value)} aria-label="Filter by incident">
          <option value="">All Trips</option>
          <option value="true">With Incident</option>
          <option value="false">No Incident</option>
        </select>
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Trip</button>
        </div>
      </div>
      {loading ? <TableSkeleton cols={11} rows={6} /> : <DataTable columns={TRIP_COLS} data={filtered} />}
      {showModal && (
        <Modal title="Log Trip" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="form-grid">
            {[['CarID','Car ID','CAR001'],['DriverID','Driver ID','DRV001'],['EmployeeID','Employee ID','EMP101']].map(([k,l,p]) => (
              <div key={k} className="form-group"><label className="form-label">{l} <span className="req">*</span></label><input className="form-input" value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
            ))}
            <div className="form-group"><label className="form-label">Trip Date <span className="req">*</span></label><input type="date" className="form-input" value={form.TripDate} onChange={e => setForm(f => ({...f,TripDate:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Pickup Time</label><input type="time" className="form-input" value={form.PickupTime} onChange={e => setForm(f => ({...f,PickupTime:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Drop Time</label><input type="time" className="form-input" value={form.DropTime} onChange={e => setForm(f => ({...f,DropTime:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">From</label><input className="form-input" value={form.PickupLocation} onChange={e => setForm(f => ({...f,PickupLocation:e.target.value}))} placeholder="Whitefield" /></div>
            <div className="form-group"><label className="form-label">To</label><input className="form-input" value={form.DropLocation} onChange={e => setForm(f => ({...f,DropLocation:e.target.value}))} placeholder="Electronic City" /></div>
            <div className="form-group"><label className="form-label">Distance (KM)</label><input type="number" className="form-input" value={form.DistanceDriven_KM} onChange={e => setForm(f => ({...f,DistanceDriven_KM:e.target.value}))} placeholder="18.5" /></div>
            <div className="form-group"><label className="form-label">Incident Reported</label><select className="form-input" value={form.IncidentReported} onChange={e => setForm(f => ({...f,IncidentReported:e.target.value}))}><option value="false">No</option><option value="true">Yes</option></select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const SVC_COLS = [
  { key: 'ServiceID', label: 'Service ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'ServiceDate', label: 'Date' },
  { key: 'MealType', label: 'Meal Type' },
  { key: 'PricePerPlate', label: '₹/Plate' },
  { key: 'PlatesBilledByVendor', label: 'Billed' },
  { key: 'ActualBadgesSwiped', label: 'Actual' },
  { key: '_diff', label: 'Variance', render: (_, row) => {
    const diff = parseInt(row.PlatesBilledByVendor) - parseInt(row.ActualBadgesSwiped);
    if (isNaN(diff)) return '—';
    return diff > 0 ? <span className="discrepancy">+{diff} plates</span> : <span className="badge badge-green">Match</span>;
  }},
  { key: '_revenue', label: 'Billed Amt (₹)', render: (_, row) => {
    const amt = parseInt(row.PlatesBilledByVendor) * parseFloat(row.PricePerPlate);
    return isNaN(amt) ? '—' : amt.toLocaleString('en-IN');
  }},
];
const EMPTY_SVC = { VendorID: '', ServiceDate: '', MealType: 'Lunch', PricePerPlate: '', PlatesBilledByVendor: '', ActualBadgesSwiped: '' };

function FoodPulse() {
  const { vendorParam, user } = useAuth();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_SVC);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMeal, setFilterMeal] = useState('');

  useEffect(() => {
    const api = makeApi(vendorParam);
    api.getFoodServices().then(setServices).finally(() => setLoading(false));
  }, [vendorParam]);

  const filtered = useMemo(() => services.filter(r => {
    if (filterMeal && r.MealType !== filterMeal) return false;
    if (search) { const q = search.toLowerCase(); return Object.values(r).some(v => String(v).toLowerCase().includes(q)); }
    return true;
  }), [services, search, filterMeal]);

  const totalBilled = useMemo(() => services.reduce((s, r) => s + parseInt(r.PlatesBilledByVendor || 0) * parseFloat(r.PricePerPlate || 0), 0), [services]);
  const totalActual = useMemo(() => services.reduce((s, r) => s + parseInt(r.ActualBadgesSwiped || 0) * parseFloat(r.PricePerPlate || 0), 0), [services]);
  const discrepancies = useMemo(() => services.filter(r => parseInt(r.PlatesBilledByVendor) > parseInt(r.ActualBadgesSwiped)).length, [services]);

  async function handleSave() {
    if (!form.VendorID) {
      toast('Vendor ID is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const api = makeApi(vendorParam);
      const row = await api.createFoodService({ ...form, ServiceDate: form.ServiceDate || new Date().toISOString().slice(0, 10) });
      setServices(p => [...p, row]); setShowModal(false); setForm(EMPTY_SVC);
      toast('Service record saved successfully.', 'success');
    } catch {
      toast('Failed to save service record. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="cards-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="card"><div className="card-label">Total Billed</div><div className="card-value" style={{fontSize:18}}>₹{totalBilled.toLocaleString('en-IN')}</div></div>
        <div className="card"><div className="card-label">Actual (Badge)</div><div className="card-value" style={{fontSize:18}}>₹{totalActual.toLocaleString('en-IN')}</div></div>
        <div className="card"><div className="card-label">Discrepancies</div><div className={`card-value${discrepancies > 0 ? ' red' : ' green'}`}>{discrepancies}</div><div className="card-footer">services over-billed</div></div>
      </div>
      <div className="table-toolbar">
        <div className="search-wrap">
          <input className="search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search service records" />
        </div>
        <select className="filter-select" value={filterMeal} onChange={e => setFilterMeal(e.target.value)} aria-label="Filter by meal type">
          <option value="">All Meals</option><option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option>
        </select>
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => { setForm({ ...EMPTY_SVC, VendorID: user?.vendorId || '' }); setShowModal(true); }}>+ Log Service</button>
        </div>
      </div>
      {loading ? <TableSkeleton cols={9} rows={6} /> : <DataTable columns={SVC_COLS} data={filtered} />}
      {showModal && (
        <Modal title="Log Food Service" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Vendor ID <span className="req">*</span></label><input className="form-input" value={form.VendorID} onChange={e => setForm(f => ({...f,VendorID:e.target.value}))} placeholder="e.g. V003" /></div>
            <div className="form-group"><label className="form-label">Service Date</label><input type="date" className="form-input" value={form.ServiceDate} onChange={e => setForm(f => ({...f,ServiceDate:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Meal Type</label><select className="form-input" value={form.MealType} onChange={e => setForm(f => ({...f,MealType:e.target.value}))}><option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option></select></div>
            <div className="form-group"><label className="form-label">Price Per Plate (₹)</label><input type="number" className="form-input" value={form.PricePerPlate} onChange={e => setForm(f => ({...f,PricePerPlate:e.target.value}))} placeholder="150" /></div>
            <div className="form-group"><label className="form-label">Plates Billed</label><input type="number" className="form-input" value={form.PlatesBilledByVendor} onChange={e => setForm(f => ({...f,PlatesBilledByVendor:e.target.value}))} /></div>
            <div className="form-group"><label className="form-label">Actual Badges Swiped</label><input type="number" className="form-input" value={form.ActualBadgesSwiped} onChange={e => setForm(f => ({...f,ActualBadgesSwiped:e.target.value}))} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const SW_COLS = [
  { key: 'AssetID', label: 'Asset ID' },
  { key: 'CurrentVersion', label: 'Version' },
  { key: 'IsAutoRenewed', label: 'Auto-Renew', render: v => v === 'true' ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span> },
  { key: 'RenewalDate', label: 'Renewal Date', render: v => {
    if (!v) return '—';
    const daysLeft = Math.round((new Date(v) - new Date()) / 86400000);
    return <span className={daysLeft < 30 ? 'discrepancy' : ''}>{v}{daysLeft < 30 ? ` (${daysLeft}d)` : ''}</span>;
  }},
  { key: 'TotalLicensesPurchased', label: 'Total Lic.' },
  { key: 'ActiveLicensesUsed', label: 'Active', render: (v, row) => {
    const pct = Math.round((parseInt(v) / parseInt(row.TotalLicensesPurchased)) * 100);
    return <span>{v} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({pct}%)</span></span>;
  }},
  { key: 'DataPrivacyStatus', label: 'Privacy' },
];
const HW_COLS = [
  { key: 'AssetID', label: 'Asset ID' },
  { key: 'SerialNumber', label: 'Serial No.' },
  { key: 'ManufacturerDate', label: 'Mfr. Date' },
  { key: 'WarrantyExpiryDate', label: 'Warranty Expiry', render: v => {
    if (!v) return '—';
    return <span className={new Date(v) < new Date() ? 'discrepancy' : ''}>{v}</span>;
  }},
  { key: 'MaintenanceCost', label: 'Maint. Cost (₹)' },
  { key: 'HardwareStatus', label: 'Status', render: v => {
    const cls = { Working: 'badge badge-green', 'Needs Repair': 'badge badge-amber', Decommissioned: 'badge badge-red' };
    return <span className={cls[v] || 'badge badge-gray'}>{v}</span>;
  }},
];
const EMPTY_SW = { AssetID: '', CurrentVersion: '', IsAutoRenewed: 'false', RenewalDate: '', TotalLicensesPurchased: '', ActiveLicensesUsed: '', DataPrivacyStatus: '' };
const EMPTY_HW = { AssetID: '', ManufacturerDate: '', SerialNumber: '', MAC_Address: '', WarrantyExpiryDate: '', MaintenanceCost: '', HardwareStatus: 'Working' };

function ITPulse() {
  const { vendorParam } = useAuth();
  const toast = useToast();
  const [subTab, setSubTab] = useState('software');
  const [software, setSoftware] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formSW, setFormSW] = useState(EMPTY_SW);
  const [formHW, setFormHW] = useState(EMPTY_HW);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const api = makeApi(vendorParam);
    Promise.all([api.getITSoftware(), api.getITHardware()])
      .then(([sw, hw]) => { setSoftware(sw); setHardware(hw); })
      .finally(() => setLoading(false));
  }, [vendorParam]);

  const expiringSoon = useMemo(() => software.filter(s => {
    const d = new Date(s.RenewalDate);
    return s.RenewalDate && (d - new Date()) < 30 * 86400000;
  }).length, [software]);

  async function handleSave() {
    setSaving(true);
    try {
      const api = makeApi(vendorParam);
      if (subTab === 'software') { const r = await api.createITSoftware(formSW); setSoftware(p => [...p, r]); setFormSW(EMPTY_SW); }
      else { const r = await api.createITHardware(formHW); setHardware(p => [...p, r]); setFormHW(EMPTY_HW); }
      setShowModal(false);
      toast('Record saved successfully.', 'success');
    } catch {
      toast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="cards-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="card"><div className="card-label">Software</div><div className="card-value">{software.length}</div></div>
        <div className="card"><div className="card-label">Hardware</div><div className="card-value">{hardware.length}</div></div>
        <div className="card"><div className="card-label">Renewing Soon</div><div className={`card-value${expiringSoon > 0 ? ' amber' : ' green'}`}>{expiringSoon}</div><div className="card-footer">within 30 days</div></div>
      </div>
      <div className="table-toolbar">
        <div className="tabs">
          <button className={`tab-btn${subTab === 'software' ? ' active' : ''}`} onClick={() => setSubTab('software')}>Software</button>
          <button className={`tab-btn${subTab === 'hardware' ? ' active' : ''}`} onClick={() => setSubTab('hardware')}>Hardware</button>
        </div>
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Data</button>
        </div>
      </div>
      {loading ? <TableSkeleton cols={7} rows={6} /> : (
        subTab === 'software' ? <DataTable columns={SW_COLS} data={software} /> : <DataTable columns={HW_COLS} data={hardware} />
      )}
      {showModal && (
        <Modal title="Add IT Data" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn${subTab === 'software' ? ' active' : ''}`} onClick={() => setSubTab('software')}>Software</button>
            <button className={`tab-btn${subTab === 'hardware' ? ' active' : ''}`} onClick={() => setSubTab('hardware')}>Hardware</button>
          </div>
          {subTab === 'software' ? (
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Asset ID</label><input className="form-input" value={formSW.AssetID} onChange={e => setFormSW(f => ({...f,AssetID:e.target.value}))} placeholder="ITA001" /></div>
              <div className="form-group"><label className="form-label">Current Version</label><input className="form-input" value={formSW.CurrentVersion} onChange={e => setFormSW(f => ({...f,CurrentVersion:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Auto Renewed</label><select className="form-input" value={formSW.IsAutoRenewed} onChange={e => setFormSW(f => ({...f,IsAutoRenewed:e.target.value}))}><option value="false">No</option><option value="true">Yes</option></select></div>
              <div className="form-group"><label className="form-label">Renewal Date</label><input type="date" className="form-input" value={formSW.RenewalDate} onChange={e => setFormSW(f => ({...f,RenewalDate:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Total Licenses</label><input type="number" className="form-input" value={formSW.TotalLicensesPurchased} onChange={e => setFormSW(f => ({...f,TotalLicensesPurchased:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Active Licenses</label><input type="number" className="form-input" value={formSW.ActiveLicensesUsed} onChange={e => setFormSW(f => ({...f,ActiveLicensesUsed:e.target.value}))} /></div>
              <div className="form-group full"><label className="form-label">Data Privacy Status</label><input className="form-input" value={formSW.DataPrivacyStatus} onChange={e => setFormSW(f => ({...f,DataPrivacyStatus:e.target.value}))} placeholder="GDPR Compliant" /></div>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Asset ID</label><input className="form-input" value={formHW.AssetID} onChange={e => setFormHW(f => ({...f,AssetID:e.target.value}))} placeholder="ITA002" /></div>
              <div className="form-group"><label className="form-label">Manufacturer Date</label><input type="date" className="form-input" value={formHW.ManufacturerDate} onChange={e => setFormHW(f => ({...f,ManufacturerDate:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Serial Number</label><input className="form-input" value={formHW.SerialNumber} onChange={e => setFormHW(f => ({...f,SerialNumber:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">MAC Address</label><input className="form-input" value={formHW.MAC_Address} onChange={e => setFormHW(f => ({...f,MAC_Address:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Warranty Expiry</label><input type="date" className="form-input" value={formHW.WarrantyExpiryDate} onChange={e => setFormHW(f => ({...f,WarrantyExpiryDate:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Maintenance Cost (₹)</label><input type="number" className="form-input" value={formHW.MaintenanceCost} onChange={e => setFormHW(f => ({...f,MaintenanceCost:e.target.value}))} /></div>
              <div className="form-group full"><label className="form-label">Hardware Status</label><select className="form-input" value={formHW.HardwareStatus} onChange={e => setFormHW(f => ({...f,HardwareStatus:e.target.value}))}><option>Working</option><option>Needs Repair</option><option>Decommissioned</option></select></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default function Pulse() {
  const { isVendor, user } = useAuth();
  const defaultVendor = isVendor
    ? (user?.vendorCategory === 'Food' ? 'food' : user?.vendorCategory === 'IT' ? 'it' : 'transport')
    : 'transport';
  const [vendor, setVendor] = useState(defaultVendor);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isVendor ? 'Submit Activity Data' : 'Pulse'}</div>
          <div className="page-subtitle">{isVendor ? `Logging data for ${user?.vendorName}` : 'Dynamic activity data by vendor type'}</div>
        </div>
      </div>
      {isVendor ? (
        <div style={{ marginBottom: 20 }}>
          <span className="vendor-tab active" style={{ cursor: 'default' }}>
            <span aria-hidden="true">{user?.vendorCategory === 'Transport' ? '🚕' : user?.vendorCategory === 'Food' ? '🥗' : '💻'}</span> {user?.vendorCategory}
          </span>
        </div>
      ) : (
        <div className="vendor-tabs">
          <button className={`vendor-tab${vendor === 'transport' ? ' active' : ''}`} onClick={() => setVendor('transport')}><span aria-hidden="true">🚕</span> Transport</button>
          <button className={`vendor-tab${vendor === 'food' ? ' active' : ''}`} onClick={() => setVendor('food')}><span aria-hidden="true">🥗</span> Food</button>
          <button className={`vendor-tab${vendor === 'it' ? ' active' : ''}`} onClick={() => setVendor('it')}><span aria-hidden="true">💻</span> IT</button>
        </div>
      )}
      {vendor === 'transport' && <TransportPulse />}
      {vendor === 'food' && <FoodPulse />}
      {vendor === 'it' && <ITPulse />}
    </div>
  );
}
