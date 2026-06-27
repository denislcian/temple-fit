// CAPA 1 · Datos — Notificaciones sobre Supabase (Postgres + RLS).
// Lees/gestionas SOLO las tuyas; al crear una, te marcas como actor (RLS).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Notification } from '../notificationModels';
import type { NewNotification, NotificationsRepository } from './notificationsRepo';

interface NotifRow {
  id: string;
  user_id: string;
  actor: string;
  actor_name: string;
  kind: Notification['kind'];
  post_id: string | null;
  read: boolean;
  created_at: string;
}

export class SupabaseNotificationsRepository implements NotificationsRepository {
  constructor(private sb: SupabaseClient) {}

  async list(userId: string): Promise<Notification[]> {
    const { data } = await this.sb
      .from('notifications')
      .select('id, user_id, actor, actor_name, kind, post_id, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);
    return ((data as NotifRow[] | null) ?? []).map((n) => ({
      id: n.id,
      userId: n.user_id,
      actorId: n.actor,
      actorName: n.actor_name,
      kind: n.kind,
      ...(n.post_id ? { postId: n.post_id } : {}),
      read: n.read,
      createdAt: n.created_at,
    }));
  }

  async countUnread(userId: string): Promise<number> {
    const { count } = await this.sb
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    return count ?? 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.sb
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  }

  async create(input: NewNotification): Promise<void> {
    if (input.actorId === input.userId) return;
    try {
      await this.sb.from('notifications').insert({
        user_id: input.userId,
        actor: input.actorId,
        actor_name: input.actorName,
        kind: input.kind,
        post_id: input.postId ?? null,
      });
    } catch {
      // Una notificación que no se crea no debe romper la acción que la dispara.
    }
  }
}
