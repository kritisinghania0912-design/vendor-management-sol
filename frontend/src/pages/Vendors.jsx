import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Drawer from '../components/Drawer';
import { TableSkeleton } from '../components/Skeleton';
import { makeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { riskBadge, statusBadge, paymentBadge } from '../utils/badges';

function getComplianceStatus(vendorId, issues) {
  const open = issues.filter(i => i.VendorID === vendorId && i.Status !== 'Resolved');
  if (open.some(i => i.RiskLevel === 'High')) return 'blocked';
  if (open.some(i => i.RiskLevel === 'Medium')) return 'watchdog';
  return 'clear';
}

function CompliancePulse({ status }) {
  const config = {
    blocked:  { label: 'Blocked',  cls: 'pulse-blocked' },
    watchdog: { label: 'Watchdog', cls: 'pulse-watchdog' },
    clear:    { label: 'Clear',    cls: 'pulse-clear' },
  };
  const c = config[status] || config.clear;
  return (
    <span className={`compliance-pulse ${c.cls}`}>
      <span className="pulse-dot" aria-hidden="true" />
      {c.label}
    </span>
  );
}

export default function Vendors() {
  const { vendorParam } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [finance, setFinance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [financeLoading, setFinanceLoading] = useState(false);

  const selectedId = searchParams.get('id');
  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    const api = makeApi(vendorParam);
    Promise.all([api.getVendors(), api.getIssues()])
      .then(([v, i]) => { setVendors(v); setAllIssues(i); })
      .finally(() => setLoading(false));
  }, [vendorParam]);

  useEffect(() => {
    if (!selectedId) { setFinance([]); return; }
    setFinanceLoading(true);
    makeApi(`?vendorId=${selectedId}`).getFinance()
      .then(setFinance)
      .finally(() => setFinanceLoading(false));
  }, [selectedId]);

  const selectedVendor = vendors.find(v => v.VendorID === selectedId);
  const vendorIssues = useMemo(
    () => allIssues.filter(i => i.VendorID === selectedId),
    [allIssues, selectedId]
  );
  const openIssueCount = vendorIssues.filter(i => i.Status !== 'Resolved').length;

  const stats = useMemo(() => {
    const statuses = vendors.map(v => getComplianceStatus(v.VendorID, allIssues));
    return {
      total:    vendors.length,
      blocked:  statuses.filter(s => s === 'blocked').length,
      watchdog: statuses.filter(s => s === 'watchdog').length,
      clear:    statuses.filter(s => s === 'clear').length,
    };
  }, [vendors, allIssues]);

  const COLUMNS = useMemo(() => [
    { key: 'VendorID', label: 'ID' },
    { key: 'CompanyName', label: 'Company' },
    { key: 'VendorCategory', label: 'Category', render: v => {
      const icon = v === 'Transport' ? '🚕' : v === 'Food' ? '🥗' : '💻';
      return <span><span aria-hidden="true">{icon} </span>{v}</span>;
    }},
    { key: 'POC_Name', label: 'POC' },
    { key: 'MSA_EndDate', label: 'Contract Expiry', render: v => {
      if (!v) return '—';
      const days = Math.round((new Date(v) - new Date()) / 86400000);
      if (days < 0) return <span className="discrepancy">{v} (expired)</span>;
      if (days < 60) return <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{v} ({days}d)</span>;
      return v;
    }},
    { key: '_compliance', label: 'Compliance', sortable: false, render: (_, row) => (
      <CompliancePulse status={getComplianceStatus(row.VendorID, allIssues)} />
    )},
  ], [allIssues]);

  function openVendor(row) {
    setSearchParams({ id: row.VendorID, tab: 'overview' });
  }

  function setTab(tab) {
    setSearchParams({ id: selectedId, tab });
  }

  function closeDrawer() {
    setSearchParams({});
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Vendors</div>
          <div className="page-subtitle">{stats.total} registered vendors</div>
        </div>
      </div>

      <div className="cards-row">
        <div className="card">
          <div className="card-label">Total Vendors</div>
          <div className="card-value">{stats.total}</div>
        </div>
        <div className="card">
          <div className="card-label">Blocked</div>
          <div className={`card-value${stats.blocked > 0 ? ' red' : ' green'}`}>{stats.blocked}</div>
          <div className="card-footer">High-risk open issues</div>
        </div>
        <div className="card">
          <div className="card-label">Watchdog</div>
          <div className={`card-value${stats.watchdog > 0 ? ' amber' : ' green'}`}>{stats.watchdog}</div>
          <div className="card-footer">Medium-risk open issues</div>
        </div>
        <div className="card">
          <div className="card-label">Clear</div>
          <div className="card-value green">{stats.clear}</div>
          <div className="card-footer">No open issues</div>
        </div>
      </div>

      {loading
        ? <TableSkeleton cols={6} rows={5} />
        : <DataTable columns={COLUMNS} data={vendors} onRowClick={openVendor} />
      }

      <Drawer
        isOpen={!!selectedVendor}
        onClose={closeDrawer}
        title={selectedVendor?.CompanyName}
        subtitle={`${selectedVendor?.VendorCategory} · ${selectedVendor?.VendorID}`}
      >
        {selectedVendor && (
          <>
            <div className="drawer-tabs" role="tablist">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'issues',   label: 'Issues', badge: openIssueCount > 0 ? openIssueCount : null },
                { id: 'finance',  label: 'Finance' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`drawer-tab${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  {tab.label}
                  {tab.badge && <span className="drawer-tab-badge">{tab.badge}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="drawer-section">
                <div className="drawer-compliance-banner" data-status={getComplianceStatus(selectedVendor.VendorID, allIssues)}>
                  <CompliancePulse status={getComplianceStatus(selectedVendor.VendorID, allIssues)} />
                  <span className="drawer-compliance-detail">
                    {openIssueCount > 0 ? `${openIssueCount} open issue${openIssueCount > 1 ? 's' : ''}` : 'No open issues'}
                  </span>
                </div>
                <div className="drawer-fields">
                  {[
                    ['POC Name',     selectedVendor.POC_Name],
                    ['Email',        selectedVendor.POC_Email],
                    ['Phone',        selectedVendor.POC_Phone],
                    ['GSTIN',        selectedVendor.GSTIN],
                    ['MSA Start',    selectedVendor.MSA_StartDate],
                    ['MSA End',      selectedVendor.MSA_EndDate],
                    ['Bank Account', selectedVendor.BankAccountNo],
                    ['IFSC',         selectedVendor.IFSC_Code],
                    ['Address',      selectedVendor.Address],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="drawer-field">
                      <span className="drawer-field-label">{label}</span>
                      <span className="drawer-field-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'issues' && (
              <div className="drawer-section">
                {vendorIssues.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✓</div>
                    <p>No compliance issues on record</p>
                  </div>
                ) : vendorIssues.map(issue => (
                  <div key={issue.TicketID} className="drawer-issue-row">
                    <div className="drawer-issue-header">
                      <span className="drawer-issue-id">{issue.TicketID}</span>
                      <span style={{ display: 'flex', gap: 6 }}>
                        {riskBadge(issue.RiskLevel)}
                        {statusBadge(issue.Status)}
                      </span>
                    </div>
                    <p className="drawer-issue-desc">{issue.Description}</p>
                    <span className="drawer-issue-meta">{issue.Category} · {issue.ReportDate}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="drawer-section">
                {financeLoading ? (
                  <TableSkeleton cols={3} rows={4} />
                ) : finance.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">₹</div><p>No finance records</p></div>
                ) : finance.map(inv => (
                  <div key={inv.InvoiceID} className="drawer-finance-row">
                    <div className="drawer-finance-header">
                      <span className="drawer-issue-id">{inv.InvoiceID}</span>
                      {paymentBadge(inv.PaymentStatus)}
                    </div>
                    <div className="drawer-finance-period">
                      {inv.PeriodStartDate} → {inv.PeriodEndDate}
                    </div>
                    <div className="drawer-finance-amounts">
                      <div className="drawer-amount-row">
                        <span className="drawer-field-label">Billed</span>
                        <span className="drawer-amount-value">₹{Number(inv.TotalAmountBilled).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="drawer-amount-row">
                        <span className="drawer-field-label">Amount Due</span>
                        <span className={`drawer-amount-value${Number(inv.AmountDue) > 0 ? ' discrepancy' : ''}`}>
                          ₹{Number(inv.AmountDue).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
