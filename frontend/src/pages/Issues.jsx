import { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { api } from '../api';

function riskBadge(v) {
  const map = { High: 'badge badge-red', Medium: 'badge badge-amber', Low: 'badge badge-green' };
  return <span className={map[v] || 'badge badge-gray'}>{v}</span>;
}

function statusBadge(v) {
  const map = { Open: 'badge badge-red', 'In-Progress': 'badge badge-amber', Resolved: 'badge badge-green' };
  return <span className={map[v] || 'badge badge-gray'}>{v}</span>;
}

function priorityBadge(v) {
  const map = { P0: 'badge badge-red', P1: 'badge badge-red', P2: 'badge badge-amber', P3: 'badge badge-blue', P4: 'badge badge-gray' };
  return <span className={map[v] || 'badge badge-gray'}>{v}</span>;
}

const COLUMNS = [
  { key: 'TicketID', label: 'Ticket ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'ReportDate', label: 'Date' },
  { key: 'Priority', label: 'Priority', render: v => priorityBadge(v) },
  { key: 'RiskLevel', label: 'Risk', render: v => riskBadge(v) },
  { key: 'Category', label: 'Category' },
  { key: 'Description', label: 'Description' },
  { key: 'Status', label: 'Status', render: v => statusBadge(v) },
];

const EMPTY_FORM = {
  VendorID: '', ReportDate: '', RiskLevel: 'Low', Priority: 'P3',
  Category: 'Expiry', Description: '', ActionTaken: '', Status: 'Open',
};

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterRisk, setFilterRisk] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getIssues().then(setIssues).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return issues.filter(i => {
      if (filterRisk && i.RiskLevel !== filterRisk) return false;
      if (filterStatus && i.Status !== filterStatus) return false;
      if (filterCat && i.Category !== filterCat) return false;
      if (search) {
        const q = search.toLowerCase();
        return Object.values(i).some(v => String(v).toLowerCase().includes(q));
      }
      return true;
    });
  }, [issues, filterRisk, filterStatus, filterCat, search]);

  async function handleSave() {
    if (!form.VendorID || !form.Description) return alert('Vendor ID and Description are required.');
    setSaving(true);
    try {
      const created = await api.createIssue({ ...form, ReportDate: form.ReportDate || new Date().toISOString().slice(0, 10) });
      setIssues(prev => [...prev, created]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      alert('Failed to save issue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Issues</div>
          <div className="page-subtitle">Compliance tickets and risk alerts</div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Issue</button>
      </div>

      <div className="table-toolbar">
        <input className="search-input" placeholder="Search issues…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Open</option><option>In-Progress</option><option>Resolved</option>
        </select>
        <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          <option>Expiry</option><option>Discrepancy</option><option>Safety</option><option>Employee Complaint</option>
        </select>
        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} records</span>
        </div>
      </div>

      {loading
        ? <div className="loading">Loading issues…</div>
        : <DataTable columns={COLUMNS} data={filtered} />
      }

      {showModal && (
        <Modal title="Add Issue" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vendor ID <span className="req">*</span></label>
              <input className="form-input" value={form.VendorID} onChange={e => setForm(f => ({ ...f, VendorID: e.target.value }))} placeholder="e.g. V001" />
            </div>
            <div className="form-group">
              <label className="form-label">Report Date</label>
              <input type="date" className="form-input" value={form.ReportDate} onChange={e => setForm(f => ({ ...f, ReportDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Risk Level</label>
              <select className="form-input" value={form.RiskLevel} onChange={e => setForm(f => ({ ...f, RiskLevel: e.target.value }))}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.Priority} onChange={e => setForm(f => ({ ...f, Priority: e.target.value }))}>
                <option>P0</option><option>P1</option><option>P2</option><option>P3</option><option>P4</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.Category} onChange={e => setForm(f => ({ ...f, Category: e.target.value }))}>
                <option>Expiry</option><option>Discrepancy</option><option>Safety</option><option>Employee Complaint</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.Status} onChange={e => setForm(f => ({ ...f, Status: e.target.value }))}>
                <option>Open</option><option>In-Progress</option><option>Resolved</option>
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">Description <span className="req">*</span></label>
              <textarea className="form-input" rows={3} value={form.Description} onChange={e => setForm(f => ({ ...f, Description: e.target.value }))} placeholder="Describe the issue…" />
            </div>
            <div className="form-group full">
              <label className="form-label">Action Taken</label>
              <textarea className="form-input" rows={2} value={form.ActionTaken} onChange={e => setForm(f => ({ ...f, ActionTaken: e.target.value }))} placeholder="Action taken so far…" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
