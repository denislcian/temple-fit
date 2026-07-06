// CAPA 2 · Dominio — Importar contenido del feed a tu biblioteca.
// Una rutina compartida viaja con sus exerciseIds (posts nuevos); para posts
// antiguos se intenta casar cada línea con el nombre de un ejercicio del
// catálogo local. Los ejercicios que no existan aquí (personalizados de otra
// persona) se omiten y se informa de cuántos.
import type { Exercise } from '../data/models';

export interface RoutineImport {
  /** Ejercicios resolubles en ESTE dispositivo, en orden. */
  exerciseIds: string[];
  /** Cuántas líneas del post no se pudieron resolver. */
  missing: number;
}

export function resolveRoutineImport(
  payload: { lines: string[]; exerciseIds?: string[] },
  exercises: Exercise[],
): RoutineImport {
  const existing = new Set(exercises.map((e) => e.id));

  if (payload.exerciseIds && payload.exerciseIds.length > 0) {
    const ids = payload.exerciseIds.filter((id) => existing.has(id));
    return { exerciseIds: ids, missing: payload.exerciseIds.length - ids.length };
  }

  // Respaldo para posts antiguos: casar por nombre (insensible a mayúsculas).
  const byName = new Map(exercises.map((e) => [e.name.trim().toLowerCase(), e.id]));
  const ids: string[] = [];
  let missing = 0;
  for (const line of payload.lines) {
    const id = byName.get(line.trim().toLowerCase());
    if (id) ids.push(id);
    else missing += 1;
  }
  return { exerciseIds: ids, missing };
}
