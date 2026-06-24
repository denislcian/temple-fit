// CAPA 2 · Dominio — Esfuerzo (RPE) frente a descanso (sueño) por semana.
// Hace VISIBLE la correlación que usa el coach: las semanas con menos sueño
// suelen venir con un RPE más alto. Función pura sobre datos del dispositivo.
import { isWorkingSet, type Session } from '../data/models';
import type { SleepSession } from '../data/sleepModels';
import { weekStartOf } from './volume';

export interface EffortRecoveryWeek {
  /** Lunes de la semana (YYYY-MM-DD). */
  weekStart: string;
  /** RPE medio de las series de trabajo de esa semana, o null. */
  avgRpe: number | null;
  /** Sueño medio en minutos esa semana, o null. */
  avgSleepMin: number | null;
}

function mean(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

/** Serie semanal de RPE medio y sueño medio (semanas con algún dato), ordenada. */
export function weeklyEffortRecovery(
  sessions: Session[],
  sleepSessions: SleepSession[],
): EffortRecoveryWeek[] {
  const rpeByWeek = new Map<string, number[]>();
  for (const s of sessions) {
    const week = weekStartOf(s.date);
    for (const entry of s.entries) {
      for (const set of entry.sets) {
        if (isWorkingSet(set) && typeof set.rpe === 'number') {
          (rpeByWeek.get(week) ?? rpeByWeek.set(week, []).get(week)!).push(set.rpe);
        }
      }
    }
  }

  const sleepByWeek = new Map<string, number[]>();
  for (const n of sleepSessions) {
    const week = weekStartOf(n.date);
    (sleepByWeek.get(week) ?? sleepByWeek.set(week, []).get(week)!).push(n.durationMin);
  }

  const weeks = new Set([...rpeByWeek.keys(), ...sleepByWeek.keys()]);
  return [...weeks]
    .sort()
    .map((weekStart) => {
      const avgRpe = mean(rpeByWeek.get(weekStart) ?? []);
      const avgSleepMin = mean(sleepByWeek.get(weekStart) ?? []);
      return {
        weekStart,
        avgRpe: avgRpe === null ? null : Math.round(avgRpe * 10) / 10,
        avgSleepMin: avgSleepMin === null ? null : Math.round(avgSleepMin),
      };
    });
}

/**
 * Frase de correlación cuando hay señal clara (≥3 semanas con ambos datos y
 * correlación inversa marcada). Devuelve null si no hay evidencia suficiente.
 */
export function effortRecoveryInsight(series: EffortRecoveryWeek[]): string | null {
  const both = series.filter((w) => w.avgRpe !== null && w.avgSleepMin !== null);
  if (both.length < 3) return null;
  const r = pearson(
    both.map((w) => w.avgSleepMin as number),
    both.map((w) => w.avgRpe as number),
  );
  if (r <= -0.4) {
    return 'Tus semanas con menos sueño tienden a venir con un RPE más alto: cuida el descanso para rendir más.';
  }
  if (r >= 0.4) {
    return 'Curiosamente, tu RPE sube en semanas con más sueño (quizá entrenas más fuerte cuando descansas bien).';
  }
  return 'De momento no veo una relación clara entre tu sueño y tu esfuerzo semanal.';
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}
