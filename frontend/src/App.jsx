import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Pulse from './pages/Pulse';
import Registry from './pages/Registry';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Header notifCount={3} />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/pulse" element={<Pulse />} />
              <Route path="/registry" element={<Registry />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
