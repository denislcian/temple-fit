// CAPA 1 · Datos — Retos de la comunidad (modo local).
// Mismo contrato que la versión nube (Supabase). El progreso lo calcula la UI
// con las sesiones locales y se guarda aquí; las sesiones nunca salen.
import { db } from '../db';
import { newId } from '../models';
import type { Challenge, ChallengeMember, NewChallenge } from '../challengeModels';

export interface ChallengesRepository {
  /** Retos cuya ventana no ha terminado, más recientes primero. */
  listActive(todayISO: string): Promise<Challenge[]>;
  create(input: NewChallenge): Promise<Challenge>;
  /** Borra un reto (solo el creador). */
  remove(challengeId: string, userId: string): Promise<void>;
  join(challengeId: string, userId: string, name: string): Promise<void>;
  leave(challengeId: string, userId: string): Promise<void>;
  setProgress(challengeId: string, userId: string, progress: number): Promise<void>;
  getMembers(challengeId: string): Promise<ChallengeMember[]>;
  /** Ids de los retos en los que participa el usuario. */
  getJoined(userId: string): Promise<string[]>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function buildChallenge(input: NewChallenge): Challenge {
  const now = new Date();
  const duration = Math.max(1, Math.round(input.durationDays ?? 7));
  return {
    id: newId(),
    title: input.title.trim(),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    goalDays: Math.max(1, Math.round(input.goalDays)),
    startsAt: now.toISOString(),
    endsAt: new Date(now.getTime() + duration * DAY_MS).toISOString(),
    creatorId: input.creatorId,
    creatorName: input.creatorName,
    createdAt: now.toISOString(),
  };
}

class LocalChallengesRepository implements ChallengesRepository {
  async listActive(todayISO: string): Promise<Challenge[]> {
    await ensureSeeded();
    const today = todayISO.slice(0, 10);
    const all = await db.challenges.toArray();
    return all
      .filter((c) => c.endsAt.slice(0, 10) >= today)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(input: NewChallenge): Promise<Challenge> {
    const challenge = buildChallenge(input);
    await db.challenges.add(challenge);
    // El creador entra automáticamente.
    await this.join(challenge.id, input.creatorId, input.creatorName);
    return challenge;
  }

  async remove(challengeId: string, userId: string): Promise<void> {
    const c = await db.challenges.get(challengeId);
    if (!c) return;
    if (c.creatorId !== userId) throw new Error('Solo el creador puede borrar el reto');
    const members = await db.challengeMembers.where('challengeId').equals(challengeId).toArray();
    await db.challengeMembers.bulkDelete(members.map((m) => [m.challengeId, m.userId] as [string, string]));
    await db.challenges.delete(challengeId);
  }

  async join(challengeId: string, userId: string, name: string): Promise<void> {
    await db.challengeMembers.put({
      challengeId,
      userId,
      name,
      progress: 0,
      joinedAt: new Date().toISOString(),
    });
  }

  async leave(challengeId: string, userId: string): Promise<void> {
    await db.challengeMembers.delete([challengeId, userId]);
  }

  async setProgress(challengeId: string, userId: string, progress: number): Promise<void> {
    await db.challengeMembers.update([challengeId, userId], { progress: Math.max(0, Math.round(progress)) });
  }

  async getMembers(challengeId: string): Promise<ChallengeMember[]> {
    const members = await db.challengeMembers.where('challengeId').equals(challengeId).toArray();
    return members.sort((a, b) => b.progress - a.progress || a.joinedAt.localeCompare(b.joinedAt));
  }

  async getJoined(userId: string): Promise<string[]> {
    const rows = await db.challengeMembers.where('userId').equals(userId).toArray();
    return rows.map((r) => r.challengeId);
  }
}

/** Un reto de ejemplo en modo local, para que la sección no salga vacía.
 *  Memoizado: en dev, StrictMode invoca los efectos dos veces; sin esto, dos
 *  siembras concurrentes chocarían. Idempotente (put) y tolerante a errores. */
let seedPromise: Promise<void> | null = null;
function ensureSeeded(): Promise<void> {
  seedPromise ??= doSeed();
  return seedPromise;
}
async function doSeed(): Promise<void> {
  try {
    if ((await db.challenges.count()) > 0) return;
    const now = new Date();
    const challenge: Challenge = {
      id: 'demo-reto-semana',
      title: 'Reto de la semana: entrena 4 días',
      description: 'A ver quién no falla. Cuenta cualquier sesión registrada.',
      goalDays: 4,
      startsAt: new Date(now.getTime() - 2 * DAY_MS).toISOString(),
      endsAt: new Date(now.getTime() + 5 * DAY_MS).toISOString(),
      creatorId: 'demo-acc-marta',
      creatorName: 'Marta R.',
      createdAt: new Date(now.getTime() - 2 * DAY_MS).toISOString(),
    };
    await db.challenges.put(challenge);
    await db.challengeMembers.bulkPut([
      { challengeId: challenge.id, userId: 'demo-acc-marta', name: 'Marta R.', progress: 3, joinedAt: challenge.createdAt },
      { challengeId: challenge.id, userId: 'demo-acc-alex', name: 'Álex G.', progress: 2, joinedAt: challenge.createdAt },
    ]);
  } catch {
    // Una carrera de siembra (StrictMode) no debe romper la carga del feed.
  }
}

import { isSupabaseEnabled, supabase } from '../supabase';
import { SupabaseChallengesRepository } from './supabaseChallengesRepo';

export const challengesRepo: ChallengesRepository =
  isSupabaseEnabled && supabase
    ? new SupabaseChallengesRepository(supabase)
    : new LocalChallengesRepository();
