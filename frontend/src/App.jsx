import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CommandPalette from './components/CommandPalette';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Issues from './pages/Issues';
import Pulse from './pages/Pulse';
import Registry from './pages/Registry';

function AppShell() {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <Sidebar />
      <div className="main-area">
        <Header notifCount={3} />
        <main id="main-content" className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {isAdmin && <Route path="/vendors" element={<Vendors />} />}
            <Route path="/issues" element={<Issues />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginGate />} />
            <Route path="/*" element={<ProtectedRoute><AppShell /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

function LoginGate() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}
