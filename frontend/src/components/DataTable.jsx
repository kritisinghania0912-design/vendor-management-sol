import { useState, useMemo } from 'react';

const PAGE_SIZE = 10;

export default function DataTable({ columns, data, onRowAction }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  // Reset page when data changes
  useMemo(() => setPage(1), [data]);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={sortCol === col.key ? 'sorted' : ''}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={col.sortable === false ? { cursor: 'default' } : {}}
              >
                {col.label}
                {col.sortable !== false && (
                  <span className="sort-icon">
                    {sortCol === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                  </span>
                )}
              </th>
            ))}
            {onRowAction && <th style={{ cursor: 'default' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onRowAction ? 1 : 0)} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No records found
              </td>
            </tr>
          ) : (
            pageData.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} title={row[col.key]}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
                {onRowAction && (
                  <td>
                    <div className="action-btns">
                      <button className="action-btn" onClick={() => onRowAction('view', row)}>View</button>
                      <button className="action-btn" onClick={() => onRowAction('edit', row)}>Edit</button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="pagination-bar">
        <span>
          Showing {pageData.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} entries
        </span>
        <div className="pagination-pages">
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '…'
                ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
                : <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            )}
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
        </div>
      </div>
    </div>
  );
}
