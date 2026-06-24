// CAPA 1 · Datos — Autenticación sobre Supabase Auth (email + contraseña).
// Mismo contrato AuthService que la versión local. El hash de contraseña y la
// confirmación por email los hace el servidor; el cliente solo lleva el JWT.
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeUsername,
  validateDisplayName,
  validatePassword,
  validateUsername,
  type Account,
} from '../authModels';
import type { AuthService } from './authRepo';

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  private_profile: boolean;
  created_at: string;
}

function toAccount(p: ProfileRow): Account {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    ...(p.bio ? { bio: p.bio } : {}),
    passwordHash: '',
    passwordSalt: '',
    createdAt: p.created_at,
    privateProfile: p.private_profile,
  };
}

export class SupabaseAuthService implements AuthService {
  constructor(private sb: SupabaseClient) {}

  async register(input: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }): Promise<Account | null> {
    const username = normalizeUsername(input.username);
    const uErr = validateUsername(username);
    if (uErr) throw new Error(uErr);
    const nErr = validateDisplayName(input.displayName);
    if (nErr) throw new Error(nErr);
    const pErr = validatePassword(input.password);
    if (pErr) throw new Error(pErr);
    if (!/.+@.+\..+/.test(input.email)) throw new Error('Escribe un email válido');

    const { data, error } = await this.sb.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { username, display_name: input.displayName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(traducir(error.message));
    // Con confirmación por email ON no hay sesión todavía → null = "revisa tu email".
    if (!data.session || !data.user) return null;
    return (await this.getAccount(data.user.id)) ?? null;
  }

  async login(email: string, password: string): Promise<Account> {
    const { data, error } = await this.sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) throw new Error(traducir(error?.message ?? ''));
    const account = await this.getAccount(data.user.id);
    if (!account) throw new Error('No se encontró tu perfil. Contacta con soporte.');
    return account;
  }

  logout(): void {
    void this.sb.auth.signOut();
  }

  async currentAccountId(): Promise<string | null> {
    const { data } = await this.sb.auth.getUser();
    return data.user?.id ?? null;
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const { data } = await this.sb
      .from('profiles')
      .select('id, username, display_name, bio, private_profile, created_at')
      .eq('id', id)
      .maybeSingle();
    return data ? toAccount(data as ProfileRow) : undefined;
  }

  async updateProfile(
    id: string,
    changes: Partial<Pick<Account, 'displayName' | 'bio' | 'privateProfile'>>,
  ): Promise<void> {
    if (changes.displayName !== undefined) {
      const err = validateDisplayName(changes.displayName);
      if (err) throw new Error(err);
    }
    const row: Record<string, unknown> = {};
    if (changes.displayName !== undefined) row.display_name = changes.displayName.trim();
    if (changes.bio !== undefined) row.bio = changes.bio;
    if (changes.privateProfile !== undefined) row.private_profile = changes.privateProfile;
    const { error } = await this.sb.from('profiles').update(row).eq('id', id);
    if (error) throw new Error('No se pudo guardar el perfil');
  }

  async changePassword(_id: string, current: string, next: string): Promise<void> {
    const pErr = validatePassword(next);
    if (pErr) throw new Error(pErr);
    const { data } = await this.sb.auth.getUser();
    const email = data.user?.email;
    if (!email) throw new Error('Sesión no válida');
    // Reautentica con la contraseña actual antes de cambiarla.
    const reauth = await this.sb.auth.signInWithPassword({ email, password: current });
    if (reauth.error) throw new Error('La contraseña actual no es correcta');
    const { error } = await this.sb.auth.updateUser({ password: next });
    if (error) throw new Error('No se pudo cambiar la contraseña');
  }

  /** RGPD: borra el perfil (cascada → posts, seguidores, likes, comentarios) y
   *  cierra la sesión. El borrado total de auth.users requiere una Edge Function
   *  con service_role (pendiente para producción). */
  async deleteAccount(id: string): Promise<void> {
    await this.sb.from('profiles').delete().eq('id', id);
    this.logout();
  }

  onAuthChange(cb: () => void): () => void {
    const { data } = this.sb.auth.onAuthStateChange(() => cb());
    return () => data.subscription.unsubscribe();
  }
}

/** Mensajes de Supabase Auth → español, sin filtrar si el usuario existe. */
function traducir(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos';
  if (m.includes('email not confirmed')) return 'Confirma tu email antes de entrar (revisa tu correo)';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Ya hay una cuenta con ese email';
  if (m.includes('rate limit')) return 'Demasiados intentos. Prueba de nuevo en unos minutos';
  return msg || 'No se pudo completar la operación';
}
