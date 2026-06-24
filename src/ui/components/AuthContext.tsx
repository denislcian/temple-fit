// CAPA 3 · Interfaz — Contexto de sesión.
// Expone la cuenta actual y las acciones de auth a toda la app. Usa authService,
// que es local o Supabase según haya credenciales (la UI no cambia).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Account } from '../../data/authModels';
import { authService } from '../../data/repositories/authRepo';

interface RegisterInput {
  email?: string;
  username: string;
  displayName: string;
  password: string;
}

interface AuthContextValue {
  account: Account | null;
  loading: boolean;
  /** needsConfirmation = el registro requiere confirmar el email antes de entrar. */
  register: (input: RegisterInput) => Promise<{ needsConfirmation: boolean }>;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  /** Disponible solo si el servicio de auth lo soporta (Supabase). */
  signInWithGoogle?: () => Promise<void>;
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
    const id = await authService.currentAccountId();
    setAccount(id ? ((await authService.getAccount(id)) ?? null) : null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // En la nube, reacciona a login/logout/confirmación de email.
    const unsub = authService.onAuthChange?.(() => {
      void refresh();
    });
    return unsub;
  }, [refresh]);

  const register = useCallback(async (input: RegisterInput) => {
    const acc = await authService.register(input);
    if (acc) {
      setAccount(acc);
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    const acc = await authService.login(emailOrUsername, password);
    setAccount(acc);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAccount(null);
  }, []);

  const signInWithGoogle = authService.signInWithGoogle
    ? () => authService.signInWithGoogle!()
    : undefined;

  return (
    <AuthContext.Provider
      value={{ account, loading, register, login, logout, refresh, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}
