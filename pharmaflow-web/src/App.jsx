import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from './services/api';
import Login from './pages/Login';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Compliance from './pages/Compliance';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import Purchase from './pages/Purchase';
import Delivery from './pages/Delivery';
import StoresDashboard from './pages/StoresDashboard';
import AuditLog from './pages/AuditLog';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pf_token');
    if (token) {
      auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => { localStorage.removeItem('pf_token'); setLoading(false); });
    } else { setLoading(false); }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('pf_token', token);
    localStorage.setItem('pf_store_id', userData.storeId);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('pf_token');
    localStorage.removeItem('pf_store_id');
    setUser(null);
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, handleLogout }}>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="flex h-screen">
          <Sidebar user={user} />
          <div className="flex-1 overflow-auto">
            <TopBar user={user} onLogout={handleLogout} />
            <div className="p-4">
              <Routes>
                <Route path="/" element={<Navigate to="/pos" />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/purchase" element={<Purchase />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/stores" element={<StoresDashboard />} />
                <Route path="/audit" element={<AuditLog />} />
                <Route path="*" element={<Navigate to="/pos" />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

const NAV = [
  { path: '/pos', label: 'POS Billing', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', roles: null },
  { path: '/inventory', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: null },
  { path: '/compliance', label: 'Compliance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', roles: ['SUPER_ADMIN','STORE_MANAGER','PHARMACIST'] },
  { path: '/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', roles: ['SUPER_ADMIN','STORE_MANAGER','PHARMACIST'] },
  { path: '/customers', label: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', roles: null },
  { path: '/purchase', label: 'Purchase', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z', roles: ['SUPER_ADMIN','STORE_MANAGER','WAREHOUSE_MGR'] },
  { path: '/delivery', label: 'Delivery', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', roles: null },
  { path: '/stores', label: 'Stores', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', roles: ['SUPER_ADMIN'] },
  { path: '/audit', label: 'Audit Log', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['SUPER_ADMIN','STORE_MANAGER'] },
];

function Sidebar({ user }) {
  const loc = useLocation();
  const filtered = NAV.filter(n => !n.roles || n.roles.includes(user.role));
  return (
    <div className="w-56 bg-indigo-900 text-white flex flex-col no-print">
      <div className="p-4 border-b border-indigo-700">
        <h1 className="text-xl font-bold">PharmaFlow</h1>
        <p className="text-indigo-300 text-xs mt-1">{user.storeName || 'HQ'}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {filtered.map(n => (
          <Link key={n.path} to={n.path}
            className={`flex items-center px-4 py-2.5 text-sm transition-colors ${loc.pathname === n.path ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={n.icon} /></svg>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function TopBar({ user, onLogout }) {
  return (
    <div className="bg-white shadow px-4 py-2 flex items-center justify-between no-print">
      <div className="text-sm text-gray-500">
        {user.storeCode} | {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm"><span className="font-medium">{user.fullName}</span> <span className="text-gray-400">({user.role})</span></span>
        <button onClick={onLogout} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Logout</button>
      </div>
    </div>
  );
}

export default App;
