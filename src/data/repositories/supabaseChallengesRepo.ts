// CAPA 1 · Datos — Retos de la comunidad sobre Supabase (Postgres + RLS).
// Mismo contrato que la versión local. La privacidad/permiso los impone RLS:
// cualquiera autenticado ve los retos; solo tú editas tu fila de participación.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Challenge, ChallengeMember, NewChallenge } from '../challengeModels';
import type { ChallengesRepository } from './challengesRepo';

interface ChallengeRow {
  id: string;
  title: string;
  description: string | null;
  goal_days: number;
  starts_at: string;
  ends_at: string;
  creator: string;
  creator_name: string;
  created_at: string;
}

interface MemberRow {
  challenge_id: string;
  user_id: string;
  name: string;
  progress: number;
  joined_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toChallenge(r: ChallengeRow): Challenge {
  return {
    id: r.id,
    title: r.title,
    ...(r.description ? { description: r.description } : {}),
    goalDays: r.goal_days,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    creatorId: r.creator,
    creatorName: r.creator_name,
    createdAt: r.created_at,
  };
}

export class SupabaseChallengesRepository implements ChallengesRepository {
  constructor(private sb: SupabaseClient) {}

  private async uid(): Promise<string | null> {
    const { data } = await this.sb.auth.getUser();
    return data.user?.id ?? null;
  }

  async listActive(todayISO: string): Promise<Challenge[]> {
    const { data } = await this.sb
      .from('challenges')
      .select('id, title, description, goal_days, starts_at, ends_at, creator, creator_name, created_at')
      .gte('ends_at', todayISO.slice(0, 10))
      .order('created_at', { ascending: false })
      .limit(50);
    return ((data as ChallengeRow[] | null) ?? []).map(toChallenge);
  }

  async create(input: NewChallenge): Promise<Challenge> {
    const me = await this.uid();
    if (!me) throw new Error('Inicia sesión para crear un reto');
    const now = new Date();
    const duration = Math.max(1, Math.round(input.durationDays ?? 7));
    const { data, error } = await this.sb
      .from('challenges')
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        goal_days: Math.max(1, Math.round(input.goalDays)),
        starts_at: now.toISOString(),
        ends_at: new Date(now.getTime() + duration * DAY_MS).toISOString(),
        creator: me,
        creator_name: input.creatorName,
      })
      .select('id, title, description, goal_days, starts_at, ends_at, creator, creator_name, created_at')
      .single();
    if (error || !data) throw new Error('No se pudo crear el reto');
    const challenge = toChallenge(data as ChallengeRow);
    await this.join(challenge.id, me, input.creatorName);
    return challenge;
  }

  async remove(challengeId: string): Promise<void> {
    // RLS solo permite borrar al creador.
    const { error } = await this.sb.from('challenges').delete().eq('id', challengeId);
    if (error) throw new Error('No se pudo borrar el reto');
  }

  async join(challengeId: string, _userId: string, name: string): Promise<void> {
    const me = await this.uid();
    if (!me) throw new Error('Inicia sesión para unirte');
    await this.sb
      .from('challenge_members')
      .upsert({ challenge_id: challengeId, user_id: me, name, progress: 0 }, { onConflict: 'challenge_id,user_id' });
  }

  async leave(challengeId: string): Promise<void> {
    const me = await this.uid();
    if (!me) return;
    await this.sb.from('challenge_members').delete().eq('challenge_id', challengeId).eq('user_id', me);
  }

  async setProgress(challengeId: string, _userId: string, progress: number): Promise<void> {
    const me = await this.uid();
    if (!me) return;
    await this.sb
      .from('challenge_members')
      .update({ progress: Math.max(0, Math.round(progress)) })
      .eq('challenge_id', challengeId)
      .eq('user_id', me);
  }

  async getMembers(challengeId: string): Promise<ChallengeMember[]> {
    const { data } = await this.sb
      .from('challenge_members')
      .select('challenge_id, user_id, name, progress, joined_at')
      .eq('challenge_id', challengeId)
      .order('progress', { ascending: false });
    return ((data as MemberRow[] | null) ?? []).map((m) => ({
      challengeId: m.challenge_id,
      userId: m.user_id,
      name: m.name,
      progress: m.progress,
      joinedAt: m.joined_at,
    }));
  }

  async getJoined(userId: string): Promise<string[]> {
    const me = (await this.uid()) ?? userId;
    const { data } = await this.sb
      .from('challenge_members')
      .select('challenge_id')
      .eq('user_id', me);
    return ((data as { challenge_id: string }[] | null) ?? []).map((r) => r.challenge_id);
  }
}
