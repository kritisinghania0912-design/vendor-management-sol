export default function Header({ notifCount = 0 }) {
  return (
    <header className="header">
      <span className="header-greeting">Hi Kriti!</span>
      <div className="header-actions">
        <button className="icon-btn" title="Notifications">
          🔔
          {notifCount > 0 && <span className="notif-dot" />}
        </button>
        <button className="icon-btn" title="Profile">
          👤
        </button>
      </div>
    </header>
  );
}
