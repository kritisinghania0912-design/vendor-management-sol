import { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { api } from '../api';

// ── Transport Registry ────────────────────────────────────
const CAR_COLS = [
  { key: 'CarID', label: 'Car ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'CarNumber', label: 'Plate No.' },
  { key: 'CarModel', label: 'Model' },
  { key: 'CarType', label: 'Type' },
  { key: 'SeatingCapacity', label: 'Seats' },
  { key: 'PUC_Status', label: 'PUC Status', render: v => <span className={v === 'Expired' ? 'badge badge-red' : 'badge badge-green'}>{v}</span> },
  { key: 'PUC_ExpiryDate', label: 'PUC Expiry' },
  { key: 'InsuranceExpiryDate', label: 'Insurance Expiry' },
  { key: 'GPSTrackerID', label: 'GPS Tracker' },
];

const DRV_COLS = [
  { key: 'DriverID', label: 'Driver ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'Name', label: 'Name' },
  { key: 'Gender', label: 'Gender' },
  { key: 'LicenseNumber', label: 'License No.' },
  { key: 'LicenseExpiryDate', label: 'License Expiry', render: v => {
    const expired = v && new Date(v) < new Date();
    return <span className={expired ? 'discrepancy' : ''}>{v}</span>;
  }},
  { key: 'BGV_Status', label: 'BGV', render: v => <span className={v === 'Verified' ? 'badge badge-green' : 'badge badge-amber'}>{v}</span> },
  { key: 'LanguagesSpoken', label: 'Languages' },
];

const EMPTY_CAR = { VendorID: '', CarNumber: '', CarModel: '', CarType: 'Sedan', SeatingCapacity: '', PUC_Status: 'Valid', PUC_ExpiryDate: '', InsuranceExpiryDate: '', GPSTrackerID: '' };
const EMPTY_DRV = { VendorID: '', Name: '', VendorEmployeeID: '', DOB: '', Gender: 'Male', LicenseNumber: '', LicenseExpiryDate: '', GovID_Type: 'Aadhaar', GovID_Number: '', BGV_Status: 'Pending', LanguagesSpoken: '' };

function TransportRegistry() {
  const [subTab, setSubTab] = useState('cars');
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formCar, setFormCar] = useState(EMPTY_CAR);
  const [formDrv, setFormDrv] = useState(EMPTY_DRV);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getCars(), api.getDrivers()])
      .then(([c, d]) => { setCars(c); setDrivers(d); })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (subTab === 'cars') {
        const row = await api.createCar(formCar);
        setCars(p => [...p, row]); setFormCar(EMPTY_CAR);
      } else {
        const row = await api.createDriver(formDrv);
        setDrivers(p => [...p, row]); setFormDrv(EMPTY_DRV);
      }
      setShowModal(false);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="tabs">
          <button className={`tab-btn${subTab === 'cars' ? ' active' : ''}`} onClick={() => setSubTab('cars')}>Vehicles ({cars.length})</button>
          <button className={`tab-btn${subTab === 'drivers' ? ' active' : ''}`} onClick={() => setSubTab('drivers')}>Drivers ({drivers.length})</button>
        </div>
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Asset</button>
        </div>
      </div>
      {loading ? <div className="loading">Loading…</div> : (
        subTab === 'cars' ? <DataTable columns={CAR_COLS} data={cars} /> : <DataTable columns={DRV_COLS} data={drivers} />
      )}
      {showModal && (
        <Modal title={`Add ${subTab === 'cars' ? 'Vehicle' : 'Driver'}`} onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn${subTab === 'cars' ? ' active' : ''}`} onClick={() => setSubTab('cars')}>Vehicle</button>
            <button className={`tab-btn${subTab === 'drivers' ? ' active' : ''}`} onClick={() => setSubTab('drivers')}>Driver</button>
          </div>
          {subTab === 'cars' ? (
            <div className="form-grid">
              {[['VendorID','Vendor ID','V001'],['CarNumber','Plate Number','KA-01-AB-1234'],['CarModel','Car Model','Toyota Innova'],['SeatingCapacity','Seating Capacity','7'],['GPSTrackerID','GPS Tracker ID','GPS001']].map(([k,l,p]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={formCar[k]} onChange={e => setFormCar(f => ({...f,[k]:e.target.value}))} placeholder={p} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Car Type</label>
                <select className="form-input" value={formCar.CarType} onChange={e => setFormCar(f => ({...f,CarType:e.target.value}))}>
                  <option>Sedan</option><option>SUV</option><option>MUV</option><option>Hatchback</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">PUC Status</label>
                <select className="form-input" value={formCar.PUC_Status} onChange={e => setFormCar(f => ({...f,PUC_Status:e.target.value}))}>
                  <option>Valid</option><option>Expired</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">PUC Expiry Date</label>
                <input type="date" className="form-input" value={formCar.PUC_ExpiryDate} onChange={e => setFormCar(f => ({...f,PUC_ExpiryDate:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Insurance Expiry Date</label>
                <input type="date" className="form-input" value={formCar.InsuranceExpiryDate} onChange={e => setFormCar(f => ({...f,InsuranceExpiryDate:e.target.value}))} />
              </div>
            </div>
          ) : (
            <div className="form-grid">
              {[['VendorID','Vendor ID','V001'],['Name','Full Name','Suresh Nair'],['VendorEmployeeID','Employee ID','SE001'],['LicenseNumber','License Number','KA2010001234']].map(([k,l,p]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" value={formDrv[k]} onChange={e => setFormDrv(f => ({...f,[k]:e.target.value}))} placeholder={p} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={formDrv.Gender} onChange={e => setFormDrv(f => ({...f,Gender:e.target.value}))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={formDrv.DOB} onChange={e => setFormDrv(f => ({...f,DOB:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">License Expiry Date</label>
                <input type="date" className="form-input" value={formDrv.LicenseExpiryDate} onChange={e => setFormDrv(f => ({...f,LicenseExpiryDate:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">BGV Status</label>
                <select className="form-input" value={formDrv.BGV_Status} onChange={e => setFormDrv(f => ({...f,BGV_Status:e.target.value}))}>
                  <option>Pending</option><option>Verified</option><option>Failed</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Languages Spoken</label>
                <input className="form-input" value={formDrv.LanguagesSpoken} onChange={e => setFormDrv(f => ({...f,LanguagesSpoken:e.target.value}))} placeholder="Kannada|Hindi|English" />
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Food Registry ─────────────────────────────────────────
const STAFF_COLS = [
  { key: 'StaffID', label: 'Staff ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'Name', label: 'Name' },
  { key: 'BGV_Status', label: 'BGV', render: v => <span className={v === 'Verified' ? 'badge badge-green' : 'badge badge-amber'}>{v}</span> },
  { key: 'TrainingCertStatus', label: 'Training', render: v => <span className={v === 'Certified' ? 'badge badge-green' : 'badge badge-amber'}>{v}</span> },
  { key: 'MedicalFitness_ExpiryDate', label: 'Medical Expiry', render: v => {
    const expired = v && new Date(v) < new Date();
    return <span className={expired ? 'discrepancy' : ''}>{v}</span>;
  }},
];

const CATALOG_COLS = [
  { key: 'ItemID', label: 'Item ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'ItemName', label: 'Item Name' },
  { key: 'Calories', label: 'Calories' },
  { key: 'DietaryType', label: 'Type', render: v => {
    const map = { Veg: 'badge badge-green', 'Non-Veg': 'badge badge-red', Vegan: 'badge badge-blue' };
    return <span className={map[v] || 'badge badge-gray'}>{v}</span>;
  }},
  { key: 'AllergensInfo', label: 'Allergens' },
];

function FoodRegistry() {
  const [subTab, setSubTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formStaff, setFormStaff] = useState({ VendorID: '', Name: '', VendorEmployeeID: '', DOB: '', GovID_Number: '', BGV_Status: 'Pending', TrainingCertStatus: 'Pending', MedicalFitness_ExpiryDate: '' });
  const [formItem, setFormItem] = useState({ VendorID: '', ItemName: '', Calories: '', DietaryType: 'Veg', AllergensInfo: '', IngredientsList: '' });

  useEffect(() => {
    Promise.all([api.getFoodStaff(), api.getFoodCatalog()])
      .then(([s, c]) => { setStaff(s); setCatalog(c); })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (subTab === 'staff') {
        const row = await api.createFoodStaff(formStaff);
        setStaff(p => [...p, row]);
      } else {
        const row = await api.createFoodItem(formItem);
        setCatalog(p => [...p, row]);
      }
      setShowModal(false);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="tabs">
          <button className={`tab-btn${subTab === 'staff' ? ' active' : ''}`} onClick={() => setSubTab('staff')}>Staff ({staff.length})</button>
          <button className={`tab-btn${subTab === 'catalog' ? ' active' : ''}`} onClick={() => setSubTab('catalog')}>Food Catalog ({catalog.length})</button>
        </div>
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Asset</button>
        </div>
      </div>
      {loading ? <div className="loading">Loading…</div> : (
        subTab === 'staff' ? <DataTable columns={STAFF_COLS} data={staff} /> : <DataTable columns={CATALOG_COLS} data={catalog} />
      )}
      {showModal && (
        <Modal title={`Add ${subTab === 'staff' ? 'Staff' : 'Food Item'}`} onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn${subTab === 'staff' ? ' active' : ''}`} onClick={() => setSubTab('staff')}>Staff</button>
            <button className={`tab-btn${subTab === 'catalog' ? ' active' : ''}`} onClick={() => setSubTab('catalog')}>Food Item</button>
          </div>
          {subTab === 'staff' ? (
            <div className="form-grid">
              {[['VendorID','Vendor ID','V003'],['Name','Full Name','Lakshmi Devi'],['VendorEmployeeID','Employee ID','GL001'],['GovID_Number','Gov ID Number','XXXX-XXXX-1234']].map(([k,l,p]) => (
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={formStaff[k]} onChange={e => setFormStaff(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
              ))}
              <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={formStaff.DOB} onChange={e => setFormStaff(f => ({...f,DOB:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">BGV Status</label><select className="form-input" value={formStaff.BGV_Status} onChange={e => setFormStaff(f => ({...f,BGV_Status:e.target.value}))}><option>Pending</option><option>Verified</option><option>Failed</option></select></div>
              <div className="form-group"><label className="form-label">Training Status</label><select className="form-input" value={formStaff.TrainingCertStatus} onChange={e => setFormStaff(f => ({...f,TrainingCertStatus:e.target.value}))}><option>Pending</option><option>Certified</option></select></div>
              <div className="form-group"><label className="form-label">Medical Fitness Expiry</label><input type="date" className="form-input" value={formStaff.MedicalFitness_ExpiryDate} onChange={e => setFormStaff(f => ({...f,MedicalFitness_ExpiryDate:e.target.value}))} /></div>
            </div>
          ) : (
            <div className="form-grid">
              {[['VendorID','Vendor ID','V003'],['ItemName','Item Name','Idli Sambar'],['Calories','Calories','180'],['AllergensInfo','Allergens','Gluten']].map(([k,l,p]) => (
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={formItem[k]} onChange={e => setFormItem(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
              ))}
              <div className="form-group"><label className="form-label">Dietary Type</label><select className="form-input" value={formItem.DietaryType} onChange={e => setFormItem(f => ({...f,DietaryType:e.target.value}))}><option>Veg</option><option>Non-Veg</option><option>Vegan</option></select></div>
              <div className="form-group full"><label className="form-label">Ingredients List</label><input className="form-input" value={formItem.IngredientsList} onChange={e => setFormItem(f => ({...f,IngredientsList:e.target.value}))} placeholder="Rice|Urad Dal|Sambar" /></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── IT Registry ───────────────────────────────────────────
const ASSET_COLS = [
  { key: 'AssetID', label: 'Asset ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'AssetName', label: 'Asset Name' },
  { key: 'AssetCategory', label: 'Category', render: v => <span className="badge badge-blue">{v}</span> },
  { key: 'BasePrice', label: 'Base Price (₹)' },
  { key: 'BillingCycle', label: 'Billing Cycle' },
  { key: 'ManagerApprovalRequired', label: 'Mgr Approval', render: v => v === 'true' ? <span className="badge badge-amber">Required</span> : <span className="badge badge-gray">No</span> },
  { key: 'SupportIncluded', label: 'Support', render: v => v === 'true' ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span> },
];

const EMPTY_ASSET = { VendorID: '', AssetName: '', AssetCategory: 'Software', BasePrice: '', BillingCycle: 'Monthly', ManagerApprovalRequired: 'false', SupportIncluded: 'true' };

function ITRegistry() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_ASSET);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getITAssets().then(setAssets).finally(() => setLoading(false)); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const row = await api.createITAsset(form);
      setAssets(p => [...p, row]);
      setShowModal(false); setForm(EMPTY_ASSET);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="table-toolbar">
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Asset</button>
        </div>
      </div>
      {loading ? <div className="loading">Loading…</div> : <DataTable columns={ASSET_COLS} data={assets} />}
      {showModal && (
        <Modal title="Add IT Asset" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="form-grid">
            {[['VendorID','Vendor ID','V005'],['AssetName','Asset Name','Microsoft 365'],['BasePrice','Base Price (₹)','1200']].map(([k,l,p]) => (
              <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
            ))}
            <div className="form-group"><label className="form-label">Asset Category</label><select className="form-input" value={form.AssetCategory} onChange={e => setForm(f => ({...f,AssetCategory:e.target.value}))}><option>Software</option><option>Hardware</option><option>WiFi</option></select></div>
            <div className="form-group"><label className="form-label">Billing Cycle</label><select className="form-input" value={form.BillingCycle} onChange={e => setForm(f => ({...f,BillingCycle:e.target.value}))}><option>Monthly</option><option>Yearly</option></select></div>
            <div className="form-group"><label className="form-label">Manager Approval Required</label><select className="form-input" value={form.ManagerApprovalRequired} onChange={e => setForm(f => ({...f,ManagerApprovalRequired:e.target.value}))}><option value="false">No</option><option value="true">Yes</option></select></div>
            <div className="form-group"><label className="form-label">Support Included</label><select className="form-input" value={form.SupportIncluded} onChange={e => setForm(f => ({...f,SupportIncluded:e.target.value}))}><option value="true">Yes</option><option value="false">No</option></select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Main Registry Page ────────────────────────────────────
export default function Registry() {
  const [vendor, setVendor] = useState('transport');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Registry</div>
          <div className="page-subtitle">Static asset and personnel records</div>
        </div>
      </div>
      <div className="vendor-tabs">
        <button className={`vendor-tab${vendor === 'transport' ? ' active' : ''}`} onClick={() => setVendor('transport')}>🚕 Transport</button>
        <button className={`vendor-tab${vendor === 'food' ? ' active' : ''}`} onClick={() => setVendor('food')}>🥗 Food</button>
        <button className={`vendor-tab${vendor === 'it' ? ' active' : ''}`} onClick={() => setVendor('it')}>💻 IT</button>
      </div>
      {vendor === 'transport' && <TransportRegistry />}
      {vendor === 'food' && <FoodRegistry />}
      {vendor === 'it' && <ITRegistry />}
    </div>
  );
}
