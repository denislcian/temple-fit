// CAPA 1 · Datos — Autenticación sobre Supabase Auth (email + contraseña).
// Mismo contrato AuthService que la versión local. El hash de contraseña y la
// confirmación por email los hace el servidor; el cliente solo lleva el JWT.
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeUsername,
  validateBirthdate,
  validateDisplayName,
  validateHeightCm,
  validatePassword,
  validateUsername,
  validateWeightKg,
  type Account,
} from '../authModels';
import type { AuthService, RegisterInput } from './authRepo';

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  private_profile: boolean;
  created_at: string;
  avatar_url: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
}

const PROFILE_COLS =
  'id, username, display_name, bio, private_profile, created_at, avatar_url, location, lat, lng';

/** Datos físicos guardados en el metadata privado del usuario (solo el dueño los
 *  ve, vía auth.getUser). No van a la tabla pública profiles por privacidad. */
function physicalFromMeta(meta: Record<string, unknown> | undefined): Partial<Account> {
  if (!meta) return {};
  const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const out: Partial<Account> = {};
  if (typeof meta.birthdate === 'string' && meta.birthdate) out.birthdate = meta.birthdate;
  if (meta.sex === 'mujer' || meta.sex === 'hombre' || meta.sex === 'otro') out.sex = meta.sex;
  const h = num(meta.height_cm);
  if (h !== undefined) out.heightCm = h;
  const w = num(meta.weight_kg);
  if (w !== undefined) out.weightKg = w;
  if (meta.goal === 'perder' || meta.goal === 'ganar' || meta.goal === 'mantener') out.goal = meta.goal;
  return out;
}

/** URL base de la app (sin hash) a la que Supabase debe devolver tras OAuth o
 *  confirmar el email. En GitHub Pages incluye la subruta (/temple-fit/); en
 *  local es http://localhost:3000/. */
function appReturnUrl(): string {
  return window.location.origin + window.location.pathname;
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
    ...(p.avatar_url ? { avatarUrl: p.avatar_url } : {}),
    ...(p.location ? { location: p.location } : {}),
    ...(p.lat != null ? { lat: p.lat } : {}),
    ...(p.lng != null ? { lng: p.lng } : {}),
  };
}

export class SupabaseAuthService implements AuthService {
  constructor(private sb: SupabaseClient) {}

  async register(input: RegisterInput): Promise<Account | null> {
    const username = normalizeUsername(input.username);
    const uErr = validateUsername(username);
    if (uErr) throw new Error(uErr);
    const nErr = validateDisplayName(input.displayName);
    if (nErr) throw new Error(nErr);
    const pErr = validatePassword(input.password);
    if (pErr) throw new Error(pErr);
    if (!input.email || !/.+@.+\..+/.test(input.email)) throw new Error('Escribe un email válido');
    const bErr = validateBirthdate(input.birthdate ?? '');
    if (bErr) throw new Error(bErr);
    const hErr = validateHeightCm(input.heightCm);
    if (hErr) throw new Error(hErr);
    const wErr = validateWeightKg(input.weightKg);
    if (wErr) throw new Error(wErr);

    // Los datos físicos viajan como metadata; el trigger handle_new_user los
    // copia al perfil (ver supabase/migration-perfil-fisico.sql).
    const { data, error } = await this.sb.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          username,
          display_name: input.displayName.trim(),
          ...(input.birthdate ? { birthdate: input.birthdate } : {}),
          ...(input.sex ? { sex: input.sex } : {}),
          ...(input.heightCm !== undefined ? { height_cm: input.heightCm } : {}),
          ...(input.weightKg !== undefined ? { weight_kg: input.weightKg } : {}),
          ...(input.goal ? { goal: input.goal } : {}),
        },
        emailRedirectTo: appReturnUrl(),
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

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: appReturnUrl() },
    });
    if (error) throw new Error('No se pudo iniciar sesión con Google');
  }

  logout(): void {
    void this.sb.auth.signOut();
  }

  async currentAccountId(): Promise<string | null> {
    const { data } = await this.sb.auth.getUser();
    return data.user?.id ?? null;
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [{ data }, { data: userData }] = await Promise.all([
      this.sb.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle(),
      this.sb.auth.getUser(),
    ]);
    if (!data) return undefined;
    const account = toAccount(data as ProfileRow);
    // Datos físicos: solo se ven para tu propia cuenta (metadata privado).
    if (userData.user?.id === id) {
      Object.assign(account, physicalFromMeta(userData.user.user_metadata));
    }
    return account;
  }

  async updateProfile(
    id: string,
    changes: Partial<
      Pick<Account, 'displayName' | 'bio' | 'privateProfile' | 'avatarUrl' | 'location' | 'lat' | 'lng'>
    >,
  ): Promise<void> {
    if (changes.displayName !== undefined) {
      const err = validateDisplayName(changes.displayName);
      if (err) throw new Error(err);
    }
    const row: Record<string, unknown> = {};
    if (changes.displayName !== undefined) row.display_name = changes.displayName.trim();
    if (changes.bio !== undefined) row.bio = changes.bio;
    if (changes.privateProfile !== undefined) row.private_profile = changes.privateProfile;
    if (changes.avatarUrl !== undefined) row.avatar_url = changes.avatarUrl;
    if (changes.location !== undefined) row.location = changes.location || null;
    if (changes.lat !== undefined) row.lat = changes.lat ?? null;
    if (changes.lng !== undefined) row.lng = changes.lng ?? null;
    const { error } = await this.sb.from('profiles').update(row).eq('id', id);
    if (error) throw new Error('No se pudo guardar el perfil');
  }

  async uploadAvatar(id: string, dataUrl: string): Promise<string> {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${id}/avatar-${Date.now()}.jpg`;
    const { error } = await this.sb.storage
      .from('fotos')
      .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    if (error) throw new Error('No se pudo subir la foto');
    const url = this.sb.storage.from('fotos').getPublicUrl(path).data.publicUrl;
    await this.updateProfile(id, { avatarUrl: url });
    return url;
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
