import { useState, useEffect } from 'react';
import { makeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { riskBadge, statusBadge, paymentBadge } from '../utils/badges';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { vendorParam, isVendor, user } = useAuth();
  const [data, setData] = useState(null);
  const [finance, setFinance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = makeApi(vendorParam);
    setLoading(true);
    Promise.all([api.getDashboard(), api.getFinance()])
      .then(([d, f]) => { setData(d); setFinance(f); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vendorParam]);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (!data) return <div className="loading">Failed to load data.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isVendor ? `${user.vendorName} — Overview` : 'Admin Dashboard'}</div>
          <div className="page-subtitle">{isVendor ? `${user.vendorCategory} Vendor · ${user.vendorId}` : 'Vendor Management Command Center'}</div>
        </div>
      </div>

      <div className="cards-row">
        {isVendor ? (
          <>
            <div className="card">
              <div className="card-label">Open Issues</div>
              <div className={`card-value${data.openIssues > 0 ? ' red' : ' green'}`}>{data.openIssues}</div>
              <div className="card-footer">{data.highRiskIssues} high risk</div>
            </div>
            <div className="card">
              <div className="card-label">Pending Invoices</div>
              <div className={`card-value${data.pendingInvoices > 0 ? ' amber' : ' green'}`}>{data.pendingInvoices}</div>
              <div className="card-footer">{fmt(data.totalAmountDue)} outstanding</div>
            </div>
            <div className="card">
              <div className="card-label">Recent Activity</div>
              <div className="card-value">{data.recentTrips?.length ?? 0}</div>
              <div className="card-footer">Last 5 records</div>
            </div>
            <div className="card">
              <div className="card-label">Compliance Score</div>
              <div className={`card-value${data.highRiskIssues > 2 ? ' red' : data.openIssues > 0 ? ' amber' : ' green'}`}>
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
              <div className="card-footer">{Object.entries(data.vendorsByCategory || {}).map(([k, v]) => `${v} ${k}`).join(', ')}</div>
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
              <div className="card-value green">{Object.keys(data.vendorsByCategory || {}).length}</div>
              <div className="card-footer">Active categories</div>
            </div>
          </>
        )}
      </div>

      <div className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="section-header">Recent Issues</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Vendor</th><th>Category</th><th>Risk</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.recentIssues?.length > 0 ? data.recentIssues.map(issue => (
                    <tr key={issue.TicketID}>
                      <td>{issue.TicketID}</td>
                      <td>{issue.VendorID}</td>
                      <td>{issue.Category}</td>
                      <td>{riskBadge(issue.RiskLevel)}</td>
                      <td>{statusBadge(issue.Status)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No open issues</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {data.recentTrips?.length > 0 && (
            <div>
              <div className="section-header">Recent Trip Logs</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Trip ID</th><th>Driver</th><th>Date</th><th>KM</th><th>Incident</th></tr>
                  </thead>
                  <tbody>
                    {data.recentTrips.map(trip => (
                      <tr key={trip.TripID}>
                        <td>{trip.TripID}</td>
                        <td>{trip.DriverID}</td>
                        <td>{trip.TripDate}</td>
                        <td>{trip.DistanceDriven_KM}</td>
                        <td>{trip.IncidentReported === 'true' ? <span className="badge badge-red">Yes</span> : <span className="badge badge-green">No</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!isVendor && (
            <div>
              <div className="section-header">Vendor Breakdown</div>
              <div className="card" style={{ padding: '16px' }}>
                {Object.entries(data.vendorsByCategory || {}).map(([cat, count]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{cat === 'Transport' ? '🚕' : cat === 'Food' ? '🥗' : '💻'}</span>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ height: 6, width: count * 40, background: 'var(--blue)', borderRadius: 3 }} />
                      <span style={{ fontWeight: 700, width: 24, textAlign: 'right' }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="section-header">{isVendor ? 'My Invoices' : 'Invoice Status'}</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Invoice</th><th>Period</th><th>Billed (₹)</th><th>Due (₹)</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {finance.slice(0, 5).map(inv => (
                    <tr key={inv.InvoiceID}>
                      <td>{inv.InvoiceID}</td>
                      <td style={{ fontSize: 12 }}>{inv.PeriodStartDate} → {inv.PeriodEndDate?.slice(5)}</td>
                      <td>{Number(inv.TotalAmountBilled).toLocaleString('en-IN')}</td>
                      <td className={Number(inv.AmountDue) > 0 ? 'discrepancy' : ''}>{Number(inv.AmountDue).toLocaleString('en-IN')}</td>
                      <td>{paymentBadge(inv.PaymentStatus)}</td>
                    </tr>
                  ))}
                  {finance.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No invoices found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
