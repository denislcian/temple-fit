// CAPA 1 · Datos — Hash de contraseñas (Web Crypto, PBKDF2-SHA256).
//
// IMPORTANTE Y HONESTO: hashear en el CLIENTE no es seguridad real — quien
// abra IndexedDB ve el hash y el salt. Esto existe para que el flujo de
// cuentas sea realista en el modo local de demostración y para que la
// arquitectura (registro/login con verificación) sea la misma que tendrá la
// versión en la nube. En producción, la autenticación la hace Supabase Auth
// en el servidor (ver docs/SECURITY.md). NUNCA confíes en esto como barrera
// de seguridad.

const ITERATIONS = 100_000;

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

export interface PasswordHash {
  hash: string;
  salt: string;
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return { hash, salt: toBase64(salt) };
}

/** Verificación en tiempo constante para no filtrar info por el tiempo. */
export async function verifyPassword(
  password: string,
  stored: PasswordHash,
): Promise<boolean> {
  const candidate = await derive(password, fromBase64(stored.salt));
  if (candidate.length !== stored.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  }
  return diff === 0;
}
