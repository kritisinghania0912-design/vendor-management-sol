import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import { TableSkeleton } from '../components/Skeleton';
import { makeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { riskBadge, statusBadge, priorityBadge } from '../utils/badges';

const COLUMNS = [
  { key: 'TicketID', label: 'Ticket ID' },
  { key: 'VendorID', label: 'Vendor' },
  { key: 'ReportDate', label: 'Date' },
  { key: 'Priority', label: 'Priority', render: priorityBadge },
  { key: 'RiskLevel', label: 'Risk', render: riskBadge },
  { key: 'Category', label: 'Category' },
  { key: 'Description', label: 'Description' },
  { key: 'Status', label: 'Status', render: statusBadge },
];

const EMPTY_FORM = {
  VendorID: '', ReportDate: '', RiskLevel: 'Low', Priority: 'P3',
  Category: 'Expiry', Description: '', ActionTaken: '', Status: 'Open',
};

const STATUS_OPTIONS = ['Open', 'In-Progress', 'Resolved'];

export default function Issues() {
  const { vendorParam, isAdmin, user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterRisk, setFilterRisk] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const selectedTicketId = searchParams.get('ticket');

  useEffect(() => {
    const api = makeApi(vendorParam);
    setLoading(true);
    api.getIssues().then(setIssues).catch(console.error).finally(() => setLoading(false));
  }, [vendorParam]);

  const stats = useMemo(() => ({
    open:       issues.filter(i => i.Status === 'Open').length,
    inProgress: issues.filter(i => i.Status === 'In-Progress').length,
    resolved:   issues.filter(i => i.Status === 'Resolved').length,
    highRisk:   issues.filter(i => i.RiskLevel === 'High').length,
  }), [issues]);

  const filtered = useMemo(() => issues.filter(i => {
    if (filterRisk && i.RiskLevel !== filterRisk) return false;
    if (filterStatus && i.Status !== filterStatus) return false;
    if (filterCat && i.Category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return Object.values(i).some(v => String(v).toLowerCase().includes(q));
    }
    return true;
  }), [issues, filterRisk, filterStatus, filterCat, search]);

  const selectedTicket = issues.find(i => i.TicketID === selectedTicketId);

  async function handleSave() {
    if (!form.VendorID || !form.Description) {
      toast('Vendor ID and Description are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const api = makeApi(vendorParam);
      const created = await api.createIssue({ ...form, ReportDate: form.ReportDate || new Date().toISOString().slice(0, 10) });
      setIssues(prev => [...prev, created]);
      setShowModal(false);
      setForm(EMPTY_FORM);
      toast('Issue raised successfully.', 'success');
    } catch {
      toast('Failed to save issue. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Optimistic status update — reverts on failure
  async function handleStatusChange(ticketId, newStatus) {
    const snapshot = issues;
    setIssues(prev => prev.map(i => i.TicketID === ticketId ? { ...i, Status: newStatus } : i));
    try {
      const api = makeApi(vendorParam);
      await api.updateIssue(ticketId, { Status: newStatus });
      toast('Status updated.', 'success');
    } catch {
      setIssues(snapshot);
      toast('Failed to update status.', 'error');
    }
  }

  // Batch resolve — optimistic, reverts on any failure
  async function handleBatchResolve() {
    const keys = [...selectedKeys];
    const snapshot = issues;
    setIssues(prev => prev.map(i => keys.includes(i.TicketID) ? { ...i, Status: 'Resolved' } : i));
    setSelectedKeys(new Set());
    try {
      const api = makeApi(vendorParam);
      await Promise.all(keys.map(id => api.updateIssue(id, { Status: 'Resolved' })));
      toast(`${keys.length} issue${keys.length > 1 ? 's' : ''} resolved.`, 'success');
    } catch {
      setIssues(snapshot);
      toast('Batch update failed. Changes reverted.', 'error');
    }
  }

  function openTicket(row) {
    setSearchParams({ ticket: row.TicketID });
  }

  function closeDrawer() {
    setSearchParams({});
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isAdmin ? 'Compliance Issues' : 'My Issues'}</div>
          <div className="page-subtitle">
            {stats.open} open · {stats.highRisk} high risk
            {!isAdmin && ` · ${user?.vendorName}`}
          </div>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
            + Raise Issue
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Open',        count: stats.open,       cls: 'badge badge-red' },
          { label: 'In Progress', count: stats.inProgress, cls: 'badge badge-amber' },
          { label: 'Resolved',    count: stats.resolved,   cls: 'badge badge-green' },
          { label: 'High Risk',   count: stats.highRisk,   cls: 'badge badge-red' },
        ].map(({ label, count, cls }) => (
          <div key={label} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            <span className={cls}>{count}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="table-toolbar">
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Search issues…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search issues"
          />
        </div>
        <select className="filter-select" value={filterRisk} onChange={e => setFilterRisk(e.target.value)} aria-label="Filter by risk level">
          <option value="">All Risk Levels</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All Statuses</option>
          <option>Open</option><option>In-Progress</option><option>Resolved</option>
        </select>
        <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)} aria-label="Filter by category">
          <option value="">All Categories</option>
          <option>Expiry</option><option>Discrepancy</option><option>Safety</option><option>Employee Complaint</option>
        </select>
        <div className="table-toolbar-right">
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{filtered.length} records</span>
        </div>
      </div>

      {loading ? <TableSkeleton cols={8} rows={6} /> : (
        <DataTable
          columns={COLUMNS}
          data={filtered}
          onRowClick={openTicket}
          selectable={isAdmin}
          rowKey="TicketID"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        />
      )}

      {/* Batch action bar */}
      {selectedKeys.size > 0 && (
        <div className="batch-bar" role="toolbar" aria-label="Batch actions">
          <span className="batch-bar-count">{selectedKeys.size} selected</span>
          <div className="batch-bar-divider" />
          <button className="batch-bar-btn" onClick={handleBatchResolve}>
            ✓ Mark Resolved
          </button>
          <button className="batch-bar-btn secondary" onClick={() => setSelectedKeys(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Ticket side-peek drawer */}
      <Drawer
        isOpen={!!selectedTicket}
        onClose={closeDrawer}
        title={selectedTicket ? `${selectedTicket.TicketID} — ${selectedTicket.Category}` : ''}
        subtitle={selectedTicket ? `${selectedTicket.VendorID} · Reported ${selectedTicket.ReportDate}` : ''}
      >
        {selectedTicket && (
          <div className="drawer-section">
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {riskBadge(selectedTicket.RiskLevel)}
              {priorityBadge(selectedTicket.Priority)}
              {statusBadge(selectedTicket.Status)}
            </div>

            <div className="drawer-fields" style={{ marginBottom: 20 }}>
              <div className="drawer-field">
                <span className="drawer-field-label">Description</span>
                <span className="drawer-field-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedTicket.Description}
                </span>
              </div>
              {selectedTicket.ActionTaken && (
                <div className="drawer-field">
                  <span className="drawer-field-label">Action Taken</span>
                  <span className="drawer-field-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {selectedTicket.ActionTaken}
                  </span>
                </div>
              )}
            </div>

            {isAdmin && (
              <div>
                <div className="drawer-field-label" style={{ marginBottom: 8 }}>Update Status</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      className={selectedTicket.Status === s ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize: 12.5, padding: '6px 14px' }}
                      onClick={() => handleStatusChange(selectedTicket.TicketID, s)}
                      disabled={selectedTicket.Status === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {showModal && (
        <Modal title="Raise Issue" onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
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
