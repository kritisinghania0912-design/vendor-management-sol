import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { makeApi } from '../api';
import { useAuth } from '../context/AuthContext';

const CAR_COLS = [
  { key: 'CarID', label: 'Car ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'CarNumber', label: 'Plate No.' },
  { key: 'CarModel', label: 'Model' },
  { key: 'CarType', label: 'Type' },
  { key: 'SeatingCapacity', label: 'Seats' },
  { key: 'PUC_Status', label: 'PUC', render: v => <span className={v === 'Expired' ? 'badge badge-red' : 'badge badge-green'}>{v}</span> },
  { key: 'PUC_ExpiryDate', label: 'PUC Expiry', render: v => {
    const expired = v && new Date(v) < new Date();
    return <span className={expired ? 'discrepancy' : ''}>{v}</span>;
  }},
  { key: 'InsuranceExpiryDate', label: 'Insurance Expiry', render: v => {
    const expired = v && new Date(v) < new Date();
    return <span className={expired ? 'discrepancy' : ''}>{v}</span>;
  }},
  { key: 'GPSTrackerID', label: 'GPS' },
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
  const { vendorParam, isAdmin, user } = useAuth();
  const [subTab, setSubTab] = useState('cars');
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formCar, setFormCar] = useState(EMPTY_CAR);
  const [formDrv, setFormDrv] = useState(EMPTY_DRV);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const api = makeApi(vendorParam);
    Promise.all([api.getCars(), api.getDrivers()])
      .then(([c, d]) => { setCars(c); setDrivers(d); })
      .finally(() => setLoading(false));
  }, [vendorParam]);

  const expiredLicenses = drivers.filter(d => d.LicenseExpiryDate && new Date(d.LicenseExpiryDate) < new Date()).length;
  const expiredPUC = cars.filter(c => c.PUC_Status === 'Expired').length;

  async function handleSave() {
    const api = makeApi(vendorParam);
    setSaving(true);
    try {
      if (subTab === 'cars') { const r = await api.createCar({ ...formCar, VendorID: formCar.VendorID || user?.vendorId }); setCars(p => [...p, r]); setFormCar(EMPTY_CAR); }
      else { const r = await api.createDriver({ ...formDrv, VendorID: formDrv.VendorID || user?.vendorId }); setDrivers(p => [...p, r]); setFormDrv(EMPTY_DRV); }
      setShowModal(false);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="cards-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        <div className="card"><div className="card-label">Total Vehicles</div><div className="card-value">{cars.length}</div></div>
        <div className="card"><div className="card-label">PUC Expired</div><div className={`card-value${expiredPUC > 0 ? ' red' : ' green'}`}>{expiredPUC}</div></div>
        <div className="card"><div className="card-label">Total Drivers</div><div className="card-value">{drivers.length}</div></div>
        <div className="card"><div className="card-label">License Expired</div><div className={`card-value${expiredLicenses > 0 ? ' red' : ' green'}`}>{expiredLicenses}</div></div>
      </div>
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
        <Modal title={`Register ${subTab === 'cars' ? 'Vehicle' : 'Driver'}`} onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn${subTab === 'cars' ? ' active' : ''}`} onClick={() => setSubTab('cars')}>Vehicle</button>
            <button className={`tab-btn${subTab === 'drivers' ? ' active' : ''}`} onClick={() => setSubTab('drivers')}>Driver</button>
          </div>
          {subTab === 'cars' ? (
            <div className="form-grid">
              {isAdmin && <div className="form-group"><label className="form-label">Vendor ID</label><input className="form-input" value={formCar.VendorID} onChange={e => setFormCar(f => ({...f,VendorID:e.target.value}))} placeholder="V001" /></div>}
              {[['CarNumber','Plate Number','KA-01-AB-1234'],['CarModel','Car Model','Toyota Innova'],['SeatingCapacity','Seating Capacity','7'],['GPSTrackerID','GPS Tracker ID','GPS001']].map(([k,l,p]) => (
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={formCar[k]} onChange={e => setFormCar(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
              ))}
              <div className="form-group"><label className="form-label">Car Type</label><select className="form-input" value={formCar.CarType} onChange={e => setFormCar(f => ({...f,CarType:e.target.value}))}><option>Sedan</option><option>SUV</option><option>MUV</option><option>Hatchback</option></select></div>
              <div className="form-group"><label className="form-label">PUC Status</label><select className="form-input" value={formCar.PUC_Status} onChange={e => setFormCar(f => ({...f,PUC_Status:e.target.value}))}><option>Valid</option><option>Expired</option></select></div>
              <div className="form-group"><label className="form-label">PUC Expiry Date</label><input type="date" className="form-input" value={formCar.PUC_ExpiryDate} onChange={e => setFormCar(f => ({...f,PUC_ExpiryDate:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Insurance Expiry Date</label><input type="date" className="form-input" value={formCar.InsuranceExpiryDate} onChange={e => setFormCar(f => ({...f,InsuranceExpiryDate:e.target.value}))} /></div>
            </div>
          ) : (
            <div className="form-grid">
              {isAdmin && <div className="form-group"><label className="form-label">Vendor ID</label><input className="form-input" value={formDrv.VendorID} onChange={e => setFormDrv(f => ({...f,VendorID:e.target.value}))} placeholder="V001" /></div>}
              {[['Name','Full Name','Suresh Nair'],['VendorEmployeeID','Employee ID','SE001'],['LicenseNumber','License No.','KA2010001234']].map(([k,l,p]) => (
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={formDrv[k]} onChange={e => setFormDrv(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
              ))}
              <div className="form-group"><label className="form-label">Gender</label><select className="form-input" value={formDrv.Gender} onChange={e => setFormDrv(f => ({...f,Gender:e.target.value}))}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={formDrv.DOB} onChange={e => setFormDrv(f => ({...f,DOB:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">License Expiry</label><input type="date" className="form-input" value={formDrv.LicenseExpiryDate} onChange={e => setFormDrv(f => ({...f,LicenseExpiryDate:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">BGV Status</label><select className="form-input" value={formDrv.BGV_Status} onChange={e => setFormDrv(f => ({...f,BGV_Status:e.target.value}))}><option>Pending</option><option>Verified</option><option>Failed</option></select></div>
              <div className="form-group full"><label className="form-label">Languages Spoken</label><input className="form-input" value={formDrv.LanguagesSpoken} onChange={e => setFormDrv(f => ({...f,LanguagesSpoken:e.target.value}))} placeholder="Kannada|Hindi|English" /></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

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
  { key: 'Calories', label: 'Cal.' },
  { key: 'DietaryType', label: 'Type', render: v => {
    const map = { Veg: 'badge badge-green', 'Non-Veg': 'badge badge-red', Vegan: 'badge badge-blue' };
    return <span className={map[v] || 'badge badge-gray'}>{v}</span>;
  }},
  { key: 'AllergensInfo', label: 'Allergens' },
  { key: 'IngredientsList', label: 'Ingredients' },
];

function FoodRegistry() {
  const { vendorParam, isAdmin, user } = useAuth();
  const [subTab, setSubTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formStaff, setFormStaff] = useState({ VendorID: '', Name: '', VendorEmployeeID: '', DOB: '', GovID_Number: '', BGV_Status: 'Pending', TrainingCertStatus: 'Pending', MedicalFitness_ExpiryDate: '' });
  const [formItem, setFormItem] = useState({ VendorID: '', ItemName: '', Calories: '', DietaryType: 'Veg', AllergensInfo: 'None', IngredientsList: '' });

  useEffect(() => {
    const api = makeApi(vendorParam);
    Promise.all([api.getFoodStaff(), api.getFoodCatalog()])
      .then(([s, c]) => { setStaff(s); setCatalog(c); })
      .finally(() => setLoading(false));
  }, [vendorParam]);

  const pendingBGV = staff.filter(s => s.BGV_Status !== 'Verified').length;

  async function handleSave() {
    const api = makeApi(vendorParam);
    setSaving(true);
    try {
      if (subTab === 'staff') { const r = await api.createFoodStaff({ ...formStaff, VendorID: formStaff.VendorID || user?.vendorId }); setStaff(p => [...p, r]); }
      else { const r = await api.createFoodItem({ ...formItem, VendorID: formItem.VendorID || user?.vendorId }); setCatalog(p => [...p, r]); }
      setShowModal(false);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="cards-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="card"><div className="card-label">Total Staff</div><div className="card-value">{staff.length}</div></div>
        <div className="card"><div className="card-label">BGV Pending</div><div className={`card-value${pendingBGV > 0 ? ' amber' : ' green'}`}>{pendingBGV}</div></div>
        <div className="card"><div className="card-label">Menu Items</div><div className="card-value">{catalog.length}</div></div>
      </div>
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
        <Modal title={subTab === 'staff' ? 'Register Staff' : 'Add Food Item'} onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={`tab-btn${subTab === 'staff' ? ' active' : ''}`} onClick={() => setSubTab('staff')}>Staff</button>
            <button className={`tab-btn${subTab === 'catalog' ? ' active' : ''}`} onClick={() => setSubTab('catalog')}>Food Item</button>
          </div>
          {subTab === 'staff' ? (
            <div className="form-grid">
              {isAdmin && <div className="form-group"><label className="form-label">Vendor ID</label><input className="form-input" value={formStaff.VendorID} onChange={e => setFormStaff(f => ({...f,VendorID:e.target.value}))} placeholder="V003" /></div>}
              {[['Name','Full Name','Lakshmi Devi'],['VendorEmployeeID','Employee ID','GL001'],['GovID_Number','Gov ID Number','XXXX-XXXX-1234']].map(([k,l,p]) => (
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={formStaff[k]} onChange={e => setFormStaff(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
              ))}
              <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={formStaff.DOB} onChange={e => setFormStaff(f => ({...f,DOB:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">BGV Status</label><select className="form-input" value={formStaff.BGV_Status} onChange={e => setFormStaff(f => ({...f,BGV_Status:e.target.value}))}><option>Pending</option><option>Verified</option><option>Failed</option></select></div>
              <div className="form-group"><label className="form-label">Training Status</label><select className="form-input" value={formStaff.TrainingCertStatus} onChange={e => setFormStaff(f => ({...f,TrainingCertStatus:e.target.value}))}><option>Pending</option><option>Certified</option></select></div>
              <div className="form-group"><label className="form-label">Medical Fitness Expiry</label><input type="date" className="form-input" value={formStaff.MedicalFitness_ExpiryDate} onChange={e => setFormStaff(f => ({...f,MedicalFitness_ExpiryDate:e.target.value}))} /></div>
            </div>
          ) : (
            <div className="form-grid">
              {isAdmin && <div className="form-group"><label className="form-label">Vendor ID</label><input className="form-input" value={formItem.VendorID} onChange={e => setFormItem(f => ({...f,VendorID:e.target.value}))} placeholder="V003" /></div>}
              {[['ItemName','Item Name','Idli Sambar'],['Calories','Calories','180'],['AllergensInfo','Allergens','Gluten']].map(([k,l,p]) => (
                <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={formItem[k]} onChange={e => setFormItem(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
              ))}
              <div className="form-group"><label className="form-label">Dietary Type</label><select className="form-input" value={formItem.DietaryType} onChange={e => setFormItem(f => ({...f,DietaryType:e.target.value}))}><option>Veg</option><option>Non-Veg</option><option>Vegan</option></select></div>
              <div className="form-group full"><label className="form-label">Ingredients</label><input className="form-input" value={formItem.IngredientsList} onChange={e => setFormItem(f => ({...f,IngredientsList:e.target.value}))} placeholder="Rice|Urad Dal|Sambar" /></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

const ASSET_COLS = [
  { key: 'AssetID', label: 'Asset ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'AssetName', label: 'Asset Name' },
  { key: 'AssetCategory', label: 'Category', render: v => <span className="badge badge-blue">{v}</span> },
  { key: 'BasePrice', label: 'Base Price (₹)', render: v => Number(v).toLocaleString('en-IN') },
  { key: 'BillingCycle', label: 'Billing' },
  { key: 'ManagerApprovalRequired', label: 'Mgr Approval', render: v => v === 'true' ? <span className="badge badge-amber">Required</span> : <span className="badge badge-gray">No</span> },
  { key: 'SupportIncluded', label: 'Support', render: v => v === 'true' ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span> },
];
const EMPTY_ASSET = { VendorID: '', AssetName: '', AssetCategory: 'Software', BasePrice: '', BillingCycle: 'Monthly', ManagerApprovalRequired: 'false', SupportIncluded: 'true' };

function ITRegistry() {
  const { vendorParam, isAdmin, user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_ASSET);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const api = makeApi(vendorParam);
    api.getITAssets().then(setAssets).finally(() => setLoading(false));
  }, [vendorParam]);

  const monthlyAMC = assets.filter(a => a.BillingCycle === 'Monthly').reduce((s, a) => s + Number(a.BasePrice || 0), 0);
  const needsApproval = assets.filter(a => a.ManagerApprovalRequired === 'true').length;

  async function handleSave() {
    const api = makeApi(vendorParam);
    setSaving(true);
    try {
      const r = await api.createITAsset({ ...form, VendorID: form.VendorID || user?.vendorId });
      setAssets(p => [...p, r]); setShowModal(false); setForm(EMPTY_ASSET);
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="cards-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="card"><div className="card-label">Total Assets</div><div className="card-value">{assets.length}</div></div>
        <div className="card"><div className="card-label">Monthly AMC</div><div className="card-value" style={{fontSize:20}}>₹{monthlyAMC.toLocaleString('en-IN')}</div></div>
        <div className="card"><div className="card-label">Needs Approval</div><div className={`card-value${needsApproval > 0 ? ' amber' : ' green'}`}>{needsApproval}</div></div>
      </div>
      <div className="table-toolbar">
        <div className="table-toolbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Asset</button>
        </div>
      </div>
      {loading ? <div className="loading">Loading…</div> : <DataTable columns={ASSET_COLS} data={assets} />}
      {showModal && (
        <Modal title="Register IT Asset" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="form-grid">
            {isAdmin && <div className="form-group"><label className="form-label">Vendor ID</label><input className="form-input" value={form.VendorID} onChange={e => setForm(f => ({...f,VendorID:e.target.value}))} placeholder="V005" /></div>}
            {[['AssetName','Asset Name','Microsoft 365'],['BasePrice','Base Price (₹)','1200']].map(([k,l,p]) => (
              <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={p} /></div>
            ))}
            <div className="form-group"><label className="form-label">Asset Category</label><select className="form-input" value={form.AssetCategory} onChange={e => setForm(f => ({...f,AssetCategory:e.target.value}))}><option>Software</option><option>Hardware</option><option>WiFi</option></select></div>
            <div className="form-group"><label className="form-label">Billing Cycle</label><select className="form-input" value={form.BillingCycle} onChange={e => setForm(f => ({...f,BillingCycle:e.target.value}))}><option>Monthly</option><option>Yearly</option></select></div>
            <div className="form-group"><label className="form-label">Manager Approval</label><select className="form-input" value={form.ManagerApprovalRequired} onChange={e => setForm(f => ({...f,ManagerApprovalRequired:e.target.value}))}><option value="false">No</option><option value="true">Yes</option></select></div>
            <div className="form-group"><label className="form-label">Support Included</label><select className="form-input" value={form.SupportIncluded} onChange={e => setForm(f => ({...f,SupportIncluded:e.target.value}))}><option value="true">Yes</option><option value="false">No</option></select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Registry() {
  const { isVendor, user } = useAuth();

  const defaultVendor = isVendor
    ? (user?.vendorCategory === 'Food' ? 'food' : user?.vendorCategory === 'IT' ? 'it' : 'transport')
    : 'transport';
  const [vendor, setVendor] = useState(defaultVendor);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isVendor ? 'My Asset Registry' : 'Registry'}</div>
          <div className="page-subtitle">{isVendor ? `Assets registered under ${user?.vendorName}` : 'Static asset and personnel records by vendor type'}</div>
        </div>
      </div>
      {!isVendor && (
        <div className="vendor-tabs">
          <button className={`vendor-tab${vendor === 'transport' ? ' active' : ''}`} onClick={() => setVendor('transport')}>🚕 Transport</button>
          <button className={`vendor-tab${vendor === 'food' ? ' active' : ''}`} onClick={() => setVendor('food')}>🥗 Food</button>
          <button className={`vendor-tab${vendor === 'it' ? ' active' : ''}`} onClick={() => setVendor('it')}>💻 IT</button>
        </div>
      )}
      {vendor === 'transport' && <TransportRegistry />}
      {vendor === 'food' && <FoodRegistry />}
      {vendor === 'it' && <ITRegistry />}
    </div>
  );
}
