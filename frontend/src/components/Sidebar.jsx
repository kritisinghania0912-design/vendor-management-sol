import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_NAV = [
  { to: '/',         label: 'Dashboard', icon: '▦' },
  { to: '/issues',   label: 'Issues',    icon: '⚠' },
  { to: '/pulse',    label: 'Pulse',     icon: '◉' },
  { to: '/registry', label: 'Registry',  icon: '☰' },
];

const VENDOR_NAV = [
  { to: '/',         label: 'My Dashboard', icon: '▦' },
  { to: '/issues',   label: 'My Issues',    icon: '⚠' },
  { to: '/pulse',    label: 'Submit Data',  icon: '◉' },
  { to: '/registry', label: 'My Assets',    icon: '☰' },
];

export default function Sidebar() {
  const { user, isVendor } = useAuth();
  const NAV = isVendor ? VENDOR_NAV : ADMIN_NAV;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">V</div>
        VendorSecure
      </div>

      {isVendor && user?.vendorCategory && (
        <div className="sidebar-vendor-chip">
          <span>{user.vendorCategory === 'Transport' ? '🚕' : user.vendorCategory === 'Food' ? '🥗' : '💻'}</span>
          <span>{user.vendorCategory}</span>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-label">VendorSecure v1.0</div>
        <div className="sidebar-footer-env">Demo Environment</div>
      </div>
    </aside>
  );
}
