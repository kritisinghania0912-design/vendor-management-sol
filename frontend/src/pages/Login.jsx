import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@vendorsecure.com', password: 'Admin@123', icon: '🛡️', desc: 'Full system access — all vendors, finance, governance' },
  { label: 'Transport Vendor', email: 'ops@swiftcabs.com', password: 'Swift@123', icon: '🚕', desc: 'SwiftCabs Pvt Ltd — submit trips, manage fleet' },
  { label: 'Food Vendor', email: 'ops@greenleaf.com', password: 'Green@123', icon: '🥗', desc: 'GreenLeaf Catering — log daily service, view compliance' },
  { label: 'IT Vendor', email: 'helpdesk@techcore.com', password: 'Tech@123', icon: '💻', desc: 'TechCore Systems — manage assets, track licenses' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError('Please enter your email and password.');
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(acc) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">V</div>
          <span className="login-brand-name">VendorSecure</span>
        </div>
        <div className="login-hero">
          <h1 className="login-tagline">Vendor Governance,<br />Automated.</h1>
          <p className="login-sub">Unified compliance, financial reconciliation, and performance management for your entire vendor ecosystem.</p>
        </div>
        <div className="login-features">
          {['Compliance Watchdog — real-time expiry alerts', 'Shadow Invoicing — automated billing reconciliation', 'Three-Way Match — contract · logs · invoice', 'Vendor Benchmarking — performance-driven renewals'].map(f => (
            <div key={f} className="login-feature">
              <span className="login-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Sign in to your account</h2>
            <p className="login-card-sub">Use your credentials or pick a demo account below.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                type="email"
                className={`form-input${error ? ' input-error' : ''}`}
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <span className="login-show-pw" onClick={() => setShowPassword(s => !s)}>{showPassword ? 'Hide' : 'Show'}</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input${error ? ' input-error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-primary login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="login-divider"><span>Quick demo access</span></div>

          <div className="login-demo-grid">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.email} className="login-demo-card" onClick={() => fillDemo(acc)} type="button">
                <span className="demo-icon">{acc.icon}</span>
                <div>
                  <div className="demo-label">{acc.label}</div>
                  <div className="demo-desc">{acc.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <p className="login-footer-note">
            This is a demo environment. No real vendor data is stored.
          </p>
        </div>
      </div>
    </div>
  );
}
