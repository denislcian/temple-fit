// CAPA 3 · Interfaz — Comunidad: publica tu rutina o tu sesión de hoy,
// recibe me gusta y comentarios. En modo local (demo) hasta la fase v2
// con Supabase (ver roadmap del informe técnico).
import { useCallback, useState } from 'react';
import { loadProfile } from '../../data/profile';
import type { Post } from '../../data/nutritionModels';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllRoutines } from '../../data/repositories/routineRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { socialRepo } from '../../data/repositories/socialRepo';
import { useAnnounce } from '../components/Announcer';
import { AppDialog, ConfirmDialog } from '../components/AppDialog';
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
  const announce = useAnnounce();
  const profile = loadProfile();
  const me = profile?.displayName ?? '';

  const { data: posts, reload } = useAsyncData(useCallback(() => socialRepo.getFeed(), []));
  const { data: routines } = useAsyncData(useCallback(() => getAllRoutines(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));

  const [publishing, setPublishing] = useState(false);
  const [postText, setPostText] = useState('');
  const [attach, setAttach] = useState('nada');
  const [toDelete, setToDelete] = useState<Post | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));

  async function publish() {
    if (!me) return;
    let kind: Post['kind'] = 'texto';
    let payload: { title: string; lines: string[] } | undefined;

    if (attach.startsWith('rutina:')) {
      const routine = routines?.find((r) => r.id === attach.slice('rutina:'.length));
      if (routine) {
        kind = 'rutina';
        payload = {
          title: routine.name,
          lines: routine.exerciseIds.map((id) => nameById.get(id) ?? id),
        };
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

    await socialRepo.publish({ author: me, text, kind, ...(payload ? { payload } : {}) });
    setPostText('');
    setAttach('nada');
    setPublishing(false);
    await reload();
    announce('Publicado en la comunidad');
  }

  async function like(post: Post) {
    const updated = await socialRepo.toggleLike(post.id);
    await reload();
    announce(
      updated?.likedByMe
        ? `Te gusta la publicación de ${post.author}`
        : `Ya no te gusta la publicación de ${post.author}`,
    );
  }

  async function comment(post: Post) {
    const text = (commentDrafts[post.id] ?? '').trim();
    if (!text || !me) return;
    await socialRepo.addComment(post.id, me, text);
    setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
    await reload();
    announce('Comentario publicado');
  }

  return (
    <>
      <span className="kicker">Entrena acompañado</span>
      <h1 id="view-title" tabIndex={-1}>
        Comunidad
      </h1>

      <p className="notice notice--success" role="note">
        Modo local de demostración: todo lo que publiques se queda en tu dispositivo. La fase en
        la nube (Supabase) del roadmap lo hará compartido de verdad, manteniendo lo privado como
        opción por defecto.
      </p>

      {!profile ? (
        <div className="card card--accent">
          <p>
            Para publicar necesitas un nombre: complétalo en <a href="#/ajustes">tu perfil</a>.
          </p>
        </div>
      ) : (
        <div className="btn-row" style={{ marginBottom: '1rem' }}>
          <button type="button" className="btn btn--primary" onClick={() => setPublishing(true)}>
            + Publicar
          </button>
        </div>
      )}

      {(posts ?? []).map((post) => (
        <article key={post.id} className="card" aria-label={`Publicación de ${post.author}`}>
          <p style={{ marginBottom: '0.25rem' }}>
            <strong>{post.author}</strong>{' '}
            <span className="muted">· {relativeTime(post.createdAt)}</span>
            {post.isDemo && (
              <span className="pr-badge badge--steel" style={{ marginLeft: '0.5rem' }}>
                ejemplo
              </span>
            )}
          </p>
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
                me gusta. {post.likedByMe ? 'Quitar tu me gusta' : 'Dar me gusta'} a la publicación
                de {post.author}
              </span>
            </button>
            {!post.isDemo && post.author === me && (
              <button
                type="button"
                className="btn btn--small btn--danger"
                onClick={() => setToDelete(post)}
              >
                Eliminar<span className="visually-hidden"> tu publicación</span>
              </button>
            )}
          </div>

          <details style={{ marginTop: '0.5rem' }}>
            <summary className="btn btn--small btn--ghost">
              Comentarios ({post.comments.length})
            </summary>
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
            {profile && (
              <div className="field" style={{ marginTop: '0.5rem' }}>
                <label htmlFor={`comment-${post.id}`}>Añadir comentario</label>
                <input
                  id={`comment-${post.id}`}
                  className="input"
                  type="text"
                  value={commentDrafts[post.id] ?? ''}
                  onChange={(e) =>
                    setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
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
            )}
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
          if (toDelete && me) {
            await socialRepo.removeOwnPost(toDelete.id, me);
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
