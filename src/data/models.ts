// CAPA 1 · Datos — Modelos de dominio persistidos.
// Estos tipos son el contrato entre la base de datos (IndexedDB), la lógica
// de dominio (src/domain) y la interfaz (src/ui).

/** Grupos musculares del catálogo, en español. */
export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'bíceps'
  | 'tríceps'
  | 'pierna'
  | 'glúteo'
  | 'core'
  | 'cuerpo completo';

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  'pecho',
  'espalda',
  'hombros',
  'bíceps',
  'tríceps',
  'pierna',
  'glúteo',
  'core',
  'cuerpo completo',
];

/** Material necesario para realizar un ejercicio. */
export type Equipment =
  | 'barra'
  | 'mancuernas'
  | 'máquina'
  | 'polea'
  | 'peso corporal'
  | 'kettlebell'
  | 'banda elástica'
  | 'otro';

export interface Exercise {
  /** Slug estable y legible, p. ej. "press-banca". */
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  /** Instrucciones breves de ejecución, redactadas en español. */
  instructions: string;
  /** true si lo creó el usuario; los del catálogo no se pueden borrar. */
  isCustom: boolean;
  /** Fecha de creación en formato ISO 8601. */
  createdAt: string;
}

/** Tipo de serie (estilo Hevy). Ausente = 'normal' (retrocompatible). */
export type SetType = 'normal' | 'calentamiento' | 'drop' | 'fallo';

/** Una serie: repeticiones realizadas con un peso. Peso 0 = peso corporal. */
export interface WorkoutSet {
  reps: number;
  weightKg: number;
  /** Marcada al completarla durante el entrenamiento. */
  done: boolean;
  /** Tipo de serie. Ausente = 'normal'. */
  type?: SetType;
  /** Esfuerzo percibido (RPE) de 6 a 10, opcional. */
  rpe?: number;
}

/**
 * ¿Es una serie de trabajo efectiva? Las de calentamiento no cuentan para
 * el volumen ni para los récords (como en Hevy): inflarían las estadísticas.
 */
export function isWorkingSet(set: WorkoutSet): boolean {
  return set.done && set.type !== 'calentamiento';
}

/** Las series de un ejercicio dentro de una sesión. */
export interface SessionEntry {
  exerciseId: string;
  sets: WorkoutSet[];
  /** Nota libre del usuario para este ejercicio en esta sesión. */
  note?: string;
  /** Ejercicios con el mismo número forman una superserie. Ausente = suelto. */
  supersetGroup?: number;
}

/** Una sesión de entrenamiento (un día de gimnasio). */
export interface Session {
  id: string;
  /** Fecha y hora de inicio en formato ISO 8601. */
  date: string;
  /** Rutina de la que partió la sesión, si la hubo. */
  routineId?: string;
  entries: SessionEntry[];
  notes?: string;
  /** Duración del entrenamiento en minutos. */
  durationMin?: number;
}

/** Una rutina: plantilla reutilizable de ejercicios. Sin límite de rutinas. */
export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
  notes?: string;
  createdAt: string;
}

import type { BodyMeasurement, WaterDay } from './bodyModels';
import type { DiaryEntry, FoodItem, Post } from './nutritionModels';

/** Paquete de exportación/importación de datos. Esquema versionado:
 *  v1 = entrenamiento · v2 añade nutrición y comunidad · v3 cuerpo e
 *  hidratación. Las versiones antiguas siguen siendo importables. */
export interface ExportBundle {
  schema: 'forjafit';
  version: 3;
  exportedAt: string;
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  /** Alimentos del usuario y caché de OFF (el catálogo base no se exporta). */
  foods: FoodItem[];
  diary: DiaryEntry[];
  posts: Post[];
  bodyMetrics: BodyMeasurement[];
  water: WaterDay[];
}

export function newId(): string {
  return crypto.randomUUID();
}
