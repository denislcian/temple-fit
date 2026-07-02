// CAPA 2 · Dominio — Prompt anclado y validador del consejo redactado por IA.
//
// Principio innegociable: el MOTOR DETERMINISTA decide todos los números y
// reglas (con sus citas); la IA SOLO redacta. Este módulo garantiza eso por
// arquitectura: el payload solo contiene agregados ya calculados (sin PII), y
// validateAdvice rechaza cualquier salida con un número o una cita que no
// estuviera en la entrada. Si algo falla, la app usa composeCoachAdvice.
import type { Goal } from '../routineGenerator';
import { GOAL_PRESCRIPTION } from './coachKnowledge';
import type { CoachContext } from './coachContext';
import type { CoachRecommendation, CoachVerdict } from './coachRules';

/** Entrada de la IA: SOLO agregados y textos ya emitidos por el motor. */
export interface AdvicePayload {
  veredicto: { estado: CoachVerdict['estado']; titulo: string; fatiga: number };
  contexto: {
    sesionesPorSemana: number;
    rpeMedio7d: number | null;
    suenoMedioHoras: number | null;
    semanasSinDescarga: number;
  };
  objetivo: Goal;
  pauta: { reps: string; cargaPct: string; rir: string; descanso: string };
  recomendaciones: Array<{ titulo: string; detalle: string; fuente?: string }>;
}

/** Construye el payload desde las MISMAS salidas que pinta la UI (nunca datos crudos). */
export function buildAdvicePayload(
  ctx: CoachContext,
  verdict: CoachVerdict,
  recs: CoachRecommendation[],
  goal: Goal,
): AdvicePayload {
  const p = GOAL_PRESCRIPTION[goal];
  return {
    veredicto: { estado: verdict.estado, titulo: verdict.titulo, fatiga: verdict.fatigueScore },
    contexto: {
      sesionesPorSemana: ctx.sessionsPerWeek,
      rpeMedio7d: ctx.avgRpe7d,
      suenoMedioHoras: ctx.avgSleepMin === null ? null : Math.round((ctx.avgSleepMin / 60) * 10) / 10,
      semanasSinDescarga: ctx.weeksContinuous,
    },
    objetivo: goal,
    pauta: {
      reps: `${p.repsMin}-${p.repsMax}`,
      cargaPct: `${p.loadPctMin}-${p.loadPctMax}% 1RM`,
      rir: p.rir,
      descanso: p.rest,
    },
    // Título, detalle y fuente van LITERALES: todo número y cita que la IA
    // puede usar ya existe en su entrada.
    recomendaciones: recs.slice(0, 5).map((r) => ({
      titulo: r.titulo,
      detalle: r.detalle,
      ...(r.fuente ? { fuente: r.fuente } : {}),
    })),
  };
}

/** Instrucción del redactor (vive también en la Edge Function; aquí para tests y transparencia). */
export const ADVICE_INSTRUCTION = `Eres el redactor del coach de una app de entrenamiento de fuerza. Las decisiones YA están tomadas por un motor de reglas con citas científicas; tú solo redactas.
PROHIBIDO: inventar o modificar números (kilos, series, %, repeticiones, horas), añadir consejos o ejercicios nuevos, mencionar estudios/autores/años que no estén en el campo "fuente", dar consejo médico, usar emojis o exclamaciones.
OBLIGATORIO: usa únicamente cifras que aparezcan en el JSON; si citas una fuente, cópiala EXACTAMENTE como llega en "fuente"; trata la primera recomendación como la prioridad del día; español de tú, tono sobrio y directo; 60-90 palabras.
Responde SOLO con JSON válido: {"foco":"3-5 palabras","mensaje":"el consejo"}`;

export interface AiAdvice {
  foco: string;
  mensaje: string;
}

/** Tokens numéricos (secuencias de dígitos) de un texto. */
function digitTokens(text: string): string[] {
  return text.match(/\d+/g) ?? [];
}

/**
 * Valida la salida de la IA contra su entrada. Devuelve null si NO es segura:
 * - JSON malformado o campos fuera de tamaño.
 * - Cualquier número del mensaje que no aparezca en el payload (anti-alucinación).
 * - Cualquier "Autor et al." que no venga de una fuente pasada.
 * - URLs (la IA no debe enlazar nada).
 */
export function validateAdvice(raw: string, payload: AdvicePayload): AiAdvice | null {
  let parsed: unknown;
  try {
    // Tolera vallas de código ```json ... ``` (común en LLMs).
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    parsed = JSON.parse((fence ? fence[1]! : raw).trim());
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const foco = (parsed as Record<string, unknown>).foco;
  const mensaje = (parsed as Record<string, unknown>).mensaje;
  if (typeof foco !== 'string' || typeof mensaje !== 'string') return null;
  const focoT = foco.trim();
  const mensajeT = mensaje.trim();
  if (!focoT || !mensajeT || focoT.length > 60 || mensajeT.length > 600) return null;

  // Sin URLs.
  if (/https?:\/\/|www\./i.test(mensajeT)) return null;

  // Anti-alucinación numérica: todo número del mensaje debe existir en la entrada.
  const allowed = new Set(digitTokens(JSON.stringify(payload)));
  for (const token of digitTokens(mensajeT)) {
    if (!allowed.has(token)) return null;
  }

  // Anti-alucinación de citas: "Apellido et al." debe venir de alguna fuente.
  const fuentes = payload.recomendaciones.map((r) => r.fuente ?? '').join(' | ');
  const authorRefs = mensajeT.matchAll(/([A-ZÁÉÍÓÚÑ][\wáéíóúñ-]+)\s+et al\.?/g);
  for (const m of authorRefs) {
    if (!fuentes.includes(m[1]!)) return null;
  }

  return { foco: focoT, mensaje: mensajeT };
}

/** Hash estable del payload (caché: mismo contexto = mismo consejo, sin red). */
export function payloadHash(payload: AdvicePayload): string {
  const s = JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}
