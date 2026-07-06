// CAPA 1 · Datos — Autenticación en dos pasos (TOTP) con Supabase MFA.
// Solo modo nube. Flujo: enroll (QR + secreto) → verificar código → activada.
// En el login, si la cuenta tiene 2FA, la sesión entra en nivel aal1 y hay que
// completar un reto (código de la app de autenticación) para llegar a aal2.
import { supabase } from './supabase';

export interface MfaState {
  supported: boolean;
  enrolled: boolean;
  factorId: string | null;
}

export async function getMfaState(): Promise<MfaState> {
  if (!supabase) return { supported: false, enrolled: false, factorId: null };
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return { supported: true, enrolled: false, factorId: null };
  const totp = data.totp.find((f) => f.status === 'verified');
  return { supported: true, enrolled: !!totp, factorId: totp?.id ?? null };
}

export interface EnrollResult {
  factorId: string;
  /** SVG del código QR (lo genera Supabase) para escanear con la app TOTP. */
  qrSvg: string;
  /** Secreto en texto, por si se prefiere meterlo a mano. */
  secret: string;
}

export async function enrollTotp(): Promise<EnrollResult | { error: string }> {
  if (!supabase) return { error: 'Solo disponible en modo nube.' };
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error || !data) {
    return { error: error?.message ?? 'No se pudo iniciar la activación.' };
  }
  return { factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret };
}

/** Verifica el código de 6 dígitos para terminar de activar el factor. */
export async function verifyEnrollment(factorId: string, code: string): Promise<string | null> {
  if (!supabase) return 'Solo disponible en modo nube.';
  const { data: challenge, error: chError } = await supabase.auth.mfa.challenge({ factorId });
  if (chError || !challenge) return chError?.message ?? 'No se pudo crear el reto.';
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim(),
  });
  return error ? 'Código incorrecto. Comprueba la app de autenticación e inténtalo de nuevo.' : null;
}

export async function unenrollTotp(factorId: string): Promise<string | null> {
  if (!supabase) return 'Solo disponible en modo nube.';
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return error ? error.message : null;
}

/** ¿La sesión actual necesita completar el segundo paso (aal1 → aal2)? */
export async function needsMfaChallenge(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel === 'aal1' && data?.nextLevel === 'aal2';
}

/** Completa el segundo paso del login con el código TOTP. */
export async function completeMfaChallenge(code: string): Promise<string | null> {
  if (!supabase) return 'Solo disponible en modo nube.';
  const { data } = await supabase.auth.mfa.listFactors();
  const totp = data?.totp.find((f) => f.status === 'verified');
  if (!totp) return 'No hay un factor 2FA activo en esta cuenta.';
  return verifyEnrollment(totp.id, code);
}
