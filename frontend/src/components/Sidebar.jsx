import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/issues', label: 'Issues', icon: '⚠' },
  { to: '/pulse', label: 'Pulse', icon: '◉' },
  { to: '/registry', label: 'Registry', icon: '☰' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">V</div>
        VendorSecure
      </div>
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
    </aside>
  );
}
