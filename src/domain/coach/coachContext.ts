// CAPA 2 · Dominio — Contexto del coach: cruza los datos locales del usuario
// (sesiones con RPE, volumen por músculo, sueño) en un resumen AGREGADO que
// consumen las reglas. Función pura y determinista: recibe `todayISO` para que
// los tests no dependan de la fecha real. Solo trabaja con datos del dispositivo.
import { isWorkingSet, type Exercise, type MuscleGroup, type Session } from '../../data/models';
import type { SleepSession } from '../../data/sleepModels';
import { THRESHOLDS } from './coachKnowledge';

export interface MuscleVolume {
  muscle: MuscleGroup;
  /** Series de trabajo en la ventana (últimos 7 días). */
  sets: number;
  /** Días distintos en que se entrenó el músculo (frecuencia semanal). */
  days: number;
}

export interface ExerciseSignal {
  exerciseId: string;
  name: string;
  /** Repeticiones de las series de trabajo de la última sesión. */
  lastReps: number[];
  lastMaxRpe: number | null;
  /** Todas las series con muchas reps y poco esfuerzo → margen para subir peso. */
  readyToProgress: boolean;
  /** El ejercicio es compuesto (multiarticular): incremento de carga mayor. */
  isCompound: boolean;
}

export interface CoachContext {
  todayISO: string;
  sessionCount: number;
  daysSinceLastSession: number | null;
  /** Media de sesiones por semana en las últimas 4 semanas. */
  sessionsPerWeek: number;
  /** RPE medio de las series de trabajo de los últimos 7 días. */
  avgRpe7d: number | null;
  rpeSampleSize: number;
  /** Sesiones recientes seguidas con RPE medio ≥ umbral alto. */
  hardSessionsInARow: number;
  /** Volumen y frecuencia por músculo en los últimos 7 días. */
  muscleVolumes: MuscleVolume[];
  /** Sueño medio (min) de las últimas 7 noches registradas, o null. */
  avgSleepMin: number | null;
  sleepSampleSize: number;
  /** Semanas seguidas (recientes) con al menos una sesión: proxy de "sin descarga". */
  weeksContinuous: number;
  exerciseSignals: ExerciseSignal[];
  /** Índice de fatiga 0-10 (combina RPE, sueño y densidad de sesiones). */
  fatigueScore: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO.slice(0, 10)).getTime();
  const b = new Date(bISO.slice(0, 10)).getTime();
  return Math.round((a - b) / DAY_MS);
}

/** Ejercicios compuestos (mayor salto de carga en la progresión). */
const COMPOUND_PATTERNS = /sentadilla|peso-muerto|press|remo|dominadas|hip-thrust|prensa|fondos|zancadas|jalon/;

function avg(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

export interface CoachContextInput {
  sessions: Session[];
  sleepSessions: SleepSession[];
  exercises: Exercise[];
  todayISO: string;
}

export function buildCoachContext(input: CoachContextInput): CoachContext {
  const { sessions, sleepSessions, exercises, todayISO } = input;
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  const last7 = sorted.filter((s) => daysBetween(todayISO, s.date) <= 6 && daysBetween(todayISO, s.date) >= 0);
  const last28 = sorted.filter((s) => daysBetween(todayISO, s.date) <= 27 && daysBetween(todayISO, s.date) >= 0);

  // RPE medio de las series de trabajo de los últimos 7 días.
  const rpeValues: number[] = [];
  for (const s of last7) {
    for (const entry of s.entries) {
      for (const set of entry.sets) {
        if (isWorkingSet(set) && typeof set.rpe === 'number') rpeValues.push(set.rpe);
      }
    }
  }
  const avgRpe7d = avg(rpeValues);

  // Sesiones "duras" seguidas (de la más reciente hacia atrás).
  let hardSessionsInARow = 0;
  for (const s of sorted) {
    const rpes = s.entries
      .flatMap((e) => e.sets)
      .filter((set) => isWorkingSet(set) && typeof set.rpe === 'number')
      .map((set) => set.rpe as number);
    const m = avg(rpes);
    if (m !== null && m >= THRESHOLDS.rpeAltoSesion) hardSessionsInARow += 1;
    else break;
  }

  // Volumen y frecuencia por músculo en los últimos 7 días.
  const setsByMuscle = new Map<MuscleGroup, number>();
  const daysByMuscle = new Map<MuscleGroup, Set<string>>();
  for (const s of last7) {
    const day = s.date.slice(0, 10);
    for (const entry of s.entries) {
      const ex = byId.get(entry.exerciseId);
      if (!ex) continue;
      const working = entry.sets.filter(isWorkingSet).length;
      if (working === 0) continue;
      setsByMuscle.set(ex.muscleGroup, (setsByMuscle.get(ex.muscleGroup) ?? 0) + working);
      const set = daysByMuscle.get(ex.muscleGroup) ?? new Set<string>();
      set.add(day);
      daysByMuscle.set(ex.muscleGroup, set);
    }
  }
  const muscleVolumes: MuscleVolume[] = [...setsByMuscle.entries()]
    .map(([muscle, sets]) => ({ muscle, sets, days: daysByMuscle.get(muscle)?.size ?? 0 }))
    .sort((a, b) => b.sets - a.sets);

  // Señales por ejercicio de la última sesión (doble progresión).
  const exerciseSignals: ExerciseSignal[] = [];
  const lastSession = sorted[0];
  if (lastSession) {
    for (const entry of lastSession.entries) {
      const ex = byId.get(entry.exerciseId);
      const working = entry.sets.filter(isWorkingSet);
      if (!ex || working.length === 0) continue;
      const lastReps = working.map((s) => s.reps);
      const rpes = working.map((s) => s.rpe).filter((r): r is number => typeof r === 'number');
      const lastMaxRpe = rpes.length ? Math.max(...rpes) : null;
      const isCompound = COMPOUND_PATTERNS.test(ex.id);
      // Listo para progresar: todas las series ≥10 reps y, si hay RPE, esfuerzo bajo.
      const readyToProgress =
        lastReps.every((r) => r >= 10) && (lastMaxRpe === null || lastMaxRpe <= THRESHOLDS.rpeBajo);
      exerciseSignals.push({
        exerciseId: ex.id,
        name: ex.name,
        lastReps,
        lastMaxRpe,
        readyToProgress,
        isCompound,
      });
    }
  }

  // Sueño medio de las últimas 7 noches registradas.
  const recentSleep = [...sleepSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((s) => daysBetween(todayISO, s.date) <= 7 && daysBetween(todayISO, s.date) >= 0)
    .slice(0, 7);
  const avgSleepMin = avg(recentSleep.map((s) => s.durationMin));

  // Semanas seguidas con al menos una sesión (proxy de "sin descarga").
  const weekKeys = new Set(sorted.map((s) => weekIndex(todayISO, s.date)));
  let weeksContinuous = 0;
  for (let w = 0; ; w++) {
    if (weekKeys.has(w)) weeksContinuous += 1;
    else break;
  }

  const daysSinceLastSession = lastSession ? daysBetween(todayISO, lastSession.date) : null;
  const sessionsPerWeek = last28.length / 4;

  // Índice de fatiga 0-10: RPE alto, sueño bajo y mucha densidad suman fatiga.
  let fatigue = 0;
  if (avgRpe7d !== null) fatigue += Math.max(0, (avgRpe7d - 7) * 2); // 0..6
  if (avgSleepMin !== null && avgSleepMin < THRESHOLDS.suenoObjetivoMin) {
    fatigue += Math.min(2, (THRESHOLDS.suenoObjetivoMin - avgSleepMin) / 60);
  }
  if (sessionsPerWeek > 5) fatigue += 1;
  // Sesiones duras encadenadas pesan: es la señal más directa de sobrecarga.
  if (hardSessionsInARow >= 2) fatigue += 1.5;
  const fatigueScore = Math.round(Math.min(10, Math.max(0, fatigue)) * 10) / 10;

  return {
    todayISO,
    sessionCount: sessions.length,
    daysSinceLastSession,
    sessionsPerWeek: Math.round(sessionsPerWeek * 10) / 10,
    avgRpe7d: avgRpe7d === null ? null : Math.round(avgRpe7d * 10) / 10,
    rpeSampleSize: rpeValues.length,
    hardSessionsInARow,
    muscleVolumes,
    avgSleepMin: avgSleepMin === null ? null : Math.round(avgSleepMin),
    sleepSampleSize: recentSleep.length,
    weeksContinuous,
    exerciseSignals,
    fatigueScore,
  };
}

/** Índice de semana (0 = esta semana, 1 = la anterior…) respecto a hoy. */
function weekIndex(todayISO: string, dateISO: string): number {
  return Math.floor(daysBetween(todayISO, dateISO) / 7);
}
