// CAPA 1 · Datos — Notificaciones de la comunidad.
// Se crean cuando alguien te sigue, te da me gusta o te comenta. El destinatario
// (userId) las lee y marca como leídas; el actor (actorId) es quien las provoca.

export type NotificationKind = 'follow' | 'like' | 'comment';

export interface Notification {
  id: string;
  /** Destinatario (a quién le llega). */
  userId: string;
  /** Quién la provocó. */
  actorId: string;
  actorName: string;
  kind: NotificationKind;
  /** Publicación relacionada (en like/comment). */
  postId?: string;
  read: boolean;
  createdAt: string;
}
