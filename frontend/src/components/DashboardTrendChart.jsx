import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TIME_FILTERS = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];
const VENDOR_FILTERS = ['All Vendors', 'Transport', 'IT', 'Catering'];
const VIEW_TOGGLES = ['Issues', 'Invoices', 'Combined'];

// Deterministic pseudo-random from seed
function seededVal(seed, min, max) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return Math.round(min + (x - Math.floor(x)) * (max - min));
}

function generateData(timeFilter, vendorFilter) {
  const base = new Date('2026-04-10');
  const scale = { 'All Vendors': 1, Transport: 0.38, IT: 0.32, Catering: 0.30 };
  const vm = scale[vendorFilter] ?? 1;

  let count;
  let labelFn;

  if (timeFilter === 'Weekly') {
    count = 8;
    labelFn = (i) => {
      const d = new Date(base);
      d.setDate(d.getDate() - i * 7);
      return `${String(d.getDate()).padStart(2, '0')}/${d.getMonth() + 1}`;
    };
  } else if (timeFilter === 'Monthly') {
    count = 12;
    labelFn = (i) => {
      const d = new Date(base);
      d.setMonth(d.getMonth() - i);
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    };
  } else if (timeFilter === 'Quarterly') {
    count = 8;
    labelFn = (i) => {
      const d = new Date(base);
      d.setMonth(d.getMonth() - i * 3);
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `Q${q} '${String(d.getFullYear()).slice(2)}`;
    };
  } else {
    count = 5;
    labelFn = (i) => {
      const d = new Date(base);
      d.setFullYear(d.getFullYear() - i);
      return String(d.getFullYear());
    };
  }

  const points = [];
  for (let i = count - 1; i >= 0; i--) {
    const s = i * 17 + vendorFilter.length * 5 + timeFilter.length * 3;
    points.push({
      label: labelFn(i),
      openIssues: Math.max(1, Math.round(seededVal(s + 1, 3, 18) * vm)),
      resolvedIssues: Math.max(1, Math.round(seededVal(s + 2, 6, 26) * vm)),
      overdueInvoices: Math.max(0, Math.round(seededVal(s + 3, 1, 9) * vm)),
      paidInvoices: Math.max(1, Math.round(seededVal(s + 4, 4, 15) * vm)),
    });
  }
  return points;
}

const SERIES = {
  openIssues:      { name: 'Open Issues',       stroke: '#dc2626', dash: '' },
  resolvedIssues:  { name: 'Resolved Issues',   stroke: '#16a34a', dash: '' },
  overdueInvoices: { name: 'Overdue Invoices',  stroke: '#d97706', dash: '5 3' },
  paidInvoices:    { name: 'Paid Invoices',     stroke: '#1a73e8', dash: '5 3' },
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <span className="chart-tooltip-val">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardTrendChart() {
  const [timeFilter, setTimeFilter] = useState('Monthly');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [view, setView] = useState('Combined');

  const data = useMemo(() => generateData(timeFilter, vendorFilter), [timeFilter, vendorFilter]);

  const showIssues  = view === 'Issues'  || view === 'Combined';
  const showInvoices = view === 'Invoices' || view === 'Combined';

  return (
    <div className="card chart-card">
      <div className="chart-header">
        <div className="chart-title-block">
          <div className="chart-title">Trend Overview</div>
          <div className="chart-subtitle">Issues and invoice activity over time</div>
        </div>
        <div className="chart-controls">
          <div className="tabs chart-tabs">
            {VIEW_TOGGLES.map(v => (
              <button
                key={v}
                className={`tab-btn${view === v ? ' active' : ''}`}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <select
            className="filter-select"
            value={vendorFilter}
            onChange={e => setVendorFilter(e.target.value)}
            aria-label="Vendor filter"
          >
            {VENDOR_FILTERS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            className="filter-select"
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value)}
            aria-label="Time filter"
          >
            {TIME_FILTERS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={290}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e4ef" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11.5, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11.5, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 18, color: '#6b7280' }}
            iconType="plainline"
          />
          {showIssues && (
            <>
              <Line
                type="monotone"
                dataKey="openIssues"
                name={SERIES.openIssues.name}
                stroke={SERIES.openIssues.stroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="resolvedIssues"
                name={SERIES.resolvedIssues.name}
                stroke={SERIES.resolvedIssues.stroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </>
          )}
          {showInvoices && (
            <>
              <Line
                type="monotone"
                dataKey="overdueInvoices"
                name={SERIES.overdueInvoices.name}
                stroke={SERIES.overdueInvoices.stroke}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="paidInvoices"
                name={SERIES.paidInvoices.name}
                stroke={SERIES.paidInvoices.stroke}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
