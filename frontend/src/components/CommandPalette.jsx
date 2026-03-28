import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeApi } from '../api';

const QUICK_ACTIONS = [
  { type: 'page', label: 'Dashboard',  icon: '▦', path: '/' },
  { type: 'page', label: 'Vendors',    icon: '🏢', path: '/vendors' },
  { type: 'page', label: 'Issues',     icon: '⚠',  path: '/issues' },
  { type: 'page', label: 'Pulse',      icon: '◉', path: '/pulse' },
  { type: 'page', label: 'Registry',   icon: '☰', path: '/registry' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [vendors, setVendors] = useState([]);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open) { setQuery(''); setCursor(0); return; }
    inputRef.current?.focus();
    if (vendors.length === 0) {
      makeApi('').getVendors().then(setVendors).catch(() => {});
    }
  }, [open]);

  const results = query.trim()
    ? [
        ...QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase())),
        ...vendors
          .filter(v =>
            v.CompanyName?.toLowerCase().includes(query.toLowerCase()) ||
            v.VendorID?.toLowerCase().includes(query.toLowerCase()) ||
            v.VendorCategory?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 8)
          .map(v => ({ type: 'vendor', label: v.CompanyName, icon: v.VendorCategory === 'Transport' ? '🚕' : v.VendorCategory === 'Food' ? '🥗' : '💻', meta: `${v.VendorID} · ${v.VendorCategory}`, path: `/vendors?id=${v.VendorID}` })),
      ]
    : QUICK_ACTIONS;

  const select = useCallback((item) => {
    setOpen(false);
    navigate(item.path);
  }, [navigate]);

  useEffect(() => { setCursor(0); }, [query]);

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && results[cursor]) { select(results[cursor]); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  if (!open) return null;

  return (
    <div className="cmdpal-overlay" onClick={() => setOpen(false)}>
      <div className="cmdpal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cmdpal-input-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className="cmdpal-input"
            placeholder="Search pages, vendors…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            aria-label="Search"
            autoComplete="off"
          />
          <span className="cmdpal-esc" aria-label="Press Escape to close">esc</span>
        </div>
        <div className="cmdpal-results" role="listbox">
          {results.length === 0 && (
            <div className="cmdpal-empty">No results for "{query}"</div>
          )}
          {!query && <div className="cmdpal-section-label">Quick navigation</div>}
          {results.map((item, i) => (
            <div
              key={i}
              className={`cmdpal-result${i === cursor ? ' active' : ''}`}
              onClick={() => select(item)}
              onMouseEnter={() => setCursor(i)}
              role="option"
              aria-selected={i === cursor}
            >
              <span className="cmdpal-result-icon" aria-hidden="true">{item.icon}</span>
              <div className="cmdpal-result-text">
                <span className="cmdpal-result-label">{item.label}</span>
                {item.meta && <span className="cmdpal-result-meta">{item.meta}</span>}
              </div>
              <span className="cmdpal-result-type">{item.type === 'vendor' ? 'Vendor' : 'Page'}</span>
            </div>
          ))}
        </div>
        <div className="cmdpal-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
