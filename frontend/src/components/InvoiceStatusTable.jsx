import { useState, useMemo } from 'react';
import { paymentBadge } from '../utils/badges';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const VENDOR_CATEGORIES = ['All', 'Transport', 'Food', 'IT'];
const STATUSES = ['All', 'Fully Paid', 'Partial', 'Pending'];
const DUE_OPTIONS = ['All', 'Overdue', 'Not Due'];

// Map VendorID (V001–V006) → category based on known data layout
function resolveCategory(vendorId) {
  const n = parseInt((vendorId || '').replace(/\D/g, ''), 10);
  if (n <= 2) return 'Transport';
  if (n <= 4) return 'Food';
  return 'IT';
}

function checkOverdue(invoice) {
  if (invoice.PaymentStatus === 'Fully Paid') return false;
  const today = new Date('2026-04-10');
  const due = invoice.DueDate ? new Date(invoice.DueDate) : null;
  return due ? due < today : false;
}

export default function InvoiceStatusTable({ finance = [] }) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDue, setFilterDue] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const augmented = useMemo(
    () =>
      finance.map(inv => ({
        ...inv,
        vendorCategory: resolveCategory(inv.VendorID),
        overdue: checkOverdue(inv),
      })),
    [finance],
  );

  const filtered = useMemo(() => {
    let rows = augmented;
    if (filterCategory !== 'All') rows = rows.filter(r => r.vendorCategory === filterCategory);
    if (filterStatus !== 'All') rows = rows.filter(r => r.PaymentStatus === filterStatus);
    if (filterDue === 'Overdue') rows = rows.filter(r => r.overdue);
    if (filterDue === 'Not Due') rows = rows.filter(r => !r.overdue);
    if (dateFrom) rows = rows.filter(r => r.BilledDate >= dateFrom);
    if (dateTo) rows = rows.filter(r => r.BilledDate <= dateTo);
    return rows;
  }, [augmented, filterCategory, filterStatus, filterDue, dateFrom, dateTo]);

  return (
    <div className="table-section">
      <div className="section-header">Invoice Status</div>

      <div className="table-toolbar inv-toolbar">
        <select
          className="filter-select"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          aria-label="Filter by vendor category"
        >
          {VENDOR_CATEGORIES.map(c => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterDue}
          onChange={e => setFilterDue(e.target.value)}
          aria-label="Filter by due status"
        >
          {DUE_OPTIONS.map(d => (
            <option key={d} value={d}>{d === 'All' ? 'Due: All' : d}</option>
          ))}
        </select>
        <div className="date-range-group">
          <input
            type="date"
            className="filter-select date-input"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            aria-label="Date from"
          />
          <span className="date-sep">–</span>
          <input
            type="date"
            className="filter-select date-input"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            aria-label="Date to"
          />
        </div>
        <span className="result-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Category</th>
              <th>Period</th>
              <th>Billed</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map(inv => (
                <tr
                  key={inv.InvoiceID}
                  className={inv.overdue ? 'overdue-row' : ''}
                >
                  <td>
                    <span className="mono-id">{inv.InvoiceID}</span>
                    {inv.overdue && (
                      <span className="badge badge-red overdue-pill">Overdue</span>
                    )}
                  </td>
                  <td>{inv.vendorCategory}</td>
                  <td className="period-cell">
                    {inv.PeriodStartDate}
                    {inv.PeriodEndDate ? ` → ${inv.PeriodEndDate.slice(5)}` : ''}
                  </td>
                  <td>{fmt(inv.TotalAmountBilled)}</td>
                  <td className={Number(inv.AmountDue) > 0 ? 'discrepancy' : ''}>
                    {fmt(inv.AmountDue)}
                  </td>
                  <td>{paymentBadge(inv.PaymentStatus)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-row">
                  No invoices match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
