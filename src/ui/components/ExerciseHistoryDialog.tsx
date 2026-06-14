// CAPA 3 · Interfaz — Historial de un ejercicio concreto (estilo Hevy/Strong).
// Récords, volumen acumulado, progresión del 1RM (sparkline propio) y las
// sesiones recientes en las que apareció. Reutiliza el dominio existente.
import { useCallback } from 'react';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { computeRecords } from '../../domain/records';
import { exerciseProgression, exerciseStats } from '../../domain/stats';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatKg, formatShortDate } from '../utils/format';
import { AppDialog } from './AppDialog';
import { EmptyState } from './EmptyState';
import { Sparkline } from './Sparkline';

const TREND_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 20V4M4 20h16" strokeLinecap="round" />
    <path d="m7 14 4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ExerciseHistoryDialogProps {
  open: boolean;
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
}

export function ExerciseHistoryDialog({
  open,
  exerciseId,
  exerciseName,
  onClose,
}: ExerciseHistoryDialogProps) {
  const { data: sessions } = useAsyncData(useCallback(() => getAllSessions(), []));

  if (!sessions) {
    return (
      <AppDialog open={open} title={exerciseName} onClose={onClose}>
        <p className="muted" role="status">
          Cargando tu historial…
        </p>
      </AppDialog>
    );
  }

  const stats = exerciseStats(sessions, exerciseId);
  const progression = exerciseProgression(sessions, exerciseId);
  const record = computeRecords(sessions).get(exerciseId);

  return (
    <AppDialog open={open} title={exerciseName} onClose={onClose}>
      {stats.sessionCount === 0 ? (
        <EmptyState icon={TREND_ICON} title="Sin datos todavía">
          Cuando entrenes {exerciseName} y guardes la sesión, aquí verás tus récords y tu
          progresión.
        </EmptyState>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat">
              <span className="value num">{stats.sessionCount}</span>
              <span className="label">veces entrenado</span>
            </div>
            <div className="stat">
              <span className="value num">{stats.setCount}</span>
              <span className="label">series de trabajo</span>
            </div>
            {record && (
              <>
                <div className="stat">
                  <span className="value num">
                    {record.bestWeight.reps}×{formatKg(record.bestWeight.weightKg)}
                  </span>
                  <span className="label">mejor serie</span>
                </div>
                <div className="stat">
                  <span className="value num">{formatKg(record.best1RM.estimated1RM)}</span>
                  <span className="label">mejor 1RM estimado</span>
                </div>
              </>
            )}
            <div className="stat">
              <span className="value num">{Math.round(stats.totalVolumeKg).toLocaleString('es-ES')}</span>
              <span className="label">kg de volumen total</span>
            </div>
          </div>

          {progression.length >= 2 && (
            <div className="chart-block">
              <h3>Evolución del 1RM estimado</h3>
              <Sparkline
                values={progression.map((p) => p.best1RM)}
                label={`Progresión del 1RM estimado de ${exerciseName}: de ${formatKg(
                  progression[0]!.best1RM,
                )} a ${formatKg(progression[progression.length - 1]!.best1RM)} en ${progression.length} sesiones.`}
              />
            </div>
          )}

          <h3>Sesiones recientes</h3>
          <ul className="item-list">
            {[...progression].reverse().slice(0, 8).map((p) => (
              <li key={p.date}>
                <div>
                  <span className="title">{formatShortDate(`${p.date}T00:00:00.000Z`)}</span>
                  <br />
                  <span className="meta num">
                    mejor {formatKg(p.topWeightKg)} · 1RM {formatKg(p.best1RM)} · {Math.round(p.volumeKg)} kg
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="btn-row">
            <button type="button" className="btn" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </>
      )}
    </AppDialog>
  );
}
