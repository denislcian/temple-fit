// CAPA 3 · Interfaz — Perfil visitable de un usuario.
// Muestra su info, seguidores, stats reales (de sus datos en la nube) y sus
// publicaciones. Se llega tocando a alguien en la comunidad (#/perfil/<id>).
import { useCallback, useMemo, useState } from 'react';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { socialRepo } from '../../data/repositories/socialRepo';
import { useAnnounce } from '../components/Announcer';
import { useAuth } from '../components/AuthContext';
import { Avatar } from '../components/Avatar';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatKg } from '../utils/format';

const timeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
function relativeTime(iso: string): string {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return timeFormat.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return timeFormat.format(hours, 'hour');
  return timeFormat.format(Math.round(hours / 24), 'day');
}

export function ProfileView({ userId }: { userId: string }) {
  const announce = useAnnounce();
  const { account } = useAuth();
  const viewerId = account?.id ?? '';
  const targetId = userId || viewerId;

  const { data: profile, reload } = useAsyncData(
    useCallback(
      () => (viewerId ? socialRepo.getProfile(targetId, viewerId) : Promise.resolve(null)),
      [targetId, viewerId],
    ),
  );
  const { data: posts } = useAsyncData(
    useCallback(
      () => (viewerId ? socialRepo.getUserPosts(targetId, viewerId) : Promise.resolve([])),
      [targetId, viewerId],
    ),
  );
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const nameById = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e.name])), [exercises]);
  const [busy, setBusy] = useState(false);

  async function toggleFollow() {
    if (!profile || profile.isMe) return;
    setBusy(true);
    try {
      if (profile.isFollowing) {
        await socialRepo.unfollow(viewerId, profile.id);
        announce(`Dejaste de seguir a ${profile.displayName}`);
      } else {
        await socialRepo.follow(viewerId, profile.id);
        announce(`Ahora sigues a ${profile.displayName}`);
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (!account) {
    return (
      <>
        <h1 id="view-title" tabIndex={-1}>
          Perfil
        </h1>
        <p className="muted">Inicia sesión para ver perfiles.</p>
      </>
    );
  }

  if (profile === undefined) {
    return (
      <>
        <h1 id="view-title" tabIndex={-1}>
          Perfil
        </h1>
        <p className="muted" role="status">
          Cargando perfil…
        </p>
      </>
    );
  }

  if (profile === null) {
    return (
      <>
        <a className="btn btn--small btn--ghost" href="#/social">
          ← Comunidad
        </a>
        <h1 id="view-title" tabIndex={-1}>
          Perfil no encontrado
        </h1>
        <p className="muted">Esta persona no existe o ya no está disponible.</p>
      </>
    );
  }

  const s = profile.stats;

  return (
    <>
      <a className="btn btn--small btn--ghost" href="#/social">
        ← Comunidad
      </a>

      <section className="card profile-head" aria-labelledby="view-title">
        <Avatar id={profile.id} name={profile.displayName} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 id="view-title" tabIndex={-1} style={{ margin: 0 }}>
            {profile.displayName}
          </h1>
          <p className="meta" style={{ margin: '0.15rem 0 0' }}>
            @{profile.username} · {profile.followers}{' '}
            {profile.followers === 1 ? 'seguidor' : 'seguidores'}
          </p>
          {profile.bio && <p style={{ margin: '0.4rem 0 0' }}>{profile.bio}</p>}
        </div>
        {!profile.isMe && (
          <button
            type="button"
            className={`btn btn--small ${profile.isFollowing ? '' : 'btn--primary'}`}
            aria-pressed={profile.isFollowing}
            onClick={toggleFollow}
            disabled={busy}
          >
            {profile.isFollowing ? 'Siguiendo' : 'Seguir'}
          </button>
        )}
      </section>

      <div className="stat-grid">
        <div className="stat">
          <span className="value num">{s.sessions}</span>
          <span className="label">entrenamientos</span>
        </div>
        <div className="stat">
          <span className="value num">{Math.round(s.volumeKg).toLocaleString('es-ES')}</span>
          <span className="label">kg de volumen</span>
        </div>
        <div className="stat">
          <span className="value num">{s.streakWeeks}</span>
          <span className="label">semanas de racha</span>
        </div>
      </div>

      {s.bestLifts.length > 0 && (
        <section className="card" aria-labelledby="best-heading">
          <h2 id="best-heading">Mejores marcas</h2>
          <ul className="item-list">
            {s.bestLifts.map((b) => (
              <li key={b.exerciseId}>
                <div style={{ flex: 1 }}>
                  <span className="title">{nameById.get(b.exerciseId) ?? b.exerciseId}</span>
                </div>
                <span className="num">1RM {formatKg(b.est1RM)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 style={{ marginTop: '1.25rem' }}>
        Publicaciones {posts ? <span className="muted num">· {posts.length}</span> : null}
      </h2>
      {posts && posts.length === 0 && <p className="muted">Aún no ha publicado nada visible.</p>}
      {posts?.map((post) => (
        <article key={post.id} className="card" aria-label={`Publicación de ${post.author}`}>
          <p className="meta" style={{ marginTop: 0 }}>
            {relativeTime(post.createdAt)}
          </p>
          {post.text && <p>{post.text}</p>}
          {post.image && (
            <img className="post-photo" src={post.image} alt={`Foto de ${post.author}`} loading="lazy" />
          )}
          {post.payload && (
            <div className="card" style={{ background: 'var(--surface-2)', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', margin: '0 0 0.3rem' }}>{post.payload.title}</h3>
              <ul>
                {post.payload.lines.map((line, i) => (
                  <li key={i} className="num">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="meta">
            <span aria-hidden="true">❤️</span> {post.likes} · 💬 {post.comments.length}
          </p>
        </article>
      ))}
    </>
  );
}
