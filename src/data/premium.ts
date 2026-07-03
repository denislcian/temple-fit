// CAPA 1 · Datos — Estado premium del usuario.
// La verdad vive en profiles.premium_until (solo la escribe el servidor: el
// webhook de Stripe o el dueño a mano). Aquí solo se LEE, con una caché corta
// para no consultar en cada render. En modo local no hay premium (el pago va
// ligado a la cuenta).
import { supabase } from './supabase';

export interface PremiumStatus {
  premium: boolean;
  /** ISO de caducidad si es premium. */
  until: string | null;
}

const CACHE_MS = 5 * 60 * 1000;
let cache: { at: number; status: PremiumStatus } | null = null;

export async function getPremiumStatus(): Promise<PremiumStatus> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.status;

  let status: PremiumStatus = { premium: false, until: null };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (userId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('premium_until')
        .eq('user_id', userId)
        .maybeSingle();
      const until = (prof as { premium_until?: string | null } | null)?.premium_until ?? null;
      status = { premium: !!until && new Date(until).getTime() > Date.now(), until };
    }
  }
  cache = { at: Date.now(), status };
  return status;
}

/** Invalida la caché (p. ej. al volver del pago). */
export function refreshPremiumStatus(): void {
  cache = null;
}

/**
 * URL del Payment Link de Stripe (suscripción Premium), configurada en build
 * con VITE_STRIPE_PAYMENT_LINK. client_reference_id = user_id de Supabase para
 * que el webhook active el premium sin ambigüedad. null si no está configurada.
 */
export async function getUpgradeUrl(): Promise<string | null> {
  const base = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;
  if (!base || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const url = new URL(base);
  url.searchParams.set('client_reference_id', user.id);
  if (user.email) url.searchParams.set('prefilled_email', user.email);
  return url.toString();
}
