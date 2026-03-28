import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ notifCount = 0 }) {
  const { user, logout } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.avatarInitials || (user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) || 'U';
  const roleBadgeClass = user?.role === 'admin' ? 'role-badge role-admin' : 'role-badge role-vendor';
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.vendorCategory || 'Vendor';

  return (
    <header className="header">
      <div className="header-left">
        {user?.role === 'vendor' && user?.vendorName && (
          <div className="header-vendor-context">
            <span className="vendor-context-label">Viewing as</span>
            <span className="vendor-context-name">{user.vendorName}</span>
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Notification bell */}
        <button className="icon-btn" title="Notifications">
          <span>🔔</span>
          {notifCount > 0 && <span className="notif-dot" />}
        </button>

        {/* Profile menu */}
        <div className="profile-menu-wrap" ref={dropRef}>
          <button className="profile-trigger" onClick={() => setDropOpen(o => !o)}>
            <div className="avatar">{initials}</div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className={roleBadgeClass}>{roleLabel}</span>
            </div>
            <span className={`profile-caret${dropOpen ? ' open' : ''}`}>▾</span>
          </button>

          {dropOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="avatar avatar-lg">{initials}</div>
                <div>
                  <div className="dropdown-name">{user?.name}</div>
                  <div className="dropdown-email">{user?.email}</div>
                  <span className={roleBadgeClass} style={{ marginTop: 4, display: 'inline-block' }}>{roleLabel}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => setDropOpen(false)}>
                <span>👤</span> Profile Settings
              </button>
              <button className="dropdown-item" onClick={() => setDropOpen(false)}>
                <span>🔒</span> Change Password
              </button>
              <button className="dropdown-item" onClick={() => setDropOpen(false)}>
                <span>🔔</span> Notification Preferences
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={logout}>
                <span>↩</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
