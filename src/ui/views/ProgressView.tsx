// CAPA 3 · Interfaz — Progreso: la analítica que los comerciales cobran.
// Cada gráfica sigue el patrón accesible de tres capas (ver ChartBlock).
import { useCallback, useMemo, useState } from 'react';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { computeRecords } from '../../domain/records';
import { exerciseProgression, summarizeProgress, totals } from '../../domain/stats';
import { weeklyVolume } from '../../domain/volume';
import { ChartBlock } from '../components/ChartBlock';
import { ProgressionChart } from '../components/charts/ProgressionChart';
import { VolumeChart } from '../components/charts/VolumeChart';
import { SelectField } from '../components/Field';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatKg, formatShortDate } from '../utils/format';

export default function ProgressView() {
  const { data: sessions } = useAsyncData(useCallback(() => getAllSessions(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const [selectedExercise, setSelectedExercise] = useState('');

  const trainedExercises = useMemo(() => {
    if (!sessions || !exercises) return [];
    const trainedIds = new Set(
      sessions.flatMap((s) =>
        s.entries.filter((e) => e.sets.some((set) => set.done)).map((e) => e.exerciseId),
      ),
    );
    return exercises.filter((e) => trainedIds.has(e.id));
  }, [sessions, exercises]);

  const exerciseId = selectedExercise || trainedExercises[0]?.id || '';
  const exerciseName = trainedExercises.find((e) => e.id === exerciseId)?.name ?? '';

  if (!sessions || !exercises) {
    return (
      <>
        <h1 id="view-title" tabIndex={-1}>
          Progreso
        </h1>
        <p className="muted">Cargando tus datos…</p>
      </>
    );
  }

  if (sessions.length === 0) {
    return (
      <>
        <span className="kicker">Los números de tu esfuerzo</span>
        <h1 id="view-title" tabIndex={-1}>
          Progreso
        </h1>
        <div className="card">
          <p>
            Aquí verás tu volumen semanal, tus récords personales y la evolución de tu 1RM estimado
            en cada ejercicio. Guarda tu primer entrenamiento para empezar.
          </p>
        </div>
      </>
    );
  }

  const total = totals(sessions);
  const weekly = weeklyVolume(sessions);
  const weeklySummary = summarizeProgress(weekly.map((w) => w.volumeKg));
  const records = computeRecords(sessions);

  const progression = exerciseId ? exerciseProgression(sessions, exerciseId) : [];
  const rmSummary = summarizeProgress(progression.map((p) => p.best1RM));
  const record = records.get(exerciseId);

  return (
    <>
      <span className="kicker">Los números de tu esfuerzo</span>
      <h1 id="view-title" tabIndex={-1}>
        Progreso
      </h1>

      <div className="stat-grid">
        <div className="stat">
          <span className="value">{total.sessions}</span>
          <span className="label">entrenamientos</span>
        </div>
        <div className="stat">
          <span className="value">{total.sets}</span>
          <span className="label">series completadas</span>
        </div>
        <div className="stat">
          <span className="value">{total.reps.toLocaleString('es-ES')}</span>
          <span className="label">repeticiones</span>
        </div>
        <div className="stat">
          <span className="value">{Math.round(total.volumeKg).toLocaleString('es-ES')}</span>
          <span className="label">kg de volumen total</span>
        </div>
      </div>

      <div className="card">
        <ChartBlock
          title="Volumen semanal"
          summary={
            weeklySummary && weeklySummary.points > 1
              ? `Tu volumen semanal pasó de ${formatKg(weeklySummary.firstValue)} a ${formatKg(
                  weeklySummary.lastValue,
                )} (${weeklySummary.deltaPct !== null ? `${weeklySummary.deltaPct > 0 ? '+' : ''}${weeklySummary.deltaPct}%` : 'desde cero'}) en ${weeklySummary.points} semanas.`
              : `Volumen de tu primera semana registrada: ${formatKg(weekly[0]?.volumeKg ?? 0)}.`
          }
          tableHeaders={['Semana del', 'Volumen (kg)']}
          tableRows={weekly.map((w) => [
            formatShortDate(`${w.weekStart}T00:00:00.000Z`),
            Math.round(w.volumeKg).toLocaleString('es-ES'),
          ])}
        >
          <VolumeChart data={weekly} />
        </ChartBlock>
      </div>

      {trainedExercises.length > 0 && (
        <div className="card">
          <SelectField label="Progresión por ejercicio" value={exerciseId} onChange={setSelectedExercise}>
            {trainedExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </SelectField>

          {record && (
            <p className="chart-summary">
              <strong>Récords de {exerciseName}:</strong> mejor serie{' '}
              <span className="num">
                {record.bestWeight.reps}×{formatKg(record.bestWeight.weightKg)}
              </span>{' '}
              · mejor 1RM estimado <span className="num">{formatKg(record.best1RM.estimated1RM)}</span>{' '}
              (fórmulas de Epley y Brzycki).
            </p>
          )}

          <ChartBlock
            title={`Evolución de ${exerciseName}`}
            summary={
              rmSummary && rmSummary.points > 1
                ? `Tu 1RM estimado en ${exerciseName} pasó de ${formatKg(rmSummary.firstValue)} a ${formatKg(
                    rmSummary.lastValue,
                  )} (${rmSummary.deltaPct !== null ? `${rmSummary.deltaPct > 0 ? '+' : ''}${rmSummary.deltaPct}%` : '—'}) en ${rmSummary.points} sesiones.`
                : `Primer registro de ${exerciseName}: 1RM estimado de ${formatKg(progression[0]?.best1RM ?? 0)}.`
            }
            tableHeaders={['Fecha', '1RM estimado (kg)', 'Peso máximo (kg)', 'Volumen (kg)']}
            tableRows={progression.map((p) => [
              formatShortDate(`${p.date}T00:00:00.000Z`),
              p.best1RM.toLocaleString('es-ES'),
              p.topWeightKg.toLocaleString('es-ES'),
              Math.round(p.volumeKg).toLocaleString('es-ES'),
            ])}
          >
            <ProgressionChart data={progression} />
          </ChartBlock>
        </div>
      )}
    </>
  );
}
