// CAPA 1 · Datos — Modelos e identidad de las cuentas (red social).

export interface Account {
  id: string;
  /** Handle único en minúsculas, p. ej. "dani_lift". */
  username: string;
  displayName: string;
  bio?: string;
  /** Hash y salt de la contraseña (ver crypto.ts; no es seguridad real). */
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  /** Perfil privado: solo tus seguidores ven tu actividad. */
  privateProfile?: boolean;
}

/** Cuenta sin los campos sensibles, para mostrar en la UI. */
export type PublicAccount = Omit<Account, 'passwordHash' | 'passwordSalt'>;

export function toPublic(account: Account): PublicAccount {
  const rest: Partial<Account> = { ...account };
  delete rest.passwordHash;
  delete rest.passwordSalt;
  return rest as PublicAccount;
}

/** Color de avatar derivado del id (determinista, sin guardar nada). */
export function avatarHue(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// ── Validación (pura y testeable) ─────────────────────────

/** Normaliza un handle: minúsculas y sin espacios alrededor. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Devuelve un mensaje de error o null si el usuario es válido. */
export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < 3) return 'El usuario debe tener al menos 3 caracteres';
  if (u.length > 20) return 'El usuario no puede superar los 20 caracteres';
  if (!/^[a-z0-9_.]+$/.test(u)) {
    return 'Usa solo letras, números, guion bajo o punto (sin espacios)';
  }
  return null;
}

export function validateDisplayName(raw: string): string | null {
  const n = raw.trim();
  if (n.length < 1) return 'Escribe un nombre para mostrar';
  if (n.length > 40) return 'El nombre no puede superar los 40 caracteres';
  return null;
}

export function validatePassword(raw: string): string | null {
  if (raw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (raw.length > 100) return 'La contraseña es demasiado larga';
  return null;
}
