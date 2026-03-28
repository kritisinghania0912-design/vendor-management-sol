import { useState, useEffect } from 'react';
import { api } from '../api';

function riskBadge(level) {
  const map = { High: 'badge badge-red', Medium: 'badge badge-amber', Low: 'badge badge-green' };
  return <span className={map[level] || 'badge badge-gray'}>{level}</span>;
}

function statusBadge(status) {
  const map = { Open: 'badge badge-red', 'In-Progress': 'badge badge-amber', Resolved: 'badge badge-green' };
  return <span className={map[status] || 'badge badge-gray'}>{status}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (!data) return <div className="loading">Failed to load data.</div>;

  const amountDueFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.totalAmountDue);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Vendor Management Overview</div>
        </div>
      </div>

      <div className="cards-row">
        <div className="card">
          <div className="card-label">Total Vendors</div>
          <div className="card-value">{data.totalVendors}</div>
          <div className="card-footer">Transport, Food, IT</div>
        </div>
        <div className="card">
          <div className="card-label">Open Issues</div>
          <div className="card-value red">{data.openIssues}</div>
          <div className="card-footer">{data.highRiskIssues} high risk</div>
        </div>
        <div className="card">
          <div className="card-label">Pending Invoices</div>
          <div className="card-value amber">{data.pendingInvoices}</div>
          <div className="card-footer">{amountDueFormatted} due</div>
        </div>
        <div className="card">
          <div className="card-label">Vendor Categories</div>
          <div className="card-value green">{Object.keys(data.vendorsByCategory).length}</div>
          <div className="card-footer">Active categories</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="section-header">Recent Issues</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentIssues.map(issue => (
                  <tr key={issue.TicketID}>
                    <td>{issue.TicketID}</td>
                    <td>{issue.VendorID}</td>
                    <td>{issue.Category}</td>
                    <td>{riskBadge(issue.RiskLevel)}</td>
                    <td>{statusBadge(issue.Status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="section-header">Vendor Breakdown</div>
          <div className="card" style={{ padding: '16px' }}>
            {Object.entries(data.vendorsByCategory).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat === 'Transport' ? '🚕' : cat === 'Food' ? '🥗' : '💻'}</span>
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ height: 6, width: count * 30, background: 'var(--blue)', borderRadius: 3 }} />
                  <span style={{ fontWeight: 700, width: 24, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="section-header">Recent Trips</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trip ID</th>
                    <th>Driver</th>
                    <th>Date</th>
                    <th>Distance (KM)</th>
                    <th>Incident</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTrips.map(trip => (
                    <tr key={trip.TripID}>
                      <td>{trip.TripID}</td>
                      <td>{trip.DriverID}</td>
                      <td>{trip.TripDate}</td>
                      <td>{trip.DistanceDriven_KM}</td>
                      <td>
                        {trip.IncidentReported === 'true'
                          ? <span className="badge badge-red">Yes</span>
                          : <span className="badge badge-green">No</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
