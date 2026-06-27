// CAPA 2 · Dominio — Stats públicas del perfil (lo que otros ven de ti).
// Se calculan a partir de TUS sesiones y se publican como un resumen agregado
// (no las sesiones crudas) en la nube, para que tu perfil muestre tu progreso.
import type { Session } from '../data/models';
import { weeklyStreak } from './consistency';
import { computeRecords } from './records';
import { totals } from './stats';

export interface BestLift {
  exerciseId: string;
  est1RM: number;
}

export interface PublicStats {
  sessions: number;
  volumeKg: number;
  streakWeeks: number;
  /** Mejores levantamientos por 1RM estimado (top 3). */
  bestLifts: BestLift[];
}

export function computeProfileStats(sessions: Session[], todayISO: string): PublicStats {
  const t = totals(sessions);
  // weeklyStreak espera una fecha YYYY-MM-DD; un ISO con hora rompe su bucle.
  const streak = weeklyStreak(sessions, todayISO.slice(0, 10));
  const records = computeRecords(sessions);
  const bestLifts: BestLift[] = [...records.values()]
    .map((r) => ({ exerciseId: r.exerciseId, est1RM: r.best1RM.estimated1RM }))
    .sort((a, b) => b.est1RM - a.est1RM)
    .slice(0, 3);
  return {
    sessions: t.sessions,
    volumeKg: Math.round(t.volumeKg),
    streakWeeks: streak.currentWeeks,
    bestLifts,
  };
}

export const EMPTY_STATS: PublicStats = { sessions: 0, volumeKg: 0, streakWeeks: 0, bestLifts: [] };
