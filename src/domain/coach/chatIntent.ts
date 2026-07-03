// CAPA 2 · Dominio — Intención del chat del coach.
// Detecta si el usuario está pidiendo una RUTINA/PLAN: en ese caso el chat no
// gasta IA ni cuota — responde el generador determinista (routineGenerator).
const ROUTINE_PATTERNS = [
  /rutin/i, // rutina, rutinas
  /plan\s+de\s+entren/i,
  /programa\s+de\s+entren/i,
  /hazme\s+un\s+plan/i,
  /prep[aá]rame\s+un\s+plan/i,
  /qu[eé]\s+entreno\s+cada\s+d[ií]a/i,
];

/** ¿El texto pide una rutina/plan de entrenamiento? */
export function isRoutineRequest(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return ROUTINE_PATTERNS.some((re) => re.test(t));
}
