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

/** Una serie: repeticiones realizadas con un peso. Peso 0 = peso corporal. */
export interface WorkoutSet {
  reps: number;
  weightKg: number;
  /** Marcada al completarla durante el entrenamiento. */
  done: boolean;
}

/** Las series de un ejercicio dentro de una sesión. */
export interface SessionEntry {
  exerciseId: string;
  sets: WorkoutSet[];
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
}

/** Una rutina: plantilla reutilizable de ejercicios. Sin límite de rutinas. */
export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
  notes?: string;
  createdAt: string;
}

/** Paquete de exportación/importación de datos. Esquema versionado. */
export interface ExportBundle {
  schema: 'forjafit';
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
}

export function newId(): string {
  return crypto.randomUUID();
}
