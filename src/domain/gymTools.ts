// CAPA 2 · Dominio — Herramientas de gimnasio.
// Lo que Hevy cobra en premium (calculadora de discos y de calentamiento)
// y lo que Fitbod vende como IA (sugerencia de progresión), como funciones
// puras y testeadas.
import type { WorkoutSet } from '../data/models';

/** Discos por lado habituales en gimnasios (kg). */
export const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const DEFAULT_BAR_KG = 20;

export interface PlateResult {
  /** Discos a colocar EN CADA LADO de la barra, de mayor a menor. */
  perSide: number[];
  /** Peso total realmente conseguido (barra + discos). */
  achievedKg: number;
  /** Diferencia con el objetivo (0 si se consigue exacto). */
  residualKg: number;
}

/** Qué discos poner en la barra para un peso objetivo (algoritmo voraz). */
export function platesFor(
  targetKg: number,
  barKg: number = DEFAULT_BAR_KG,
  available: readonly number[] = DEFAULT_PLATES,
): PlateResult {
  if (!Number.isFinite(targetKg) || targetKg < barKg) {
    return { perSide: [], achievedKg: barKg, residualKg: Math.max(0, targetKg - barKg) };
  }
  let remainingPerSide = (targetKg - barKg) / 2;
  const perSide: number[] = [];
  for (const plate of [...available].sort((a, b) => b - a)) {
    while (remainingPerSide >= plate - 1e-9) {
      perSide.push(plate);
      remainingPerSide -= plate;
    }
  }
  const achievedKg = barKg + perSide.reduce((a, p) => a + p, 0) * 2;
  return {
    perSide,
    achievedKg,
    residualKg: Math.round((targetKg - achievedKg) * 100) / 100,
  };
}

export interface WarmupSet {
  /** Porcentaje del peso de trabajo. */
  pct: number;
  reps: number;
  weightKg: number;
}

/**
 * Series de aproximación para un peso de trabajo: barra vacía y escalones
 * al 40/60/80%, redondeados a múltiplos de 2,5 kg (lo montable con discos).
 * Con pesos ligeros devuelve menos escalones (no tiene sentido calentar
 * al 40% de 25 kg con una barra de 20).
 */
export function warmupSets(workingWeightKg: number, barKg: number = DEFAULT_BAR_KG): WarmupSet[] {
  if (!Number.isFinite(workingWeightKg) || workingWeightKg <= barKg) return [];

  const round2_5 = (v: number) => Math.round(v / 2.5) * 2.5;
  const steps: Array<[pct: number, reps: number]> = [
    [0, 10],
    [0.4, 8],
    [0.6, 5],
    [0.8, 3],
  ];

  const result: WarmupSet[] = [];
  for (const [pct, reps] of steps) {
    const weightKg = pct === 0 ? barKg : Math.max(barKg, round2_5(workingWeightKg * pct));
    // Evita escalones repetidos o que igualen el peso de trabajo.
    if (weightKg >= workingWeightKg) continue;
    if (result.length > 0 && weightKg <= result[result.length - 1]!.weightKg) continue;
    result.push({ pct: Math.round(pct * 100), reps, weightKg });
  }
  return result;
}

export interface ProgressionSuggestion {
  action: 'subir' | 'repetir' | 'consolidar';
  nextWeightKg: number;
  reason: string;
}

/**
 * Sugerencia de progresión (doble progresión clásica) a partir de las
 * series de la última sesión del ejercicio:
 * - Todas las series completadas y ≥8 reps → subir peso (~2,5%, mín. 2,5 kg).
 * - Todas completadas con menos reps → añadir repeticiones con el mismo peso.
 * - Alguna serie fallada → consolidar el peso actual.
 */
export function suggestProgression(lastSets: WorkoutSet[]): ProgressionSuggestion | null {
  const withWeight = lastSets.filter((s) => s.weightKg > 0);
  if (withWeight.length === 0) return null;

  const topWeight = Math.max(...withWeight.map((s) => s.weightKg));
  const allDone = lastSets.every((s) => s.done);
  const minReps = Math.min(...withWeight.map((s) => s.reps));

  if (!allDone) {
    return {
      action: 'consolidar',
      nextWeightKg: topWeight,
      reason: 'La última vez quedó alguna serie sin completar: consolida este peso.',
    };
  }
  if (minReps >= 8) {
    const increment = Math.max(2.5, Math.round((topWeight * 0.025) / 2.5) * 2.5);
    return {
      action: 'subir',
      nextWeightKg: topWeight + increment,
      reason: `Completaste todas las series con ${minReps}+ repeticiones: toca subir.`,
    };
  }
  return {
    action: 'repetir',
    nextWeightKg: topWeight,
    reason: 'Mismo peso y busca una repetición más por serie (doble progresión).',
  };
}
