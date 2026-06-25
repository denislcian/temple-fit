// CAPA 3 · Interfaz — Retos de la comunidad (opt-in).
// El progreso de cada reto se calcula con las sesiones LOCALES del usuario y se
// sube solo el número. Mini-ranking de participantes. Funciona en local y nube.
import { useCallback, useEffect, useState } from 'react';
import type { Account } from '../../data/authModels';
import type { ChallengeMember } from '../../data/challengeModels';
import { challengesRepo } from '../../data/repositories/challengesRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { daysLeft, trainingDaysInWindow } from '../../domain/challengeProgress';
import { localDateISO } from '../utils/format';
import { useAnnounce } from './Announcer';
import { AppDialog } from './AppDialog';
import { SelectField } from './Field';
import { useAsyncData } from '../hooks/useAsyncData';

export function ChallengesSection({ account }: { account: Account }) {
  const announce = useAnnounce();
  const today = localDateISO();
  const { data: challenges, reload } = useAsyncData(
    useCallback(() => challengesRepo.listActive(today), [today]),
  );
  const { data: sessions } = useAsyncData(useCallback(() => getAllSessions(), []));

  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [membersByCh, setMembersByCh] = useState<Record<string, ChallengeMember[]>>({});
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [goalDays, setGoalDays] = useState(4);

  const reloadJoined = useCallback(async () => {
    setJoined(new Set(await challengesRepo.getJoined(account.id)));
  }, [account.id]);
  useEffect(() => {
    void reloadJoined();
  }, [reloadJoined]);

  // Para cada reto: si participo, recalculo mi progreso (días entrenados en la
  // ventana) on-device y subo el número; luego cargo la clasificación.
  useEffect(() => {
    if (!challenges || !sessions) return;
    let alive = true;
    (async () => {
      const map: Record<string, ChallengeMember[]> = {};
      for (const c of challenges) {
        if (joined.has(c.id)) {
          const mine = trainingDaysInWindow(sessions, c.startsAt, c.endsAt);
          await challengesRepo.setProgress(c.id, account.id, mine).catch(() => {});
        }
        map[c.id] = await challengesRepo.getMembers(c.id);
      }
      if (alive) setMembersByCh(map);
    })();
    return () => {
      alive = false;
    };
  }, [challenges, sessions, joined, account.id]);

  async function join(id: string, titleStr: string) {
    await challengesRepo.join(id, account.id, account.displayName);
    await reloadJoined();
    await reload();
    announce(`Te uniste a "${titleStr}"`);
  }
  async function leave(id: string, titleStr: string) {
    await challengesRepo.leave(id, account.id);
    await reloadJoined();
    announce(`Saliste de "${titleStr}"`);
  }
  async function remove(id: string) {
    try {
      await challengesRepo.remove(id, account.id);
      await reload();
      announce('Reto borrado');
    } catch (e) {
      announce(e instanceof Error ? e.message : 'No se pudo borrar');
    }
  }
  async function create() {
    if (!title.trim()) {
      announce('Ponle un título al reto');
      return;
    }
    await challengesRepo.create({
      title: title.trim(),
      goalDays,
      creatorId: account.id,
      creatorName: account.displayName,
    });
    setTitle('');
    setGoalDays(4);
    setCreating(false);
    await reload();
    await reloadJoined();
    announce('Reto creado');
  }

  return (
    <section className="card" aria-labelledby="challenges-heading">
      <div className="btn-row" style={{ justifyContent: 'space-between' }}>
        <h2 id="challenges-heading" style={{ margin: 0 }}>
          🏆 Retos
        </h2>
        <button type="button" className="btn btn--small btn--primary" onClick={() => setCreating(true)}>
          + Crear reto
        </button>
      </div>

      {challenges && challenges.length === 0 && (
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          No hay retos activos. ¡Crea uno y reta a quien sigues!
        </p>
      )}

      {challenges?.map((c) => {
        const members = membersByCh[c.id] ?? [];
        const mine = members.find((m) => m.userId === account.id);
        const left = daysLeft(c.endsAt, today);
        const pct = mine ? Math.min(100, Math.round((mine.progress / c.goalDays) * 100)) : 0;
        return (
          <div key={c.id} className="card" style={{ background: 'var(--surface-2)', marginTop: '0.6rem' }}>
            <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>{c.title}</strong>
              {c.creatorId === account.id && (
                <button type="button" className="btn btn--small btn--danger" onClick={() => remove(c.id)}>
                  Borrar
                </button>
              )}
            </div>
            {c.description && <p className="meta">{c.description}</p>}
            <p className="meta num">
              Meta: {c.goalDays} días · {left === 0 ? 'último día' : `quedan ${left} días`} ·{' '}
              {members.length} {members.length === 1 ? 'participante' : 'participantes'}
            </p>

            {mine ? (
              <>
                <div className="goal-bar" style={{ marginTop: '0.4rem' }}>
                  <span className={`fill ${mine.progress >= c.goalDays ? 'met' : ''}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="meta num" style={{ marginTop: '0.3rem' }}>
                  Tu progreso: {mine.progress}/{c.goalDays}
                  {mine.progress >= c.goalDays ? ' 🎉 ¡completado!' : ''}
                </p>
                <div className="btn-row">
                  <button type="button" className="btn btn--small" onClick={() => leave(c.id, c.title)}>
                    Salir del reto
                  </button>
                </div>
              </>
            ) : (
              <div className="btn-row" style={{ marginTop: '0.4rem' }}>
                <button type="button" className="btn btn--small btn--primary" onClick={() => join(c.id, c.title)}>
                  Apuntarme
                </button>
              </div>
            )}

            <details style={{ marginTop: '0.5rem' }}>
              <summary className="btn btn--small btn--ghost">Clasificación ({members.length})</summary>
              <ul className="item-list">
                {members.map((m, i) => (
                  <li key={m.userId}>
                    <span className="num" style={{ width: '1.6rem', textAlign: 'right' }}>
                      {i + 1}.
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="title">{m.name}</span>
                    </div>
                    <span className="num">
                      {m.progress}/{c.goalDays} {m.progress >= c.goalDays ? '✅' : ''}
                    </span>
                  </li>
                ))}
                {members.length === 0 && <li className="muted">Aún no hay participantes.</li>}
              </ul>
            </details>
          </div>
        );
      })}

      <AppDialog open={creating} title="Crear un reto" onClose={() => setCreating(false)}>
        <div className="field">
          <label htmlFor="ch-title">Título del reto</label>
          <input
            id="ch-title"
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reto de la semana: entrena 4 días"
            maxLength={80}
          />
        </div>
        <SelectField label="Meta (días entrenando)" value={String(goalDays)} onChange={(v) => setGoalDays(Number(v))}>
          {[2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n} días
            </option>
          ))}
        </SelectField>
        <p className="hint">Dura 7 días desde hoy. Cuenta cualquier sesión que registres en Entrenar.</p>
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={create}>
            Crear reto
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setCreating(false)}>
            Cancelar
          </button>
        </div>
      </AppDialog>
    </section>
  );
}
