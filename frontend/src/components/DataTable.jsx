import { useState, useMemo, useEffect, useRef } from 'react';

const PAGE_SIZE = 10;

export default function DataTable({
  columns, data, onRowAction, onRowClick,
  selectable, rowKey, selectedKeys = new Set(), onSelectionChange,
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const selectAllRef = useRef(null);

  useEffect(() => setPage(1), [data]);

  const sorted = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const cmp = String(a[sortCol] ?? '').localeCompare(String(b[sortCol] ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
      .reduce((acc, p, idx, arr) => {
        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
        acc.push(p);
        return acc;
      }, []);
  }, [totalPages, page]);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  }

  // Selection helpers
  const pageKeys = selectable && rowKey ? pageData.map(row => String(row[rowKey])) : [];
  const allPageSelected = pageKeys.length > 0 && pageKeys.every(k => selectedKeys.has(k));
  const somePageSelected = pageKeys.some(k => selectedKeys.has(k)) && !allPageSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = somePageSelected;
  }, [somePageSelected]);

  function toggleAll() {
    const next = new Set(selectedKeys);
    if (allPageSelected) pageKeys.forEach(k => next.delete(k));
    else pageKeys.forEach(k => next.add(k));
    onSelectionChange?.(next);
  }

  function toggleRow(key) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange?.(next);
  }

  const colCount = columns.length + (selectable ? 1 : 0) + (onRowAction ? 1 : 0);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: 40, cursor: 'default' }}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAll}
                  aria-label="Select all rows on this page"
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                className={sortCol === col.key ? 'sorted' : ''}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={col.sortable === false ? { cursor: 'default' } : {}}
              >
                {col.label}
                {col.sortable !== false && (
                  <span className="sort-icon">{sortCol === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}</span>
                )}
              </th>
            ))}
            {onRowAction && <th style={{ cursor: 'default' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={colCount} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No records found
              </td>
            </tr>
          ) : pageData.map((row, i) => {
            const key = rowKey ? String(row[rowKey]) : String(i);
            const isSelected = selectable && selectedKeys.has(key);
            return (
              <tr
                key={i}
                className={isSelected ? 'row-selected' : ''}
                onClick={() => onRowClick?.(row)}
                style={onRowClick ? { cursor: 'pointer' } : {}}
              >
                {selectable && (
                  <td onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(key)}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} title={typeof row[col.key] === 'string' ? row[col.key] : undefined}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
                {onRowAction && (
                  <td>
                    <div className="action-btns">
                      <button className="action-btn" onClick={e => { e.stopPropagation(); onRowAction('view', row); }}>View</button>
                      <button className="action-btn" onClick={e => { e.stopPropagation(); onRowAction('edit', row); }}>Edit</button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination-bar">
        <span>
          Showing {pageData.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} entries
          {selectable && selectedKeys.size > 0 && (
            <span style={{ marginLeft: 12, color: 'var(--blue)', fontWeight: 600 }}>{selectedKeys.size} selected</span>
          )}
        </span>
        <div className="pagination-pages">
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          {pageNumbers.map((p, i) =>
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
