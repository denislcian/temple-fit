// CAPA 1 · Datos — Exportación e importación de datos.
// Propiedad de los datos: el usuario puede llevarse TODO en un clic, sin
// paywall (lo que Strong y Hevy cobran). Esquema versionado y validado.
import type { BodyMeasurement, WaterDay } from './bodyModels';
import { db } from './db';
import type { Exercise, ExportBundle, Routine, Session } from './models';
import { MEAL_LABELS, type DiaryEntry, type FoodItem, type Post } from './nutritionModels';

/** Exporta toda la base de datos a un paquete JSON versionado. */
export async function exportBundle(): Promise<ExportBundle> {
  const [exercises, routines, sessions, allFoods, diary, posts, bodyMetrics, water] =
    await Promise.all([
      db.exercises.toArray(),
      db.routines.toArray(),
      db.sessions.toArray(),
      db.foods.toArray(),
      db.diary.toArray(),
      db.posts.toArray(),
      db.bodyMetrics.toArray(),
      db.water.toArray(),
    ]);
  return {
    schema: 'forjafit',
    version: 3,
    exportedAt: new Date().toISOString(),
    exercises,
    routines,
    sessions,
    foods: allFoods.filter((f) => f.source !== 'catalogo'),
    diary,
    posts,
    bodyMetrics,
    water,
  };
}

export interface ImportResult {
  exercises: number;
  routines: number;
  sessions: number;
  foods: number;
  diary: number;
  posts: number;
  bodyMetrics: number;
  water: number;
}

/**
 * Importa un paquete exportado previamente. Estrategia de fusión: añade lo
 * que no existe (por id) y no toca lo existente, así importar nunca destruye.
 */
export async function importBundle(raw: unknown): Promise<ImportResult> {
  const bundle = parseBundle(raw);
  const result: ImportResult = {
    exercises: 0,
    routines: 0,
    sessions: 0,
    foods: 0,
    diary: 0,
    posts: 0,
    bodyMetrics: 0,
    water: 0,
  };

  await db.transaction(
    'rw',
    [db.exercises, db.routines, db.sessions, db.foods, db.diary, db.posts, db.bodyMetrics, db.water],
    async () => {
      const addMissing = async <T extends { id: string }>(
        get: (id: string) => Promise<T | undefined>,
        add: (item: T) => Promise<unknown>,
        items: T[],
      ): Promise<number> => {
        let added = 0;
        for (const item of items) {
          if (!(await get(item.id))) {
            await add(item);
            added++;
          }
        }
        return added;
      };

      result.exercises = await addMissing(
        (id) => db.exercises.get(id),
        (e) => db.exercises.add(e),
        bundle.exercises,
      );
      result.routines = await addMissing(
        (id) => db.routines.get(id),
        (r) => db.routines.add(r),
        bundle.routines,
      );
      result.sessions = await addMissing(
        (id) => db.sessions.get(id),
        (s) => db.sessions.add(s),
        bundle.sessions,
      );
      result.foods = await addMissing(
        (id) => db.foods.get(id),
        (f) => db.foods.add(f),
        bundle.foods,
      );
      result.diary = await addMissing(
        (id) => db.diary.get(id),
        (d) => db.diary.add(d),
        bundle.diary,
      );
      result.posts = await addMissing(
        (id) => db.posts.get(id),
        (p) => db.posts.add(p),
        bundle.posts,
      );
      result.bodyMetrics = await addMissing(
        (id) => db.bodyMetrics.get(id),
        (m) => db.bodyMetrics.add(m),
        bundle.bodyMetrics,
      );
      // El agua usa la fecha como clave (no hay id).
      for (const day of bundle.water) {
        if (!(await db.water.get(day.date))) {
          await db.water.add(day);
          result.water++;
        }
      }
    },
  );

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

/**
 * Exporta el diario de nutrición a CSV (una fila por alimento registrado),
 * apto para Excel, Google Sheets o análisis propio.
 */
export function diaryToCsv(entries: DiaryEntry[]): string {
  const header = 'fecha,comida,alimento,gramos,kcal,proteina_g,carbohidratos_g,grasa_g';
  const rows: string[] = [header];

  const sorted = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.meal.localeCompare(b.meal),
  );
  for (const e of sorted) {
    rows.push(
      [
        e.date,
        csvField(MEAL_LABELS[e.meal] ?? e.meal),
        csvField(e.foodName),
        e.grams,
        e.kcal,
        e.proteinG,
        e.carbsG,
        e.fatG,
      ].join(','),
    );
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
    throw new Error('El archivo no es una exportación de Temple');
  }
  // Las versiones antiguas siguen siendo importables: las colecciones que
  // no existían en su época simplemente llegan vacías.
  if (raw.version !== 1 && raw.version !== 2 && raw.version !== 3) {
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

  const foods = Array.isArray(raw.foods) ? raw.foods : [];
  const diary = Array.isArray(raw.diary) ? raw.diary : [];
  const posts = Array.isArray(raw.posts) ? raw.posts : [];
  const bodyMetrics = Array.isArray(raw.bodyMetrics) ? raw.bodyMetrics : [];
  const water = Array.isArray(raw.water) ? raw.water : [];
  for (const f of foods) {
    if (!isFood(f)) throw new Error('Hay un alimento con formato inválido en el archivo');
  }
  for (const d of diary) {
    if (!isDiaryEntry(d)) throw new Error('Hay una entrada del diario con formato inválido');
  }
  for (const p of posts) {
    if (!isPost(p)) throw new Error('Hay una publicación con formato inválido en el archivo');
  }
  for (const m of bodyMetrics) {
    if (!isBodyMeasurement(m)) throw new Error('Hay una medida corporal con formato inválido');
  }
  for (const w of water) {
    if (!isWaterDay(w)) throw new Error('Hay un registro de hidratación con formato inválido');
  }

  return {
    schema: 'forjafit',
    version: 3,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    exercises: raw.exercises as Exercise[],
    routines: raw.routines as Routine[],
    sessions: raw.sessions as Session[],
    foods: foods as FoodItem[],
    diary: diary as DiaryEntry[],
    posts: posts as Post[],
    bodyMetrics: bodyMetrics as BodyMeasurement[],
    water: water as WaterDay[],
  };
}

function isBodyMeasurement(v: unknown): v is BodyMeasurement {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.date === 'string' &&
    typeof v.weightKg === 'number'
  );
}

function isWaterDay(v: unknown): v is WaterDay {
  return isRecord(v) && typeof v.date === 'string' && typeof v.glasses === 'number';
}

function hasMacros(v: Record<string, unknown>): boolean {
  return (
    typeof v.kcal === 'number' &&
    typeof v.proteinG === 'number' &&
    typeof v.carbsG === 'number' &&
    typeof v.fatG === 'number'
  );
}

function isFood(v: unknown): v is FoodItem {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.source === 'string' &&
    hasMacros(v)
  );
}

function isDiaryEntry(v: unknown): v is DiaryEntry {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.date === 'string' &&
    typeof v.meal === 'string' &&
    typeof v.foodName === 'string' &&
    typeof v.grams === 'number' &&
    hasMacros(v)
  );
}

function isPost(v: unknown): v is Post {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.author === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.text === 'string' &&
    typeof v.likes === 'number' &&
    Array.isArray(v.comments)
  );
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
