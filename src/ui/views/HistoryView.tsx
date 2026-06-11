// CAPA 3 · Interfaz — Historial completo de sesiones, sin límite temporal
// (Hevy gratis lo recorta a ~3 meses; aquí tus datos son tuyos).
import { useCallback, useState } from 'react';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions, removeSession } from '../../data/repositories/sessionRepo';
import { sessionVolume } from '../../domain/volume';
import { useAnnounce } from '../components/Announcer';
import { ConfirmDialog } from '../components/AppDialog';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate, formatKg } from '../utils/format';

export function HistoryView() {
  const announce = useAnnounce();
  const { data: sessions, reload } = useAsyncData(useCallback(() => getAllSessions(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const [toDelete, setToDelete] = useState<string | null>(null);

  const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));

  return (
    <>
      <span className="kicker">Lo que ya has levantado</span>
      <h1 id="view-title" tabIndex={-1}>
        Historial
      </h1>

      {sessions && sessions.length === 0 && (
        <div className="card">
          <p>
            Todavía no hay entrenamientos guardados. Cuando termines tu primera sesión en{' '}
            <strong>Entrenar</strong>, aparecerá aquí.
          </p>
        </div>
      )}

      {(sessions ?? []).map((session) => {
        const totalSets = session.entries.reduce(
          (acc, e) => acc + e.sets.filter((s) => s.done).length,
          0,
        );
        return (
          <article key={session.id} className="card">
            <h2>{formatDate(session.date)}</h2>
            <p className="muted num">
              {totalSets} series completadas · {formatKg(sessionVolume(session))} de volumen
              {session.durationMin ? ` · ${session.durationMin} min` : ''}
            </p>
            <details>
              <summary className="btn btn--small btn--ghost">Ver detalle</summary>
              <ul className="item-list">
                {session.entries.map((entry) => (
                  <li key={entry.exerciseId}>
                    <div>
                      <span className="title">{nameById.get(entry.exerciseId) ?? entry.exerciseId}</span>
                      <br />
                      <span className="meta num">
                        {entry.sets
                          .map((s) => `${s.reps}×${formatKg(s.weightKg)}${s.done ? '' : ' (no completada)'}`)
                          .join(' · ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {session.notes && <p className="muted">Notas: {session.notes}</p>}
            </details>
            <div className="btn-row" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn--small btn--danger"
                onClick={() => setToDelete(session.id)}
              >
                Eliminar<span className="visually-hidden"> sesión del {formatDate(session.date)}</span>
              </button>
            </div>
          </article>
        );
      })}

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
