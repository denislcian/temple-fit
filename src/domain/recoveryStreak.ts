// CAPA 2 · Dominio — Racha de recuperación (sueño + respiración/meditación).
// Función pura: cuenta días consecutivos en que el usuario hizo algo por su
// recuperación. Misma idea que la racha semanal de entrenamiento, pero diaria.
export interface RecoveryStreak {
  /** Días consecutivos hasta hoy (o ayer, si hoy aún no hay registro). */
  current: number;
  /** Racha más larga histórica. */
  best: number;
  /** Días distintos con recuperación. */
  total: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function shift(dayISO: string, deltaDays: number): string {
  return new Date(new Date(dayISO).getTime() + deltaDays * DAY_MS).toISOString().slice(0, 10);
}

function diffDays(aISO: string, bISO: string): number {
  return Math.round((new Date(aISO).getTime() - new Date(bISO).getTime()) / DAY_MS);
}

export function recoveryStreak(days: string[], todayISO: string): RecoveryStreak {
  const set = new Set(days.map(dayKey));
  const total = set.size;
  if (total === 0) return { current: 0, best: 0, total: 0 };

  const sorted = [...set].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (diffDays(sorted[i]!, sorted[i - 1]!) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  // La racha actual sigue viva si el último día fue hoy o ayer.
  const today = dayKey(todayISO);
  let cursor: string | null = set.has(today) ? today : set.has(shift(today, -1)) ? shift(today, -1) : null;
  let current = 0;
  while (cursor && set.has(cursor)) {
    current += 1;
    cursor = shift(cursor, -1);
  }

  return { current, best, total };
}
