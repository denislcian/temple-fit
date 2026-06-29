// CAPA 3 · Interfaz — Comunidad: red social de fitness (modo local).
// Requiere cuenta. Publica con visibilidad (pública / solo seguidores /
// privada), sigue a otras personas y el feed respeta quién puede ver qué.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Account } from '../../data/authModels';
import type { Post, Visibility } from '../../data/nutritionModels';
import { VISIBILITY_LABELS } from '../../data/nutritionModels';
import { RECIPE_CATALOG } from '../../data/recipeCatalog';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllRoutines } from '../../data/repositories/routineRepo';
import { notificationsRepo } from '../../data/repositories/notificationsRepo';
import { authService } from '../../data/repositories/authRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { socialRepo } from '../../data/repositories/socialRepo';
import { isSupabaseEnabled } from '../../data/supabase';
import { visiblePosts } from '../../domain/feed';
import { hasLocation, isNearby, rankByProximity } from '../../domain/proximity';
import { detectLocation } from '../utils/geolocation';
import { useAnnounce } from '../components/Announcer';
import { AppDialog, ConfirmDialog } from '../components/AppDialog';
import { AuthScreen } from '../components/AuthScreen';
import { useAuth } from '../components/AuthContext';
import { Avatar } from '../components/Avatar';
import { ChallengesSection } from '../components/ChallengesSection';
import { BellIcon, CommentIcon, HeartIcon } from '../components/icons';
import { SelectField, TextAreaField } from '../components/Field';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatKg } from '../utils/format';
import { compressImage } from '../utils/image';

/** Filtros del feed por tipo de publicación. */
const FEED_FILTERS: Array<{ id: string; label: string; kinds: Post['kind'][] }> = [
  { id: 'todo', label: 'Todo', kinds: ['texto', 'rutina', 'sesion', 'receta', 'foto', 'sueno', 'meditacion'] },
  { id: 'fotos', label: 'Fotos', kinds: ['foto'] },
  { id: 'rutinas', label: 'Entrenos', kinds: ['rutina', 'sesion'] },
  { id: 'recetas', label: 'Recetas', kinds: ['receta'] },
  { id: 'recuperacion', label: 'Recuperación', kinds: ['sueno', 'meditacion'] },
];

/** Etiqueta (chip) del tipo de publicación, mostrada en la cabecera de la tarjeta. */
const KIND_LABEL: Partial<Record<Post['kind'], string>> = {
  rutina: 'Rutina',
  sesion: 'Sesión',
  receta: 'Receta',
  foto: 'Foto',
  sueno: 'Sueño',
  meditacion: 'Meditación',
};

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
  const { refresh } = useAuth();
  const me = account.displayName;
  const myId = account.id;

  const { data: posts, reload } = useAsyncData(useCallback(() => socialRepo.getFeed(), []));
  const { data: routines } = useAsyncData(useCallback(() => getAllRoutines(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const { data: discover, reload: reloadDiscover } = useAsyncData(
    useCallback(() => socialRepo.discoverAccounts(myId), [myId]),
  );
  const { data: unread, reload: reloadUnread } = useAsyncData(
    useCallback(() => notificationsRepo.countUnread(myId), [myId]),
  );

  const [following, setFollowing] = useState<Set<string>>(new Set());
  const reloadFollowing = useCallback(async () => {
    setFollowing(new Set(await socialRepo.getFollowing(myId)));
  }, [myId]);
  useEffect(() => {
    reloadFollowing();
  }, [reloadFollowing]);

  // Tiempo real (solo en la nube): el feed y el contador de notificaciones se
  // refrescan solos cuando alguien publica o te notifica.
  useEffect(() => {
    const offFeed = socialRepo.subscribeFeed?.(() => void reload());
    const offNotif = notificationsRepo.subscribe?.(myId, () => void reloadUnread());
    return () => {
      offFeed?.();
      offNotif?.();
    };
  }, [reload, reloadUnread, myId]);

  const [publishing, setPublishing] = useState(false);
  const [postText, setPostText] = useState('');
  const [attach, setAttach] = useState('nada');
  const [visibility, setVisibility] = useState<Visibility>('publica');
  const [toDelete, setToDelete] = useState<Post | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const toggleComments = (id: string) =>
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const [photo, setPhoto] = useState<string>('');
  const [feedFilter, setFeedFilter] = useState('todo');
  const [feedSource, setFeedSource] = useState<'todos' | 'siguiendo'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [geoBusy, setGeoBusy] = useState(false);
  const [onboardHidden, setOnboardHidden] = useState(
    () => localStorage.getItem('forjafit-social-onboard') === 'done',
  );
  const photoInput = useRef<HTMLInputElement>(null);

  // Sugerencias ordenadas por cercanía a mi ubicación (si la tengo).
  const rankedDiscover = useMemo(
    () => (discover ? rankByProximity(discover, account) : []),
    [discover, account],
  );
  const nearbyCount = useMemo(
    () => (hasLocation(account) ? rankedDiscover.filter((a) => isNearby(a, account)).length : 0),
    [rankedDiscover, account],
  );
  const showOnboard = !onboardHidden && following.size === 0;

  function dismissOnboard() {
    localStorage.setItem('forjafit-social-onboard', 'done');
    setOnboardHidden(true);
  }

  async function detectMyLocation() {
    setGeoBusy(true);
    try {
      const loc = await detectLocation();
      await authService.updateProfile(myId, {
        location: loc.city,
        ...(loc.lat != null ? { lat: loc.lat } : {}),
        ...(loc.lng != null ? { lng: loc.lng } : {}),
      });
      await refresh();
      await reloadDiscover();
      announce(loc.city ? `Ubicación: ${loc.city}. Mira quién entrena cerca.` : 'Ubicación detectada');
    } catch (e) {
      announce(e instanceof Error ? e.message : 'No se pudo obtener tu ubicación');
    } finally {
      setGeoBusy(false);
    }
  }

  // Búsqueda de personas (con debounce ligero).
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      void socialRepo.searchAccounts(q, myId).then(setSearchResults);
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, myId]);

  const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));
  const activeKinds = FEED_FILTERS.find((f) => f.id === feedFilter)?.kinds ?? [];

  async function onPhotoPicked(file: File) {
    const data = await compressImage(file, 1280, 0.8);
    if (data) {
      setPhoto(data);
      setAttach('foto');
    } else {
      announce('No se pudo procesar la imagen');
    }
  }
  const visibleFeed = visiblePosts(posts ?? [], myId, following);

  async function publish() {
    let kind: Post['kind'] = 'texto';
    let payload: { title: string; lines: string[] } | undefined;
    let image: string | undefined;

    if (attach.startsWith('rutina:')) {
      const routine = routines?.find((r) => r.id === attach.slice('rutina:'.length));
      if (routine) {
        kind = 'rutina';
        payload = { title: routine.name, lines: routine.exerciseIds.map((id) => nameById.get(id) ?? id) };
      }
    } else if (attach.startsWith('receta:')) {
      const recipe = RECIPE_CATALOG.find((r) => r.id === attach.slice('receta:'.length));
      if (recipe) {
        kind = 'receta';
        payload = {
          title: recipe.name,
          lines: [
            `${recipe.minutes} min · ${recipe.servings} ${recipe.servings === 1 ? 'ración' : 'raciones'} · ${recipe.kcal} kcal · ${recipe.proteinG} g proteína`,
            ...recipe.ingredients.map((i) => `${i.item} — ${i.amount}`),
          ],
        };
      }
    } else if (attach === 'foto' && photo) {
      kind = 'foto';
      image = photo;
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
    if (!text && !payload && !image) {
      announce('Escribe algo o adjunta una rutina, receta o foto antes de publicar');
      return;
    }

    await socialRepo.publish({
      author: me,
      authorId: myId,
      text,
      kind,
      visibility,
      ...(payload ? { payload } : {}),
      ...(image ? { image } : {}),
    });
    setPostText('');
    setAttach('nada');
    setPhoto('');
    setVisibility('publica');
    setPublishing(false);
    await reload();
    announce(`Publicado (${VISIBILITY_LABELS[visibility].toLowerCase()})`);
  }

  async function like(post: Post) {
    const updated = await socialRepo.toggleLike(post.id);
    await reload();
    if (updated?.likedByMe && post.authorId) {
      void notificationsRepo.create({
        userId: post.authorId,
        actorId: myId,
        actorName: me,
        kind: 'like',
        postId: post.id,
      });
    }
    announce(updated?.likedByMe ? `Te gusta la publicación de ${post.author}` : `Ya no te gusta`);
  }

  async function comment(post: Post) {
    const text = (commentDrafts[post.id] ?? '').trim();
    if (!text) return;
    await socialRepo.addComment(post.id, me, text);
    setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
    await reload();
    if (post.authorId) {
      void notificationsRepo.create({
        userId: post.authorId,
        actorId: myId,
        actorName: me,
        kind: 'comment',
        postId: post.id,
      });
    }
    announce('Comentario publicado');
  }

  async function toggleFollow(target: Account) {
    if (following.has(target.id)) {
      await socialRepo.unfollow(myId, target.id);
      announce(`Dejaste de seguir a ${target.displayName}`);
    } else {
      await socialRepo.follow(myId, target.id);
      void notificationsRepo.create({
        userId: target.id,
        actorId: myId,
        actorName: me,
        kind: 'follow',
      });
      announce(`Ahora sigues a ${target.displayName}`);
    }
    await reloadFollowing();
    await reload();
    await reloadDiscover();
  }

  const accountRow = (acc: Account) => (
    <li key={acc.id}>
      <a href={`#/perfil/${encodeURIComponent(acc.id)}`} aria-label={`Ver el perfil de ${acc.displayName}`}>
        <Avatar id={acc.id} name={acc.displayName} size={36} photoUrl={acc.avatarUrl} />
      </a>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a className="author-link" href={`#/perfil/${encodeURIComponent(acc.id)}`}>
          <span className="title">{acc.displayName}</span>
        </a>
        <br />
        <span className="meta">
          @{acc.username}
          {acc.bio ? ` · ${acc.bio}` : ''}
        </span>
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
  );

  const sourcedFeed =
    feedSource === 'siguiendo'
      ? visibleFeed.filter((p) => p.authorId === myId || (p.authorId ? following.has(p.authorId) : false))
      : visibleFeed;

  return (
    <>
      <span className="kicker">Entrena acompañado</span>
      <h1 id="view-title" tabIndex={-1}>
        Comunidad
      </h1>

      <div className="feed-layout">
        <div className="feed-main">
      <div className="card session-bar">
        <a href={`#/perfil/${encodeURIComponent(myId)}`} aria-label="Ver mi perfil">
          <Avatar id={myId} name={me} photoUrl={account.avatarUrl} />
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a className="author-link" href={`#/perfil/${encodeURIComponent(myId)}`}>
            <span className="title">{me}</span>
          </a>
          <br />
          <span className="meta">@{account.username}</span>
        </div>
        <a href="#/notificaciones" className="notif-bell" aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`}>
          <span className="notif-bell__icon" aria-hidden="true">{BellIcon}</span>
          {unread ? <span className="notif-badge num">{unread}</span> : null}
        </a>
        <button type="button" className="btn btn--small btn--ghost" onClick={onLogout}>
          Salir
        </button>
      </div>

      {!isSupabaseEnabled && (
        <p className="hint" role="note">
          Modo local de demostración: las cuentas y el feed viven en este dispositivo. La seguridad y
          la privacidad reales (servidor, políticas por fila) llegan con la fase en la nube — ver{' '}
          docs/SECURITY.md.
        </p>
      )}

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn--primary" onClick={() => setPublishing(true)}>
          + Publicar
        </button>
      </div>

      {showOnboard && (
        <section className="card onboard-card" aria-labelledby="onboard-heading">
          <h2 id="onboard-heading" style={{ marginTop: 0 }}>
            Encuentra a tu gente
          </h2>
          {hasLocation(account) ? (
            <p className="muted" style={{ marginBottom: 0 }}>
              {nearbyCount > 0
                ? `Hay ${nearbyCount} ${nearbyCount === 1 ? 'persona entrenando' : 'personas entrenando'} cerca de ti. Empieza siguiendo a alguien.`
                : 'Sigue a alguien de la lista para llenar tu feed.'}
            </p>
          ) : (
            <>
              <p className="muted">
                Activa tu ubicación y te mostramos quién entrena cerca de ti. Es opcional y se guarda
                aproximada (~1 km), nunca tu posición exacta.
              </p>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => void detectMyLocation()}
                  disabled={geoBusy}
                >
                  {geoBusy ? 'Buscando…' : 'Usar mi ubicación'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={dismissOnboard}>
                  Ahora no
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="card" aria-labelledby="search-heading">
        <h2 id="search-heading">Buscar personas</h2>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="user-search" className="visually-hidden">
            Buscar por nombre o usuario
          </label>
          <div className="search-field">
            <svg
              className="search-field__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.4-3.4" />
            </svg>
            <input
              id="user-search"
              className="input input--search"
              type="search"
              placeholder="Buscar por nombre o @usuario…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {searchQuery.trim() &&
          (searchResults.length > 0 ? (
            <ul className="item-list" style={{ marginTop: '0.75rem' }}>
              {searchResults.map(accountRow)}
            </ul>
          ) : (
            <p className="muted" role="status" style={{ marginTop: '0.5rem' }}>
              Sin resultados para «{searchQuery.trim()}».
            </p>
          ))}
      </section>

      {!searchQuery.trim() && rankedDiscover.length > 0 && (
        <section className="card discover-inline" aria-labelledby="discover-heading">
          <h2 id="discover-heading">
            {nearbyCount > 0 ? 'Cerca de ti' : 'Descubrir personas'}
          </h2>
          {nearbyCount > 0 && (
            <p className="meta" style={{ marginTop: 0 }}>
              Ordenadas por cercanía a {account.location || 'tu zona'}.
            </p>
          )}
          <ul className="item-list">{rankedDiscover.map(accountRow)}</ul>
        </section>
      )}

      <ChallengesSection account={account} />

      <div className="btn-row" role="group" aria-label="Fuente del feed" style={{ marginBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn btn--small ${feedSource === 'siguiendo' ? 'btn--primary' : 'btn--ghost'}`}
          aria-pressed={feedSource === 'siguiendo'}
          onClick={() => setFeedSource('siguiendo')}
        >
          Siguiendo
        </button>
        <button
          type="button"
          className={`btn btn--small ${feedSource === 'todos' ? 'btn--primary' : 'btn--ghost'}`}
          aria-pressed={feedSource === 'todos'}
          onClick={() => setFeedSource('todos')}
        >
          Descubrir
        </button>
      </div>

      <div className="btn-row feed-filter" role="group" aria-label="Filtrar el feed" style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {FEED_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn btn--small ${feedFilter === f.id ? 'btn--primary' : 'btn--ghost'}`}
            aria-pressed={feedFilter === f.id}
            onClick={() => setFeedFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sourcedFeed.filter((p) => activeKinds.includes(p.kind)).length === 0 && (
        <p className="muted" role="status">
          {feedSource === 'siguiendo'
            ? 'Aún no hay publicaciones de quien sigues. Sigue a alguien o pásate a Descubrir.'
            : 'No hay publicaciones de este tipo todavía.'}
        </p>
      )}

      {sourcedFeed
        .filter((p) => activeKinds.includes(p.kind))
        .map((post) => (
        <article key={post.id} className="card post-card" aria-label={`Publicación de ${post.author}`}>
          <header className="post-head">
            {post.authorId ? (
              <a href={`#/perfil/${encodeURIComponent(post.authorId)}`} aria-label={`Ver el perfil de ${post.author}`}>
                <Avatar id={post.authorId} name={post.author} size={42} photoUrl={post.authorAvatar} />
              </a>
            ) : (
              <Avatar id={post.id} name={post.author} size={42} photoUrl={post.authorAvatar} />
            )}
            <div className="post-head__id">
              {post.authorId ? (
                <a className="author-link" href={`#/perfil/${encodeURIComponent(post.authorId)}`}>
                  <strong>{post.author}</strong>
                </a>
              ) : (
                <strong>{post.author}</strong>
              )}
              <span className="post-head__meta">
                {relativeTime(post.createdAt)}
                {post.visibility && post.visibility !== 'publica' && (
                  <span className="post-tag">
                    {post.visibility === 'privada' ? 'Privada' : 'Seguidores'}
                  </span>
                )}
                {post.isDemo && <span className="post-tag">ejemplo</span>}
              </span>
            </div>
            {KIND_LABEL[post.kind] && <span className="post-kind">{KIND_LABEL[post.kind]}</span>}
          </header>

          {post.text && <p className="post-text">{post.text}</p>}

          {post.image && (
            <img className="post-photo" src={post.image} alt={`Foto de ${post.author}`} loading="lazy" />
          )}

          {post.payload && (
            <div className="post-payload">
              <h3 className="post-payload__title">{post.payload.title}</h3>
              <ul className="post-payload__lines">
                {post.payload.lines.map((line, i) => (
                  <li key={i} className="num">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="post-actions">
            <button
              type="button"
              className={`post-action${post.likedByMe ? ' is-liked' : ''}`}
              aria-pressed={post.likedByMe}
              onClick={() => like(post)}
            >
              <span className="post-action__icon" aria-hidden="true">{HeartIcon}</span>
              <span className="num">{post.likes}</span>
              <span className="visually-hidden">
                {' '}
                me gusta. {post.likedByMe ? 'Quitar tu me gusta' : 'Dar me gusta'} a la publicación de{' '}
                {post.author}
              </span>
            </button>
            <button
              type="button"
              className="post-action"
              aria-expanded={openComments.has(post.id)}
              onClick={() => toggleComments(post.id)}
            >
              <span className="post-action__icon" aria-hidden="true">{CommentIcon}</span>
              <span className="num">{post.comments.length}</span>
              <span className="visually-hidden"> comentarios</span>
            </button>
            {!post.isDemo && post.authorId === myId && (
              <button type="button" className="post-action post-action--danger" onClick={() => setToDelete(post)}>
                Eliminar<span className="visually-hidden"> tu publicación</span>
              </button>
            )}
          </div>

          {openComments.has(post.id) && (
            <div className="post-comments">
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
                <label htmlFor={`comment-${post.id}`} className="visually-hidden">
                  Añadir comentario
                </label>
                <input
                  id={`comment-${post.id}`}
                  className="input"
                  type="text"
                  placeholder="Escribe un comentario…"
                  value={commentDrafts[post.id] ?? ''}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') comment(post);
                  }}
                />
                <div className="btn-row" style={{ marginTop: '0.4rem' }}>
                  <button type="button" className="btn btn--small btn--primary" onClick={() => comment(post)}>
                    Comentar
                  </button>
                </div>
              </div>
            </div>
          )}
        </article>
      ))}
        </div>

        <aside className="feed-rail" aria-label="Tu perfil y sugerencias">
          <div className="card rail-profile">
            <a href={`#/perfil/${encodeURIComponent(myId)}`} aria-label="Ver mi perfil">
              <Avatar id={myId} name={me} size={64} photoUrl={account.avatarUrl} />
            </a>
            <a className="author-link" href={`#/perfil/${encodeURIComponent(myId)}`}>
              <strong>{me}</strong>
            </a>
            <span className="meta">@{account.username}</span>
            <a className="btn btn--small btn--block" href={`#/perfil/${encodeURIComponent(myId)}`}>
              Ver tu perfil
            </a>
            <div className="rail-profile__actions">
              <a
                href="#/notificaciones"
                className="notif-bell"
                aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`}
              >
                <span className="notif-bell__icon" aria-hidden="true">{BellIcon}</span>
                {unread ? <span className="notif-badge num">{unread}</span> : null}
              </a>
              <button type="button" className="btn btn--small btn--ghost" onClick={onLogout}>
                Salir
              </button>
            </div>
          </div>

          {rankedDiscover.length > 0 && (
            <div className="card">
              <h2 className="rail-heading">Atletas sugeridos</h2>
              <ul className="item-list">{rankedDiscover.slice(0, 5).map(accountRow)}</ul>
            </div>
          )}
        </aside>
      </div>

      <AppDialog open={publishing} title="Publicar en la comunidad" onClose={() => setPublishing(false)}>
        <TextAreaField
          label="¿Qué quieres contar?"
          value={postText}
          onChange={setPostText}
          hint="Tu entrenamiento de hoy, un récord, una duda…"
        />
        <fieldset className="post-options">
          <legend>Opciones</legend>
          <SelectField
            label="Adjuntar"
            value={attach}
          onChange={(v) => {
            setAttach(v);
            if (v !== 'foto') setPhoto('');
            if (v === 'foto') photoInput.current?.click();
          }}
        >
          <option value="nada">Nada, solo texto</option>
          <option value="foto">Una foto</option>
          <option value="ultima-sesion">Mi última sesión de entrenamiento</option>
          {(routines ?? []).map((r) => (
            <option key={r.id} value={`rutina:${r.id}`}>
              Rutina: {r.name}
            </option>
          ))}
          {RECIPE_CATALOG.map((r) => (
            <option key={r.id} value={`receta:${r.id}`}>
              Receta: {r.name}
            </option>
          ))}
        </SelectField>

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          className="visually-hidden"
          aria-label="Elegir foto"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPhotoPicked(file);
          }}
        />
        {photo && (
          <div className="photo-preview">
            <img src={photo} alt="Vista previa de la foto a publicar" />
            <button
              type="button"
              className="btn btn--small btn--ghost"
              onClick={() => {
                setPhoto('');
                setAttach('nada');
              }}
            >
              Quitar foto
            </button>
          </div>
        )}
        <SelectField
          label="¿Quién puede verla?"
          value={visibility}
          onChange={(v) => setVisibility(v as Visibility)}
        >
          <option value="publica">Pública — cualquiera</option>
          <option value="seguidores">Solo mis seguidores</option>
          <option value="privada">Privada — solo yo</option>
        </SelectField>
        </fieldset>
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
