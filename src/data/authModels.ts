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

// Contraseñas muy comunes (y palabras propias de la app) — rechazo directo.
const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  'password',
  'password1',
  'contraseña',
  'contrasena',
  'qwerty',
  'qwertyuiop',
  'iloveyou',
  'admin123',
  'temple',
  'temple123',
  'gimnasio',
  'football',
  'princess',
  'abc12345',
]);

function charClasses(s: string): number {
  let n = 0;
  if (/[a-z]/.test(s)) n++;
  if (/[A-Z]/.test(s)) n++;
  if (/\d/.test(s)) n++;
  if (/[^a-zA-Z0-9]/.test(s)) n++;
  return n;
}

/** ¿Es un único carácter repetido o una secuencia trivial (12345678, abcdefg)? */
function isTrivialSequence(s: string): boolean {
  const lower = s.toLowerCase();
  if (/^(.)\1+$/.test(lower)) return true; // todo el mismo carácter
  const seqs = '0123456789abcdefghijklmnopqrstuvwxyzqwertyuiopasdfghjklzxcvbnm';
  const rev = [...seqs].reverse().join('');
  return seqs.includes(lower) || rev.includes(lower);
}

/**
 * Política moderna: longitud mínima de 8, pero las cortas (< 12) deben combinar
 * al menos 3 tipos de carácter; las largas (passphrases) pasan sin exigir
 * símbolos. Se rechazan las contraseñas comunes y las secuencias triviales.
 */
export function validatePassword(raw: string): string | null {
  if (raw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (raw.length > 100) return 'La contraseña es demasiado larga';
  if (COMMON_PASSWORDS.has(raw.toLowerCase())) {
    return 'Esa contraseña es demasiado común; elige otra';
  }
  if (isTrivialSequence(raw)) {
    return 'Evita secuencias o caracteres repetidos (como 12345678 o aaaaaaaa)';
  }
  if (raw.length < 12 && charClasses(raw) < 3) {
    return 'Combina mayúsculas, minúsculas, números o símbolos — o usa una contraseña más larga (12+)';
  }
  return null;
}

export interface PasswordStrength {
  /** 0 (muy débil) … 4 (fuerte). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

/** Fuerza orientativa para el medidor visual (no es la validación). */
export function passwordStrength(raw: string): PasswordStrength {
  if (!raw) return { score: 0, label: STRENGTH_LABELS[0]! };
  if (COMMON_PASSWORDS.has(raw.toLowerCase()) || isTrivialSequence(raw)) {
    return { score: 0, label: STRENGTH_LABELS[0]! };
  }
  let points = 0;
  if (raw.length >= 8) points++;
  if (raw.length >= 12) points++;
  if (raw.length >= 16) points++;
  const classes = charClasses(raw);
  if (classes >= 2) points++;
  if (classes >= 3) points++;
  const score = Math.min(4, points) as PasswordStrength['score'];
  return { score, label: STRENGTH_LABELS[score]! };
}
