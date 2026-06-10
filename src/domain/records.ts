// CAPA 2 · Dominio — Récords personales (PRs), calculados automáticamente.
import type { Session } from '../data/models';
import { estimate1RM } from './oneRepMax';

export interface RecordSet {
  weightKg: number;
  reps: number;
  /** Fecha ISO de la sesión en la que se logró. */
  date: string;
}

export interface PersonalRecord {
  exerciseId: string;
  /** Serie con más peso levantado (a igual peso, gana la de más repeticiones). */
  bestWeight: RecordSet;
  /** Serie con mejor 1RM estimado. */
  best1RM: RecordSet & { estimated1RM: number };
}

/** Calcula los récords personales de todos los ejercicios a partir del historial. */
export function computeRecords(sessions: Session[]): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const entry of session.entries) {
      for (const set of entry.sets) {
        if (!set.done || set.reps < 1) continue;

        const candidate: RecordSet = {
          weightKg: set.weightKg,
          reps: set.reps,
          date: session.date,
        };
        const estimated = estimate1RM(set.weightKg, set.reps);
        const current = records.get(entry.exerciseId);

        if (!current) {
          records.set(entry.exerciseId, {
            exerciseId: entry.exerciseId,
            bestWeight: candidate,
            best1RM: { ...candidate, estimated1RM: estimated },
          });
          continue;
        }

        if (
          candidate.weightKg > current.bestWeight.weightKg ||
          (candidate.weightKg === current.bestWeight.weightKg &&
            candidate.reps > current.bestWeight.reps)
        ) {
          current.bestWeight = candidate;
        }
        if (estimated > current.best1RM.estimated1RM) {
          current.best1RM = { ...candidate, estimated1RM: estimated };
        }
      }
    }
  }

  return records;
}

/**
 * ¿Esta serie supera el récord actual del ejercicio?
 * Útil para celebrar el PR justo al registrarlo.
 */
export function beatsRecord(
  records: Map<string, PersonalRecord>,
  exerciseId: string,
  weightKg: number,
  reps: number,
): boolean {
  if (reps < 1) return false;
  const current = records.get(exerciseId);
  if (!current) return true;
  return (
    weightKg > current.bestWeight.weightKg ||
    estimate1RM(weightKg, reps) > current.best1RM.estimated1RM
  );
}
