// CAPA 1 · Datos — Notificaciones (modo local + nube), mismo contrato.
import { db } from '../db';
import { newId } from '../models';
import type { Notification, NotificationKind } from '../notificationModels';

export interface NewNotification {
  userId: string;
  actorId: string;
  actorName: string;
  kind: NotificationKind;
  postId?: string;
}

export interface NotificationsRepository {
  list(userId: string): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markAllRead(userId: string): Promise<void>;
  /** Crea una notificación (la dispara la UI al seguir/dar like/comentar). */
  create(input: NewNotification): Promise<void>;
  /** Tiempo real: avisa cuando te llega una notificación. Devuelve una función
   *  para cancelar. Opcional (solo en la nube). */
  subscribe?(userId: string, onChange: () => void): () => void;
}

class LocalNotificationsRepository implements NotificationsRepository {
  async list(userId: string): Promise<Notification[]> {
    const rows = await db.notifications.where('userId').equals(userId).toArray();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40);
  }

  async countUnread(userId: string): Promise<number> {
    return db.notifications.where('userId').equals(userId).filter((n) => !n.read).count();
  }

  async markAllRead(userId: string): Promise<void> {
    await db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => !n.read)
      .modify({ read: true });
  }

  async create(input: NewNotification): Promise<void> {
    if (input.actorId === input.userId) return; // no te notificas a ti mismo
    await db.notifications.add({
      id: newId(),
      userId: input.userId,
      actorId: input.actorId,
      actorName: input.actorName,
      kind: input.kind,
      ...(input.postId ? { postId: input.postId } : {}),
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
}

import { isSupabaseEnabled, supabase } from '../supabase';
import { SupabaseNotificationsRepository } from './supabaseNotificationsRepo';

export const notificationsRepo: NotificationsRepository =
  isSupabaseEnabled && supabase
    ? new SupabaseNotificationsRepository(supabase)
    : new LocalNotificationsRepository();
