// CAPA 2 · Dominio — Volumen de entrenamiento (kg totales movidos).
// Solo cuentan las series marcadas como completadas.
import type { Session, WorkoutSet } from '../data/models';

/** Volumen de una serie: repeticiones × peso. */
export function setVolume(set: WorkoutSet): number {
  return set.reps * set.weightKg;
}

/** Volumen total de una sesión (solo series completadas). */
export function sessionVolume(session: Session): number {
  let total = 0;
  for (const entry of session.entries) {
    for (const set of entry.sets) {
      if (set.done) total += setVolume(set);
    }
  }
  return total;
}

/** Volumen de una sesión desglosado por ejercicio. */
export function volumeByExercise(session: Session): Map<string, number> {
  const result = new Map<string, number>();
  for (const entry of session.entries) {
    const volume = entry.sets.filter((s) => s.done).reduce((acc, s) => acc + setVolume(s), 0);
    if (volume > 0) {
      result.set(entry.exerciseId, (result.get(entry.exerciseId) ?? 0) + volume);
    }
  }
  return result;
}

/**
 * Lunes (en UTC) de la semana a la que pertenece una fecha ISO.
 * Se usa como clave estable para agrupar el volumen semanal.
 */
export function weekStartOf(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getUTCDay(); // 0 = domingo … 6 = sábado
  const sinceMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - sinceMonday),
  );
  return monday.toISOString().slice(0, 10);
}

export interface WeeklyVolume {
  /** Fecha (lunes) de inicio de la semana, YYYY-MM-DD. */
  weekStart: string;
  volumeKg: number;
}

/** Serie temporal de volumen por semana, ordenada de más antigua a más reciente. */
export function weeklyVolume(sessions: Session[]): WeeklyVolume[] {
  const byWeek = new Map<string, number>();
  for (const session of sessions) {
    const week = weekStartOf(session.date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + sessionVolume(session));
  }
  return [...byWeek.entries()]
    .map(([weekStart, volumeKg]) => ({ weekStart, volumeKg }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}
