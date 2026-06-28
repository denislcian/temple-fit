// CAPA 1 · Datos — Cuentas y sesión (modo local).
//
// Implementación LOCAL del contrato de autenticación: las cuentas viven en
// IndexedDB de este dispositivo y la "sesión" es el id guardado en
// localStorage. En la versión nube (ver docs/SECURITY.md) este módulo se
// sustituye por Supabase Auth sin tocar la UI: misma interfaz AuthService.
import { hashPassword, verifyPassword } from '../crypto';
import {
  normalizeUsername,
  validateBirthdate,
  validateDisplayName,
  validateHeightCm,
  validatePassword,
  validateUsername,
  validateWeightKg,
  type Account,
  type Goal,
  type PublicAccount,
  type Sex,
} from '../authModels';
import { db } from '../db';
import { newId } from '../models';

const SESSION_KEY = 'forjafit-session';

/** Datos del registro. Email solo en la nube; los físicos son opcionales. */
export interface RegisterInput {
  email?: string;
  username: string;
  displayName: string;
  password: string;
  birthdate?: string;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
  goal?: Goal;
}

/** Construye los campos físicos opcionales validados (compartido local/nube). */
export function buildPhysicalFields(
  input: Pick<RegisterInput, 'birthdate' | 'sex' | 'heightCm' | 'weightKg' | 'goal'>,
): Partial<Pick<Account, 'birthdate' | 'sex' | 'heightCm' | 'weightKg' | 'goal'>> {
  const bErr = validateBirthdate(input.birthdate ?? '');
  if (bErr) throw new Error(bErr);
  const hErr = validateHeightCm(input.heightCm);
  if (hErr) throw new Error(hErr);
  const wErr = validateWeightKg(input.weightKg);
  if (wErr) throw new Error(wErr);
  return {
    ...(input.birthdate ? { birthdate: input.birthdate } : {}),
    ...(input.sex ? { sex: input.sex } : {}),
    ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
    ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
    ...(input.goal ? { goal: input.goal } : {}),
  };
}

export interface AuthService {
  /** Devuelve la cuenta, o null si el registro requiere confirmar el email. */
  register(input: RegisterInput): Promise<Account | null>;
  login(emailOrUsername: string, password: string): Promise<Account>;
  logout(): void;
  currentAccountId(): Promise<string | null>;
  getAccount(id: string): Promise<Account | undefined>;
  updateProfile(
    id: string,
    changes: Partial<
      Pick<Account, 'displayName' | 'bio' | 'privateProfile' | 'avatarUrl' | 'location' | 'lat' | 'lng'>
    >,
  ): Promise<void>;
  /** Sube una foto de perfil (dataURL) y devuelve su URL final. */
  uploadAvatar(id: string, dataUrl: string): Promise<string>;
  changePassword(id: string, current: string, next: string): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  /** Suscripción a cambios de sesión (login/logout/confirmación). Opcional. */
  onAuthChange?(cb: () => void): () => void;
  /** Inicio de sesión con Google (OAuth). Solo en la nube. */
  signInWithGoogle?(): Promise<void>;
}

class LocalAuthService implements AuthService {
  async register(input: RegisterInput): Promise<Account> {
    const username = normalizeUsername(input.username);
    const uErr = validateUsername(username);
    if (uErr) throw new Error(uErr);
    const nErr = validateDisplayName(input.displayName);
    if (nErr) throw new Error(nErr);
    const pErr = validatePassword(input.password);
    if (pErr) throw new Error(pErr);
    const physical = buildPhysicalFields(input);

    const existing = await db.accounts.where('username').equals(username).first();
    if (existing) throw new Error('Ese nombre de usuario ya está en uso');

    const { hash, salt } = await hashPassword(input.password);
    const account: Account = {
      id: newId(),
      username,
      displayName: input.displayName.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      ...physical,
    };
    await db.accounts.add(account);
    localStorage.setItem(SESSION_KEY, account.id);
    return account;
  }

  async login(username: string, password: string): Promise<Account> {
    const account = await db.accounts.where('username').equals(normalizeUsername(username)).first();
    // Mensaje genérico (no revela si el usuario existe): anti-enumeración.
    const generic = 'Usuario o contraseña incorrectos';
    if (!account) {
      // Igualamos coste para no filtrar por tiempo si el usuario no existe.
      await hashPassword(password);
      throw new Error(generic);
    }
    const ok = await verifyPassword(password, {
      hash: account.passwordHash,
      salt: account.passwordSalt,
    });
    if (!ok) throw new Error(generic);
    localStorage.setItem(SESSION_KEY, account.id);
    return account;
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  async currentAccountId(): Promise<string | null> {
    return localStorage.getItem(SESSION_KEY);
  }

  getAccount(id: string): Promise<Account | undefined> {
    return db.accounts.get(id);
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
      changes = { ...changes, displayName: changes.displayName.trim() };
    }
    await db.accounts.update(id, changes);
  }

  async uploadAvatar(id: string, dataUrl: string): Promise<string> {
    // En local no hay Storage: se guarda el propio dataURL como avatar.
    await db.accounts.update(id, { avatarUrl: dataUrl });
    return dataUrl;
  }

  async changePassword(id: string, current: string, next: string): Promise<void> {
    const account = await db.accounts.get(id);
    if (!account) throw new Error('Cuenta no encontrada');
    const ok = await verifyPassword(current, {
      hash: account.passwordHash,
      salt: account.passwordSalt,
    });
    if (!ok) throw new Error('La contraseña actual no es correcta');
    const pErr = validatePassword(next);
    if (pErr) throw new Error(pErr);
    const { hash, salt } = await hashPassword(next);
    await db.accounts.update(id, { passwordHash: hash, passwordSalt: salt });
  }

  /** Borrado de cuenta (RGPD): elimina la cuenta, sus publicaciones y sus
   *  relaciones de seguimiento en ambos sentidos. */
  async deleteAccount(id: string): Promise<void> {
    await db.transaction('rw', [db.accounts, db.posts, db.follows], async () => {
      await db.accounts.delete(id);
      const own = await db.posts.where('authorId').equals(id).toArray();
      await db.posts.bulkDelete(own.map((p) => p.id));
      const rel = await db.follows
        .filter((f) => f.followerId === id || f.followeeId === id)
        .toArray();
      await db.follows.bulkDelete(rel.map((f) => f.id));
    });
    if ((await this.currentAccountId()) === id) this.logout();
  }
}

import { isSupabaseEnabled, supabase } from '../supabase';
import { SupabaseAuthService } from './supabaseAuthRepo';

// En la nube (credenciales presentes) usa Supabase Auth; si no, modo local.
export const authService: AuthService =
  isSupabaseEnabled && supabase ? new SupabaseAuthService(supabase) : new LocalAuthService();

export type { PublicAccount };
