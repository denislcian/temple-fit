// CAPA 2 · Dominio — Modelo freemium (estilo Hevy).
// Lo que NUNCA se limita: registrar entrenamientos, historial, ejercicios,
// nutrición, descanso. Palancas del plan gratis: nº de RUTINAS guardadas y
// cuota diaria de IA (esta última vive en la Edge Function coach-advice).
export const FREE_ROUTINE_LIMIT = 4;

export interface RoutineGate {
  allowed: boolean;
  /** Huecos libres que quedan en el plan gratis (0 si premium: ilimitado). */
  remaining: number;
}

/** ¿Puede guardar `adding` rutinas más teniendo ya `current`? */
export function canAddRoutines(current: number, adding: number, isPremium: boolean): RoutineGate {
  if (isPremium) return { allowed: true, remaining: Infinity };
  const remaining = Math.max(0, FREE_ROUTINE_LIMIT - current);
  return { allowed: adding <= remaining, remaining };
}

/** Mensaje de límite alcanzado, coherente en toda la app. */
export function routineLimitMessage(adding: number): string {
  return adding > 1
    ? `El plan gratis guarda hasta ${FREE_ROUTINE_LIMIT} rutinas y este plan necesita ${adding}. Libera hueco borrando alguna o pásate a Premium (rutinas ilimitadas).`
    : `El plan gratis guarda hasta ${FREE_ROUTINE_LIMIT} rutinas. Libera hueco borrando alguna o pásate a Premium (rutinas ilimitadas).`;
}
