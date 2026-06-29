// CAPA 3 · Interfaz — Notificaciones (te siguen / like / comentario).
// Al abrirlas se marcan como leídas. Cada una enlaza al perfil del actor o al feed.
import { useCallback, useEffect, type ReactNode } from 'react';
import type { Notification } from '../../data/notificationModels';
import { notificationsRepo } from '../../data/repositories/notificationsRepo';
import { useAuth } from '../components/AuthContext';
import { Avatar } from '../components/Avatar';
import { BellIcon, CommentIcon, HeartIcon, UserIcon } from '../components/icons';
import { useAsyncData } from '../hooks/useAsyncData';

const timeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
function relativeTime(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return timeFormat.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return timeFormat.format(hours, 'hour');
  return timeFormat.format(Math.round(hours / 24), 'day');
}

const ICON: Record<Notification['kind'], ReactNode> = {
  follow: UserIcon,
  like: HeartIcon,
  comment: CommentIcon,
};

function describe(n: Notification): { text: string; href: string } {
  switch (n.kind) {
    case 'follow':
      return { text: `${n.actorName} empezó a seguirte`, href: `#/perfil/${encodeURIComponent(n.actorId)}` };
    case 'like':
      return { text: `A ${n.actorName} le gusta tu publicación`, href: '#/social' };
    case 'comment':
      return { text: `${n.actorName} comentó tu publicación`, href: '#/social' };
  }
}

export function NotificationsView() {
  const { account } = useAuth();
  const userId = account?.id ?? '';
  const { data: notifs, reload } = useAsyncData(
    useCallback(() => (userId ? notificationsRepo.list(userId) : Promise.resolve([])), [userId]),
  );

  // Al entrar, marca todo como leído (vacía el contador de la campana).
  useEffect(() => {
    if (userId) void notificationsRepo.markAllRead(userId);
  }, [userId]);

  // Tiempo real (solo en la nube): aparece sola cuando te llega una nueva.
  useEffect(() => {
    if (!userId) return;
    const off = notificationsRepo.subscribe?.(userId, () => {
      void reload();
      void notificationsRepo.markAllRead(userId);
    });
    return () => off?.();
  }, [userId, reload]);

  if (!account) {
    return (
      <>
        <h1 id="view-title" tabIndex={-1}>
          Notificaciones
        </h1>
        <p className="muted">Inicia sesión para ver tus notificaciones.</p>
      </>
    );
  }

  return (
    <>
      <div className="view-head">
        <a className="view-back" href="#/social" aria-label="Volver a Comunidad">
          <span aria-hidden="true">←</span>
        </a>
        <h1 id="view-title" tabIndex={-1}>
          Notificaciones
        </h1>
      </div>

      {notifs && notifs.length === 0 && (
        <p className="empty-state" role="status">
          <span className="empty-state__icon" aria-hidden="true">
            {BellIcon}
          </span>
          Aquí verás cuando alguien te siga, te dé me gusta o te comente.
        </p>
      )}

      <ul className="item-list notif-list">
        {(notifs ?? []).map((n) => {
          const { text, href } = describe(n);
          return (
            <li key={n.id} className={n.read ? '' : 'notif--unread'}>
              <a
                className="notif-avatar"
                href={`#/perfil/${encodeURIComponent(n.actorId)}`}
                aria-label={`Perfil de ${n.actorName}`}
              >
                <Avatar id={n.actorId} name={n.actorName} size={44} />
                <span className={`notif-kind notif-kind--${n.kind}`} aria-hidden="true">
                  {ICON[n.kind]}
                </span>
              </a>
              <a className="author-link notif-body" href={href}>
                <span className="notif-text">{text}</span>
                <span className="meta">{relativeTime(n.createdAt)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
