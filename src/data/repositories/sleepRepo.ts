// CAPA 1 · Datos — Repositorio de sesiones de sueño.
import { db } from '../db';
import { newId } from '../models';
import type { SleepSession } from '../sleepModels';

/** Sesiones de sueño, de más reciente a más antigua. */
export async function getAllSleepSessions(): Promise<SleepSession[]> {
  return db.sleepSessions.orderBy('startedAt').reverse().toArray();
}

export async function addSleepSession(data: Omit<SleepSession, 'id'>): Promise<SleepSession> {
  const session: SleepSession = { ...data, id: newId() };
  await db.sleepSessions.add(session);
  return session;
}

export async function removeSleepSession(id: string): Promise<void> {
  await db.sleepSessions.delete(id);
}
