// CAPA 2 · Dominio — Prompt del coach para el LLM (capa opcional).
// El motor determinista YA decidió las recomendaciones; el LLM solo las
// redacta de forma cercana y prioriza. Se le inyectan las heurísticas y se le
// PROHÍBE inventar ejercicios o cargas fuera de lo dado (evita alucinaciones).
import type { Goal } from '../routineGenerator';
import { GOAL_LABELS } from '../routineGenerator';
import { HEURISTICS } from './coachKnowledge';
import type { CoachRecommendation, CoachVerdict } from './coachRules';

/** Datos AGREGADOS que se envían al LLM (nunca la sesión cruda). */
export interface CoachAIContext {
  goal: Goal;
  avgRpe7d: number | null;
  avgSleepHours: number | null;
  sessionsPerWeek: number;
  fatigueScore: number;
}

export interface CoachAIPayload {
  verdict: CoachVerdict;
  recommendations: CoachRecommendation[];
  context: CoachAIContext;
}

export function buildCoachPrompt(payload: CoachAIPayload): string {
  const { verdict, recommendations, context } = payload;
  const heur = HEURISTICS.map((h) => `- ${h.titulo}: ${h.regla}`).join('\n');
  const recs = recommendations
    .map((r, i) => `${i + 1}. [${r.kind}] ${r.titulo}: ${r.detalle}`)
    .join('\n');

  return `Eres un coach de fuerza cercano y honesto que habla en español de tú. Tu trabajo es REDACTAR un mensaje breve y motivador para el usuario a partir de un análisis YA HECHO. NO inventes ejercicios, cargas ni números que no estén abajo. No prometas resultados médicos. Son adultos sanos; si algo sugiere lesión o patología, recomienda ver a un profesional.

Principios que sigues (no los copies literalmente, úsalos para explicar):
${heur}

Estado del usuario (datos agregados):
- Objetivo: ${GOAL_LABELS[context.goal]}
- RPE medio (7 días): ${context.avgRpe7d ?? 'sin datos'}
- Sueño medio: ${context.avgSleepHours !== null ? `${context.avgSleepHours} h` : 'sin datos'}
- Sesiones/semana: ${context.sessionsPerWeek}
- Índice de fatiga (0-10): ${context.fatigueScore}
- Veredicto: ${verdict.titulo} — ${verdict.detalle}

Recomendaciones ya calculadas (esto es lo que debes comunicar y priorizar):
${recs}

Devuelve SOLO JSON válido con esta forma:
{"mensaje":"2-4 frases cercanas que resuman cómo está y qué hacer hoy, priorizando lo más importante de la lista","foco":"la acción única más importante de hoy, en una frase corta"}`;
}
