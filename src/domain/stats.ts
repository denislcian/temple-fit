// CAPA 2 · Dominio — Estadísticas y series para las gráficas de progreso.
// También genera los datos de los RESÚMENES TEXTUALES accesibles: cada
// gráfica de la app tiene una alternativa en texto y tabla (WCAG 1.1.1).
import type { Session } from '../data/models';
import { estimate1RM } from './oneRepMax';
import { sessionVolume } from './volume';

export interface ProgressionPoint {
  /** Fecha de la sesión, YYYY-MM-DD. */
  date: string;
  /** Mejor 1RM estimado del ejercicio ese día. */
  best1RM: number;
  /** Peso máximo levantado ese día. */
  topWeightKg: number;
  /** Volumen del ejercicio ese día. */
  volumeKg: number;
}

/** Serie temporal de progreso de un ejercicio, ordenada por fecha. */
export function exerciseProgression(sessions: Session[], exerciseId: string): ProgressionPoint[] {
  const points: ProgressionPoint[] = [];

  for (const session of sessions) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    const doneSets = entry.sets.filter((s) => s.done && s.reps >= 1);
    if (doneSets.length === 0) continue;

    points.push({
      date: session.date.slice(0, 10),
      best1RM: Math.max(...doneSets.map((s) => estimate1RM(s.weightKg, s.reps))),
      topWeightKg: Math.max(...doneSets.map((s) => s.weightKg)),
      volumeKg: doneSets.reduce((acc, s) => acc + s.reps * s.weightKg, 0),
    });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export interface ProgressSummary {
  firstValue: number;
  lastValue: number;
  deltaAbs: number;
  /** Variación porcentual redondeada a 1 decimal; null si el inicio es 0. */
  deltaPct: number | null;
  points: number;
}

/**
 * Resumen primero-vs-último de una serie numérica. Es la base de la frase
 * accesible: "Tu press banca pasó de 60 a 72,5 kg (+20,8%) en 12 sesiones".
 */
export function summarizeProgress(values: number[]): ProgressSummary | null {
  if (values.length === 0) return null;
  const firstValue = values[0]!;
  const lastValue = values[values.length - 1]!;
  const deltaAbs = Math.round((lastValue - firstValue) * 10) / 10;
  const deltaPct =
    firstValue === 0 ? null : Math.round(((lastValue - firstValue) / firstValue) * 1000) / 10;
  return { firstValue, lastValue, deltaAbs, deltaPct, points: values.length };
}

export interface Totals {
  sessions: number;
  sets: number;
  reps: number;
  volumeKg: number;
}

/** Totales históricos para la vista de progreso. */
export function totals(sessions: Session[]): Totals {
  const result: Totals = { sessions: sessions.length, sets: 0, reps: 0, volumeKg: 0 };
  for (const session of sessions) {
    result.volumeKg += sessionVolume(session);
    for (const entry of session.entries) {
      for (const set of entry.sets) {
        if (!set.done) continue;
        result.sets += 1;
        result.reps += set.reps;
      }
    }
  }
  return result;
}
