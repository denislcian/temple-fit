// CAPA 3 · Interfaz — Contexto de sesión.
// Expone la cuenta actual y las acciones de auth a toda la app. En modo local
// usa authService (IndexedDB); en la nube sería el mismo contexto con un
// authService de Supabase.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Account } from '../../data/authModels';
import { authService } from '../../data/repositories/authRepo';

interface AuthContextValue {
  account: Account | null;
  loading: boolean;
  register: (input: { username: string; displayName: string; password: string }) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const id = authService.currentAccountId();
    setAccount(id ? ((await authService.getAccount(id)) ?? null) : null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const register = useCallback(async (input: { username: string; displayName: string; password: string }) => {
    const acc = await authService.register(input);
    setAccount(acc);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const acc = await authService.login(username, password);
    setAccount(acc);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAccount(null);
  }, []);

  return (
    <AuthContext.Provider value={{ account, loading, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
