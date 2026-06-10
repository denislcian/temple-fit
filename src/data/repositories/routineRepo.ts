// CAPA 1 · Datos — Repositorio de rutinas (plantillas). Sin límite de rutinas.
import { db } from '../db';
import type { Routine } from '../models';
import { newId } from '../models';

export async function getAllRoutines(): Promise<Routine[]> {
  const all = await db.routines.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getRoutineById(id: string): Promise<Routine | undefined> {
  return db.routines.get(id);
}

export async function addRoutine(data: Omit<Routine, 'id' | 'createdAt'>): Promise<Routine> {
  const routine: Routine = {
    ...data,
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  await db.routines.add(routine);
  return routine;
}

export async function updateRoutine(id: string, changes: Partial<Omit<Routine, 'id'>>) {
  await db.routines.update(id, changes);
}

export async function removeRoutine(id: string): Promise<void> {
  await db.routines.delete(id);
}
