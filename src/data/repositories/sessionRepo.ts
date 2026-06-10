// CAPA 1 · Datos — Repositorio de sesiones de entrenamiento.
import { db } from '../db';
import type { Session, WorkoutSet } from '../models';
import { newId } from '../models';

/** Historial completo, de más reciente a más antigua. Sin límite temporal. */
export async function getAllSessions(): Promise<Session[]> {
  return db.sessions.orderBy('date').reverse().toArray();
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

export async function addSession(data: Omit<Session, 'id'>): Promise<Session> {
  const session: Session = { ...data, id: newId() };
  await db.sessions.add(session);
  return session;
}

export async function updateSession(id: string, changes: Partial<Omit<Session, 'id'>>) {
  await db.sessions.update(id, changes);
}

export async function removeSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

/**
 * Series del ejercicio en la sesión más reciente que lo incluyó.
 * Es la base de la precarga "lo que hiciste la última vez"
 * (WCAG 2.2 · 3.3.7 Redundant Entry, y la feature núcleo de un gym log).
 */
export async function getLastSetsForExercise(exerciseId: string): Promise<WorkoutSet[] | null> {
  const sessions = await db.sessions.orderBy('date').reverse().toArray();
  for (const session of sessions) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId);
    if (entry && entry.sets.length > 0) {
      return entry.sets;
    }
  }
  return null;
}
