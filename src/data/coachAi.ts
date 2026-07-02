// CAPA 1 · Datos — Transporte del consejo redactado por IA (proxy en Supabase).
//
// Solo TRANSPORTA: el payload anclado lo construye el dominio (coachPrompt.ts)
// y la validación anti-alucinaciones también es del dominio (validateAdvice).
// La clave del proveedor vive como secreto en la Edge Function, nunca aquí.
// Sin Supabase, sin sesión o ante cualquier error, el que llama usa el
// redactor local (composeCoachAdvice): la IA es un extra, nunca un requisito.
import {
  payloadHash,
  validateAdvice,
  type AdvicePayload,
  type AiAdvice,
} from '../domain/coach/coachPrompt';
import { supabase } from './supabase';

const CACHE_KEY = 'forjafit-coach-ai-cache';

export type CoachAiError = 'no-disponible' | 'cuota' | 'red' | 'invalido';

export type CoachAiResult = { ok: true; advice: AiAdvice; cached: boolean } | { ok: false; reason: CoachAiError };

interface CachedAdvice {
  hash: string;
  day: string;
  advice: AiAdvice;
}

function readCache(hash: string): AiAdvice | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAdvice;
    const today = new Date().toISOString().slice(0, 10);
    return parsed.hash === hash && parsed.day === today ? parsed.advice : null;
  } catch {
    return null;
  }
}

function writeCache(hash: string, advice: AiAdvice): void {
  const entry: CachedAdvice = { hash, day: new Date().toISOString().slice(0, 10), advice };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

/** ¿Puede este dispositivo pedir el consejo IA? (modo nube + sesión iniciada). */
export async function isCoachAiAvailable(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return data.session !== null;
}

/**
 * Pide a la Edge Function el consejo redactado y lo valida contra el payload.
 * Mismo contexto en el mismo día = respuesta cacheada (sin red ni cuota).
 */
export async function fetchAiAdvice(payload: AdvicePayload): Promise<CoachAiResult> {
  if (!supabase) return { ok: false, reason: 'no-disponible' };

  // El consejo del día se cachea; las preguntas del chat no (cada una es única).
  const isQuestion = typeof payload.pregunta === 'string';
  const hash = payloadHash(payload);
  const cached = isQuestion ? null : readCache(hash);
  if (cached) return { ok: true, advice: cached, cached: true };

  try {
    const { data, error } = await supabase.functions.invoke('coach-advice', { body: payload });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      return { ok: false, reason: status === 429 ? 'cuota' : 'red' };
    }
    const raw = (data as { raw?: unknown })?.raw;
    if (typeof raw !== 'string') return { ok: false, reason: 'invalido' };

    const advice = validateAdvice(raw, payload);
    if (!advice) return { ok: false, reason: 'invalido' };

    if (!isQuestion) writeCache(hash, advice);
    return { ok: true, advice, cached: false };
  } catch {
    return { ok: false, reason: 'red' };
  }
}
