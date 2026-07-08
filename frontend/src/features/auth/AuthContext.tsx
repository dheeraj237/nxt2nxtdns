import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, ApiError } from '../../lib/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Sessions use an httpOnly cookie set by the backend, so there's no client-readable
// session state to restore on refresh. We optimistically show the login form and let
// the first authenticated API call fail with 401 if the cookie is actually still valid
// (ApiClient callers should redirect to login on 401 - handled in App.tsx).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('nxtdns_authed') === '1',
  );
  const [error, setError] = useState<string | null>(null);

  async function login(password: string) {
    setError(null);
    try {
      await api.login(password);
      sessionStorage.setItem('nxtdns_authed', '1');
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
      throw err;
    }
  }

  async function logout() {
    await api.logout();
    sessionStorage.removeItem('nxtdns_authed');
    setIsAuthenticated(false);
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout, error }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
