import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('vs_user')) || null; }
    catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Login failed');
    }
    const { user: u } = await res.json();
    sessionStorage.setItem('vs_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('vs_user');
    setUser(null);
  }, []);

  // Build query param for vendor-scoped API calls
  const vendorParam = user?.vendorId ? `?vendorId=${user.vendorId}` : '';

  return (
    <AuthContext.Provider value={{ user, login, logout, vendorParam, isAdmin: user?.role === 'admin', isVendor: user?.role === 'vendor' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
