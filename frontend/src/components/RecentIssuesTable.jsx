import { useState, useMemo } from 'react';
import { riskBadge, statusBadge } from '../utils/badges';

const CATEGORIES = ['All', 'Transport', 'IT', 'Food', 'Catering'];
const RISK_LEVELS = ['All', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Open', 'In-Progress', 'Resolved'];

const RISK_ORDER = { High: 0, Medium: 1, Low: 2 };
const STATUS_ORDER = { Open: 0, 'In-Progress': 1, Resolved: 2 };

function compareValues(a, b, key, dir) {
  let av = a[key] ?? '';
  let bv = b[key] ?? '';

  if (key === 'RiskLevel') {
    av = RISK_ORDER[av] ?? 99;
    bv = RISK_ORDER[bv] ?? 99;
    return dir === 'asc' ? av - bv : bv - av;
  }
  if (key === 'Status') {
    av = STATUS_ORDER[av] ?? 99;
    bv = STATUS_ORDER[bv] ?? 99;
    return dir === 'asc' ? av - bv : bv - av;
  }
  return dir === 'asc'
    ? String(av).localeCompare(String(bv))
    : String(bv).localeCompare(String(av));
}

export default function RecentIssuesTable({ issues = [] }) {
  const [sortKey, setSortKey] = useState('TicketID');
  const [sortDir, setSortDir] = useState('asc');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    let rows = [...issues];
    if (filterCategory !== 'All') rows = rows.filter(r => r.Category === filterCategory);
    if (filterRisk !== 'All') rows = rows.filter(r => r.RiskLevel === filterRisk);
    if (filterStatus !== 'All') rows = rows.filter(r => r.Status === filterStatus);
    rows.sort((a, b) => compareValues(a, b, sortKey, sortDir));
    return rows;
  }, [issues, filterCategory, filterRisk, filterStatus, sortKey, sortDir]);

  function SortTh({ label, field, style }) {
    const active = sortKey === field;
    return (
      <th
        className={active ? 'sorted' : ''}
        onClick={() => handleSort(field)}
        style={style}
      >
        {label}
        <span className="sort-icon">{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>
      </th>
    );
  }

  return (
    <div className="table-section">
      <div className="section-header">Recent Issues</div>

      <div className="table-toolbar">
        <select
          className="filter-select"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          aria-label="Filter by category"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          aria-label="Filter by risk"
        >
          {RISK_LEVELS.map(r => (
            <option key={r} value={r}>{r === 'All' ? 'All Risk' : r}</option>
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
        <span className="result-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortTh label="ID" field="TicketID" />
              <SortTh label="Vendor" field="VendorID" />
              <SortTh label="Category" field="Category" />
              <SortTh label="Risk" field="RiskLevel" />
              <SortTh label="Status" field="Status" />
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map(issue => (
                <tr
                  key={issue.TicketID}
                  className="clickable-row"
                  tabIndex={0}
                  role="row"
                >
                  <td><span className="mono-id">{issue.TicketID}</span></td>
                  <td>{issue.VendorID}</td>
                  <td>{issue.Category}</td>
                  <td>{riskBadge(issue.RiskLevel)}</td>
                  <td>{statusBadge(issue.Status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-row">
                  No issues match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
