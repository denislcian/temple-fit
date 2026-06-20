// CAPA 3 · Interfaz — Historial completo de sesiones, sin límite temporal
// (Hevy gratis lo recorta a ~3 meses; aquí tus datos son tuyos).
import { useCallback, useState } from 'react';
import type { Session } from '../../data/models';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions, removeSession } from '../../data/repositories/sessionRepo';
import { totals } from '../../domain/stats';
import { sessionVolume } from '../../domain/volume';
import { useAnnounce } from '../components/Announcer';
import { ConfirmDialog } from '../components/AppDialog';
import { EmptyState } from '../components/EmptyState';
import { SelectField } from '../components/Field';
import { RepeatIcon, TrashIcon } from '../components/icons';
import { useAsyncData } from '../hooks/useAsyncData';
import { draftFromSession, hasActiveDraft, saveDraft } from '../trainDraft';
import { formatDate, formatKg, formatMonthYear } from '../utils/format';

const HISTORY_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" strokeLinecap="round" />
  </svg>
);

interface MonthGroup {
  key: string;
  label: string;
  sessions: Session[];
}

/** Agrupa sesiones (ya ordenadas de más reciente a más antigua) por mes. */
function groupByMonth(sessions: Session[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const session of sessions) {
    const key = session.date.slice(0, 7); // YYYY-MM
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.sessions.push(session);
    } else {
      const label = formatMonthYear(session.date);
      groups.push({
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        sessions: [session],
      });
    }
  }
  return groups;
}

export function HistoryView() {
  const announce = useAnnounce();
  const { data: sessions, reload } = useAsyncData(useCallback(() => getAllSessions(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [filterExercise, setFilterExercise] = useState('');

  const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));

  // Ejercicios que aparecen en el historial (para el desplegable de filtro).
  const trainedIds = new Set((sessions ?? []).flatMap((s) => s.entries.map((e) => e.exerciseId)));
  const trainedExercises = (exercises ?? []).filter((e) => trainedIds.has(e.id));

  const visibleSessions = (sessions ?? []).filter(
    (s) => !filterExercise || s.entries.some((e) => e.exerciseId === filterExercise),
  );

  function repeatSession(session: Session) {
    if (hasActiveDraft()) {
      announce('Ya tienes un entrenamiento en curso. Termínalo o descártalo antes de repetir otro.');
      return;
    }
    saveDraft(draftFromSession(session, new Date().toISOString()));
    announce('Entrenamiento preparado con los ejercicios de esa sesión.');
    window.location.hash = '#/entrenar';
  }

  return (
    <>
      <span className="kicker">Lo que ya has levantado</span>
      <h1 id="view-title" tabIndex={-1}>
        Historial
      </h1>

      {sessions && sessions.length > 0 && (() => {
        const total = totals(sessions);
        const totalMin = sessions.reduce((acc, s) => acc + (s.durationMin ?? 0), 0);
        const timeLabel =
          totalMin >= 60 ? `${Math.round(totalMin / 60)} h` : `${totalMin} min`;
        return (
          <div className="stat-grid" aria-label="Resumen de tu historial">
            <div className="stat">
              <span className="value num">{total.sessions}</span>
              <span className="label">
                {total.sessions === 1 ? 'entrenamiento en total' : 'entrenamientos en total'}
              </span>
            </div>
            <div className="stat">
              <span className="value num">
                {Math.round(total.volumeKg).toLocaleString('es-ES')}
              </span>
              <span className="label">kg movidos en total</span>
            </div>
            <div className="stat">
              <span className="value num">{timeLabel}</span>
              <span className="label">entrenando</span>
            </div>
          </div>
        );
      })()}

      {sessions && sessions.length === 0 && (
        <EmptyState
          icon={HISTORY_ICON}
          title="Aún no hay historial"
          action={
            <a className="btn btn--primary" href="#/entrenar">
              Empezar a entrenar
            </a>
          }
        >
          Cuando termines tu primera sesión en Entrenar, aparecerá aquí con su volumen, duración y
          el detalle de cada serie.
        </EmptyState>
      )}

      {trainedExercises.length > 1 && (
        <div className="card">
          <SelectField
            label="Filtrar por ejercicio"
            value={filterExercise}
            onChange={setFilterExercise}
          >
            <option value="">Todos los ejercicios</option>
            {trainedExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      {sessions && sessions.length > 0 && visibleSessions.length === 0 && (
        <p className="muted" role="status">
          No hay sesiones con {nameById.get(filterExercise) ?? 'ese ejercicio'} en el historial.
        </p>
      )}

      {groupByMonth(visibleSessions).map((group) => (
        <section key={group.key} className="history-month" aria-label={group.label}>
          <h2 className="month-heading">{group.label}</h2>
          {group.sessions.map((session) => {
            const totalSets = session.entries.reduce(
              (acc, e) => acc + e.sets.filter((s) => s.done).length,
              0,
            );
            return (
              <article key={session.id} className="card">
                <h3>{formatDate(session.date)}</h3>
                <p className="muted num">
                  {totalSets} {totalSets === 1 ? 'serie completada' : 'series completadas'} ·{' '}
                  {formatKg(sessionVolume(session))} de volumen
                  {session.durationMin ? ` · ${session.durationMin} min` : ''}
                </p>
                <details>
                  <summary className="btn btn--small btn--ghost">Ver detalle</summary>
                  <ul className="item-list">
                    {session.entries.map((entry) => (
                      <li key={entry.exerciseId}>
                        <div>
                          <span className="title">
                            {nameById.get(entry.exerciseId) ?? entry.exerciseId}
                          </span>
                          <br />
                          <span className="meta num">
                            {entry.sets
                              .map(
                                (s) =>
                                  `${s.reps}×${formatKg(s.weightKg)}${s.done ? '' : ' (no completada)'}`,
                              )
                              .join(' · ')}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {session.notes && <p className="muted">Notas: {session.notes}</p>}
                </details>
                <div className="row-actions" style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => repeatSession(session)}
                    title="Repetir"
                    aria-label={`Repetir la sesión del ${formatDate(session.date)}`}
                  >
                    {RepeatIcon}
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => setToDelete(session.id)}
                    title="Eliminar"
                    aria-label={`Eliminar la sesión del ${formatDate(session.date)}`}
                  >
                    {TrashIcon}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ))}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar esta sesión?"
        description="La sesión se borrará del historial de forma permanente. Puedes exportar tus datos antes desde Ajustes."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => {
          if (toDelete) {
            await removeSession(toDelete);
            await reload();
            announce('Sesión eliminada del historial');
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
