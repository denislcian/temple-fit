// CAPA 1 · Datos — Exportación e importación de datos.
// Propiedad de los datos: el usuario puede llevarse TODO en un clic, sin
// paywall (lo que Strong y Hevy cobran). Esquema versionado y validado.
import { db } from './db';
import type { Exercise, ExportBundle, Routine, Session } from './models';

/** Exporta toda la base de datos a un paquete JSON versionado. */
export async function exportBundle(): Promise<ExportBundle> {
  const [exercises, routines, sessions] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.sessions.toArray(),
  ]);
  return {
    schema: 'forjafit',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    routines,
    sessions,
  };
}

export interface ImportResult {
  exercises: number;
  routines: number;
  sessions: number;
}

/**
 * Importa un paquete exportado previamente. Estrategia de fusión: añade lo
 * que no existe (por id) y no toca lo existente, así importar nunca destruye.
 */
export async function importBundle(raw: unknown): Promise<ImportResult> {
  const bundle = parseBundle(raw);
  const result: ImportResult = { exercises: 0, routines: 0, sessions: 0 };

  await db.transaction('rw', [db.exercises, db.routines, db.sessions], async () => {
    for (const exercise of bundle.exercises) {
      const exists = await db.exercises.get(exercise.id);
      if (!exists) {
        await db.exercises.add(exercise);
        result.exercises++;
      }
    }
    for (const routine of bundle.routines) {
      const exists = await db.routines.get(routine.id);
      if (!exists) {
        await db.routines.add(routine);
        result.routines++;
      }
    }
    for (const session of bundle.sessions) {
      const exists = await db.sessions.get(session.id);
      if (!exists) {
        await db.sessions.add(session);
        result.sessions++;
      }
    }
  });

  return result;
}

/**
 * Exporta el historial de sesiones a CSV (una fila por serie),
 * apto para Excel, Google Sheets o análisis propio.
 */
export function sessionsToCsv(sessions: Session[], exercises: Exercise[]): string {
  const nameById = new Map(exercises.map((e) => [e.id, e.name]));
  const header = 'fecha,ejercicio,serie,repeticiones,peso_kg,completada';
  const rows: string[] = [header];

  for (const session of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    const day = session.date.slice(0, 10);
    for (const entry of session.entries) {
      const name = nameById.get(entry.exerciseId) ?? entry.exerciseId;
      entry.sets.forEach((set, i) => {
        rows.push(
          [day, csvField(name), i + 1, set.reps, set.weightKg, set.done ? 'sí' : 'no'].join(','),
        );
      });
    }
  }
  return rows.join('\r\n');
}

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

// ── Validación del paquete importado (type guards a mano, sin dependencias) ──

function parseBundle(raw: unknown): ExportBundle {
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      throw new Error('El archivo no contiene JSON válido');
    }
  }
  if (!isRecord(raw)) throw new Error('El archivo no tiene el formato esperado');
  if (raw.schema !== 'forjafit') {
    throw new Error('El archivo no es una exportación de ForjaFit');
  }
  if (raw.version !== 1) {
    throw new Error(`Versión de exportación no soportada: ${String(raw.version)}`);
  }
  if (
    !Array.isArray(raw.exercises) ||
    !Array.isArray(raw.routines) ||
    !Array.isArray(raw.sessions)
  ) {
    throw new Error('El archivo está incompleto (faltan colecciones de datos)');
  }
  for (const e of raw.exercises) {
    if (!isExercise(e)) throw new Error('Hay un ejercicio con formato inválido en el archivo');
  }
  for (const r of raw.routines) {
    if (!isRoutine(r)) throw new Error('Hay una rutina con formato inválido en el archivo');
  }
  for (const s of raw.sessions) {
    if (!isSession(s)) throw new Error('Hay una sesión con formato inválido en el archivo');
  }
  return raw as unknown as ExportBundle;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isExercise(v: unknown): v is Exercise {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.muscleGroup === 'string' &&
    typeof v.equipment === 'string' &&
    typeof v.instructions === 'string' &&
    typeof v.isCustom === 'boolean' &&
    typeof v.createdAt === 'string'
  );
}

function isRoutine(v: unknown): v is Routine {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    Array.isArray(v.exerciseIds) &&
    v.exerciseIds.every((id) => typeof id === 'string') &&
    typeof v.createdAt === 'string'
  );
}

function isSession(v: unknown): v is Session {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.date !== 'string') return false;
  if (!Array.isArray(v.entries)) return false;
  return v.entries.every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.exerciseId === 'string' &&
      Array.isArray(entry.sets) &&
      entry.sets.every(
        (set) =>
          isRecord(set) &&
          typeof set.reps === 'number' &&
          typeof set.weightKg === 'number' &&
          typeof set.done === 'boolean',
      ),
  );
}
