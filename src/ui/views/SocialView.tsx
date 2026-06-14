// CAPA 3 · Interfaz — Comunidad: red social de fitness (modo local).
// Requiere cuenta. Publica con visibilidad (pública / solo seguidores /
// privada), sigue a otras personas y el feed respeta quién puede ver qué.
import { useCallback, useEffect, useState } from 'react';
import type { Account } from '../../data/authModels';
import type { Post, Visibility } from '../../data/nutritionModels';
import { VISIBILITY_LABELS } from '../../data/nutritionModels';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllRoutines } from '../../data/repositories/routineRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { socialRepo } from '../../data/repositories/socialRepo';
import { visiblePosts } from '../../domain/feed';
import { useAnnounce } from '../components/Announcer';
import { AppDialog, ConfirmDialog } from '../components/AppDialog';
import { AuthScreen } from '../components/AuthScreen';
import { useAuth } from '../components/AuthContext';
import { Avatar } from '../components/Avatar';
import { SelectField, TextAreaField } from '../components/Field';
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

export function SocialView() {
  const { account, loading, logout } = useAuth();

  if (loading) {
    return (
      <>
        <h1 id="view-title" tabIndex={-1}>
          Comunidad
        </h1>
        <p className="muted" role="status">
          Comprobando tu sesión…
        </p>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <span className="kicker">Entrena acompañado</span>
        <h1 id="view-title" tabIndex={-1}>
          Comunidad
        </h1>
        <p className="muted" style={{ textAlign: 'center', maxWidth: '26rem', margin: '0 auto 1rem' }}>
          Crea tu cuenta o inicia sesión para publicar tus entrenamientos, seguir a otras personas y
          decidir quién ve cada cosa.
        </p>
        <AuthScreen />
      </>
    );
  }

  return <Feed account={account} onLogout={logout} />;
}

function Feed({ account, onLogout }: { account: Account; onLogout: () => void }) {
  const announce = useAnnounce();
  const me = account.displayName;
  const myId = account.id;

  const { data: posts, reload } = useAsyncData(useCallback(() => socialRepo.getFeed(), []));
  const { data: routines } = useAsyncData(useCallback(() => getAllRoutines(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const { data: discover, reload: reloadDiscover } = useAsyncData(
    useCallback(() => socialRepo.discoverAccounts(myId), [myId]),
  );

  const [following, setFollowing] = useState<Set<string>>(new Set());
  const reloadFollowing = useCallback(async () => {
    setFollowing(new Set(await socialRepo.getFollowing(myId)));
  }, [myId]);
  useEffect(() => {
    reloadFollowing();
  }, [reloadFollowing]);

  const [publishing, setPublishing] = useState(false);
  const [postText, setPostText] = useState('');
  const [attach, setAttach] = useState('nada');
  const [visibility, setVisibility] = useState<Visibility>('publica');
  const [toDelete, setToDelete] = useState<Post | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));
  const visibleFeed = visiblePosts(posts ?? [], myId, following);

  async function publish() {
    let kind: Post['kind'] = 'texto';
    let payload: { title: string; lines: string[] } | undefined;

    if (attach.startsWith('rutina:')) {
      const routine = routines?.find((r) => r.id === attach.slice('rutina:'.length));
      if (routine) {
        kind = 'rutina';
        payload = { title: routine.name, lines: routine.exerciseIds.map((id) => nameById.get(id) ?? id) };
      }
    } else if (attach === 'ultima-sesion') {
      const sessions = await getAllSessions();
      const last = sessions[0];
      if (last) {
        kind = 'sesion';
        payload = {
          title: 'Mi última sesión',
          lines: last.entries.map((entry) => {
            const sets = entry.sets.filter((s) => s.done);
            const top = sets.reduce((a, s) => Math.max(a, s.weightKg), 0);
            return `${nameById.get(entry.exerciseId) ?? entry.exerciseId} — ${sets.length} series · mejor ${formatKg(top)}`;
          }),
        };
      }
    }

    const text = postText.trim();
    if (!text && !payload) {
      announce('Escribe algo o adjunta una rutina antes de publicar');
      return;
    }

    await socialRepo.publish({ author: me, authorId: myId, text, kind, visibility, ...(payload ? { payload } : {}) });
    setPostText('');
    setAttach('nada');
    setVisibility('publica');
    setPublishing(false);
    await reload();
    announce(`Publicado (${VISIBILITY_LABELS[visibility].toLowerCase()})`);
  }

  async function like(post: Post) {
    const updated = await socialRepo.toggleLike(post.id);
    await reload();
    announce(updated?.likedByMe ? `Te gusta la publicación de ${post.author}` : `Ya no te gusta`);
  }

  async function comment(post: Post) {
    const text = (commentDrafts[post.id] ?? '').trim();
    if (!text) return;
    await socialRepo.addComment(post.id, me, text);
    setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
    await reload();
    announce('Comentario publicado');
  }

  async function toggleFollow(target: Account) {
    if (following.has(target.id)) {
      await socialRepo.unfollow(myId, target.id);
      announce(`Dejaste de seguir a ${target.displayName}`);
    } else {
      await socialRepo.follow(myId, target.id);
      announce(`Ahora sigues a ${target.displayName}`);
    }
    await reloadFollowing();
    await reload();
    await reloadDiscover();
  }

  return (
    <>
      <span className="kicker">Entrena acompañado</span>
      <h1 id="view-title" tabIndex={-1}>
        Comunidad
      </h1>

      <div className="card session-bar">
        <Avatar id={myId} name={me} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="title">{me}</span>
          <br />
          <span className="meta">@{account.username}</span>
        </div>
        <button type="button" className="btn btn--small btn--ghost" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>

      <p className="hint" role="note">
        Modo local de demostración: las cuentas y el feed viven en este dispositivo. La seguridad y
        la privacidad reales (servidor, políticas por fila) llegan con la fase en la nube — ver{' '}
        docs/SECURITY.md.
      </p>

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn--primary" onClick={() => setPublishing(true)}>
          + Publicar
        </button>
      </div>

      {discover && discover.length > 0 && (
        <section className="card" aria-labelledby="discover-heading">
          <h2 id="discover-heading">Descubrir personas</h2>
          <ul className="item-list">
            {discover.map((acc) => (
              <li key={acc.id}>
                <Avatar id={acc.id} name={acc.displayName} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="title">{acc.displayName}</span>
                  <br />
                  <span className="meta">@{acc.username}{acc.bio ? ` · ${acc.bio}` : ''}</span>
                </div>
                <button
                  type="button"
                  className={`btn btn--small ${following.has(acc.id) ? '' : 'btn--primary'}`}
                  aria-pressed={following.has(acc.id)}
                  onClick={() => toggleFollow(acc)}
                >
                  {following.has(acc.id) ? 'Siguiendo' : 'Seguir'}
                  <span className="visually-hidden"> a {acc.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visibleFeed.map((post) => (
        <article key={post.id} className="card" aria-label={`Publicación de ${post.author}`}>
          <div className="post-head">
            <Avatar id={post.authorId ?? post.id} name={post.author} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{post.author}</strong>{' '}
              <span className="muted">· {relativeTime(post.createdAt)}</span>
              {post.visibility && post.visibility !== 'publica' && (
                <span className="pr-badge badge--steel" style={{ marginLeft: '0.4rem' }}>
                  {post.visibility === 'privada' ? 'privada' : 'seguidores'}
                </span>
              )}
              {post.isDemo && (
                <span className="pr-badge badge--steel" style={{ marginLeft: '0.4rem' }}>
                  ejemplo
                </span>
              )}
            </div>
          </div>
          {post.text && <p>{post.text}</p>}

          {post.payload && (
            <div className="card" style={{ background: 'var(--surface-2)', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem' }}>{post.payload.title}</h2>
              <ul>
                {post.payload.lines.map((line, i) => (
                  <li key={i} className="num">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="btn-row">
            <button
              type="button"
              className={`btn btn--small ${post.likedByMe ? 'btn--primary' : ''}`}
              aria-pressed={post.likedByMe}
              onClick={() => like(post)}
            >
              <span aria-hidden="true">{post.likedByMe ? '❤️' : '🤍'}</span> {post.likes}
              <span className="visually-hidden">
                {' '}
                me gusta. {post.likedByMe ? 'Quitar tu me gusta' : 'Dar me gusta'} a la publicación de{' '}
                {post.author}
              </span>
            </button>
            {!post.isDemo && post.authorId === myId && (
              <button type="button" className="btn btn--small btn--danger" onClick={() => setToDelete(post)}>
                Eliminar<span className="visually-hidden"> tu publicación</span>
              </button>
            )}
          </div>

          <details style={{ marginTop: '0.5rem' }}>
            <summary className="btn btn--small btn--ghost">Comentarios ({post.comments.length})</summary>
            <ul className="item-list">
              {post.comments.map((c) => (
                <li key={c.id}>
                  <div>
                    <span className="title">{c.author}</span>{' '}
                    <span className="muted">· {relativeTime(c.createdAt)}</span>
                    <br />
                    {c.text}
                  </div>
                </li>
              ))}
              {post.comments.length === 0 && <li className="muted">Sé el primero en comentar.</li>}
            </ul>
            <div className="field" style={{ marginTop: '0.5rem' }}>
              <label htmlFor={`comment-${post.id}`}>Añadir comentario</label>
              <input
                id={`comment-${post.id}`}
                className="input"
                type="text"
                value={commentDrafts[post.id] ?? ''}
                onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') comment(post);
                }}
              />
              <div className="btn-row" style={{ marginTop: '0.4rem' }}>
                <button type="button" className="btn btn--small" onClick={() => comment(post)}>
                  Comentar
                </button>
              </div>
            </div>
          </details>
        </article>
      ))}

      <AppDialog open={publishing} title="Publicar en la comunidad" onClose={() => setPublishing(false)}>
        <TextAreaField
          label="¿Qué quieres contar?"
          value={postText}
          onChange={setPostText}
          hint="Tu entrenamiento de hoy, un récord, una duda…"
        />
        <SelectField label="Adjuntar" value={attach} onChange={setAttach}>
          <option value="nada">Nada, solo texto</option>
          <option value="ultima-sesion">Mi última sesión de entrenamiento</option>
          {(routines ?? []).map((r) => (
            <option key={r.id} value={`rutina:${r.id}`}>
              Rutina: {r.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="¿Quién puede verla?"
          value={visibility}
          onChange={(v) => setVisibility(v as Visibility)}
        >
          <option value="publica">Pública — cualquiera</option>
          <option value="seguidores">Solo mis seguidores</option>
          <option value="privada">Privada — solo yo</option>
        </SelectField>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={publish}>
            Publicar
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setPublishing(false)}>
            Cancelar
          </button>
        </div>
      </AppDialog>

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar tu publicación?"
        description="Se borrará del feed de forma permanente."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => {
          if (toDelete) {
            await socialRepo.removeOwnPost(toDelete.id, myId);
            await reload();
            announce('Publicación eliminada');
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
