import { useState, useEffect } from 'react';
import { makeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { CardsSkeleton, TableSkeleton } from '../components/Skeleton';
import DashboardTrendChart from '../components/DashboardTrendChart';
import RecentIssuesTable from '../components/RecentIssuesTable';
import InvoiceStatusTable from '../components/InvoiceStatusTable';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

function DashboardSkeleton() {
  return (
    <div>
      <CardsSkeleton count={4} />
      <div style={{ marginBottom: 24 }}>
        <TableSkeleton cols={1} rows={10} />
      </div>
      <div className="two-col">
        <TableSkeleton cols={5} rows={6} />
        <TableSkeleton cols={6} rows={6} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { vendorParam, isVendor, user } = useAuth();
  const [data, setData] = useState(null);
  const [finance, setFinance] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = makeApi(vendorParam);
    setLoading(true);
    Promise.all([api.getDashboard(), api.getFinance(), api.getIssues()])
      .then(([d, f, i]) => {
        setData(d);
        setFinance(f);
        setIssues(i);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vendorParam]);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <div className="loading">Failed to load data.</div>;

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">
            {isVendor ? `${user.vendorName} — Overview` : 'Admin Dashboard'}
          </div>
          <div className="page-subtitle">
            {isVendor
              ? `${user.vendorCategory} Vendor · ${user.vendorId}`
              : 'Vendor Management Command Center'}
          </div>
        </div>
      </div>

      {/* ── A: KPI row ── */}
      <div className="cards-row">
        {isVendor ? (
          <>
            <div className="card">
              <div className="card-label">Open Issues</div>
              <div className={`card-value${data.openIssues > 0 ? ' red' : ' green'}`}>
                {data.openIssues}
              </div>
              <div className="card-footer">{data.highRiskIssues} high risk</div>
            </div>
            <div className="card">
              <div className="card-label">Pending Invoices</div>
              <div className={`card-value${data.pendingInvoices > 0 ? ' amber' : ' green'}`}>
                {data.pendingInvoices}
              </div>
              <div className="card-footer">{fmt(data.totalAmountDue)} outstanding</div>
            </div>
            <div className="card">
              <div className="card-label">Recent Activity</div>
              <div className="card-value">{data.recentTrips?.length ?? 0}</div>
              <div className="card-footer">Last 5 records</div>
            </div>
            <div className="card">
              <div className="card-label">Compliance Score</div>
              <div
                className={`card-value${
                  data.highRiskIssues > 2
                    ? ' red'
                    : data.openIssues > 0
                    ? ' amber'
                    : ' green'
                }`}
              >
                {data.highRiskIssues > 2 ? 'At Risk' : data.openIssues > 0 ? 'Warning' : 'Good'}
              </div>
              <div className="card-footer">Based on open issues</div>
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <div className="card-label">Total Vendors</div>
              <div className="card-value">{data.totalVendors}</div>
              <div className="card-footer">
                {Object.entries(data.vendorsByCategory || {})
                  .map(([k, v]) => `${v} ${k}`)
                  .join(', ')}
              </div>
            </div>
            <div className="card">
              <div className="card-label">Open Issues</div>
              <div className="card-value red">{data.openIssues}</div>
              <div className="card-footer">{data.highRiskIssues} high risk</div>
            </div>
            <div className="card">
              <div className="card-label">Pending Invoices</div>
              <div className="card-value amber">{data.pendingInvoices}</div>
              <div className="card-footer">{fmt(data.totalAmountDue)} due</div>
            </div>
            <div className="card">
              <div className="card-label">Vendor Categories</div>
              <div className="card-value green">
                {Object.keys(data.vendorsByCategory || {}).length}
              </div>
              <div className="card-footer">Active categories</div>
            </div>
          </>
        )}
      </div>

      {/* ── B: Trend chart (admin only) ── */}
      {!isVendor && (
        <div className="dashboard-chart-wrap">
          <DashboardTrendChart />
        </div>
      )}

      {/* ── C: Two-column tables ── */}
      <div className="two-col">
        <RecentIssuesTable
          issues={isVendor ? (data.recentIssues || []) : issues}
        />
        <InvoiceStatusTable finance={finance} />
      </div>
    </div>
  );
}
