// CAPA 1 · Datos — Siembra del catálogo en el primer arranque.
import { CATALOG } from './catalog';
import { db } from './db';
import type { Exercise } from './models';

/**
 * Inserta el catálogo de ejercicios si la base de datos está vacía.
 * Idempotente: en arranques posteriores no duplica nada.
 */
export async function ensureSeeded(): Promise<void> {
  const count = await db.exercises.count();
  if (count > 0) return;

  const now = new Date().toISOString();
  const exercises: Exercise[] = CATALOG.map((c) => ({
    ...c,
    isCustom: false,
    createdAt: now,
  }));
  await db.exercises.bulkAdd(exercises);
}
