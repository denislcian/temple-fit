// CAPA 3 · Interfaz — Progreso: la analítica que los comerciales cobran.
// Cada gráfica sigue el patrón accesible de tres capas (ver ChartBlock).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../../data/db';
import { getAllMeasurements } from '../../data/repositories/bodyRepo';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { getAllSleepSessions } from '../../data/repositories/sleepRepo';
import { achievements, trainingCalendar, weeklyStreak } from '../../domain/consistency';
import { effortRecoveryInsight, weeklyEffortRecovery } from '../../domain/effortRecovery';
import { computeRecords } from '../../domain/records';
import { exerciseProgression, summarizeProgress, totals } from '../../domain/stats';
import { weeklyVolume } from '../../domain/volume';
import { BodyMeasureDialog } from '../components/BodyMeasureDialog';
import { EmptyState } from '../components/EmptyState';
import { WeightGoalCard } from '../components/WeightGoalCard';
import { ChartBlock } from '../components/ChartBlock';
import { BodyWeightChart } from '../components/charts/BodyWeightChart';
import { ProgressionChart } from '../components/charts/ProgressionChart';
import { VolumeChart } from '../components/charts/VolumeChart';
import { SelectField } from '../components/Field';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatKg, formatShortDate, localDateISO } from '../utils/format';

const PROGRESS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 20V4M4 20h16" strokeLinecap="round" />
    <path d="m7 14 4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ProgressView() {
  const { data: sessions } = useAsyncData(useCallback(() => getAllSessions(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const { data: measurements, reload: reloadBody } = useAsyncData(
    useCallback(() => getAllMeasurements(), []),
  );
  const { data: sleep } = useAsyncData(useCallback(() => getAllSleepSessions(), []));
  const { data: extras } = useAsyncData(
    useCallback(async () => {
      const [diary, posts] = await Promise.all([db.diary.toArray(), db.posts.toArray()]);
      return { diary, posts };
    }, []),
  );
  const [selectedExercise, setSelectedExercise] = useState('');
  const [measuring, setMeasuring] = useState(false);

  // Progreso es lazy (Suspense): en la primera visita el efecto de foco de
  // App.tsx corre contra el fallback (sin #view-title). La vista reclama el
  // foco al montar para no perderlo en esa primera carga.
  useEffect(() => {
    document.getElementById('view-title')?.focus();
  }, []);

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
        <EmptyState
          icon={PROGRESS_ICON}
          title="Aún no hay números que mostrar"
          action={
            <a className="btn btn--primary" href="#/entrenar">
              Empezar a entrenar
            </a>
          }
        >
          Aquí verás tu volumen semanal, tus récords personales y la evolución de tu 1RM estimado en
          cada ejercicio. Guarda tu primer entrenamiento para empezar.
        </EmptyState>
      </>
    );
  }

  const today = localDateISO();
  const total = totals(sessions);
  const weekly = weeklyVolume(sessions);
  const weeklySummary = summarizeProgress(weekly.map((w) => w.volumeKg));
  const records = computeRecords(sessions);
  const streak = weeklyStreak(sessions, today);
  const calendar = trainingCalendar(sessions, today, 12);
  const trainedDays = calendar.filter((d) => d.sessions > 0).length;
  const effortRecovery = weeklyEffortRecovery(sessions, sleep ?? []);
  const effortInsight = effortRecoveryInsight(effortRecovery);
  const effortRows = effortRecovery
    .filter((w) => w.avgRpe !== null || w.avgSleepMin !== null)
    .slice(-8);
  const hasEffortData = effortRows.some((w) => w.avgRpe !== null);
  const badges = extras
    ? achievements({ sessions, diary: extras.diary, posts: extras.posts, todayISO: today })
    : [];
  const unlockedCount = badges.filter((b) => b.achieved).length;
  const lastMeasure = measurements && measurements.length > 0 ? measurements[measurements.length - 1] : undefined;

  const progression = exerciseId ? exerciseProgression(sessions, exerciseId) : [];
  const rmSummary = summarizeProgress(progression.map((p) => p.best1RM));
  const record = records.get(exerciseId);

  // Récords de todos los ejercicios, ordenados por mejor 1RM estimado.
  const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));
  const allRecords = [...records.values()].sort(
    (a, b) => b.best1RM.estimated1RM - a.best1RM.estimated1RM,
  );

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

      <section className="card" aria-labelledby="streak-heading">
        <h2 id="streak-heading">Constancia</h2>
        <div className="stat-grid">
          <div className="stat">
            <span className="value num">{streak.currentWeeks}</span>
            <span className="label">semanas seguidas (racha actual)</span>
          </div>
          <div className="stat">
            <span className="value num">{streak.bestWeeks}</span>
            <span className="label">mejor racha de semanas</span>
          </div>
        </div>
        <p className="chart-summary">
          Has entrenado {trainedDays} {trainedDays === 1 ? 'día' : 'días'} en las últimas 12
          semanas.
        </p>
        <div className="heatmap" aria-hidden="true">
          {calendar.map((day) => (
            <span
              key={day.date}
              className={`cell ${day.sessions > 0 ? (day.sessions > 1 ? 'l2' : 'l1') : ''}`}
              title={`${day.date}: ${day.sessions} ${day.sessions === 1 ? 'sesión' : 'sesiones'}`}
            />
          ))}
        </div>
      </section>

      {hasEffortData && (
        <section className="card" aria-labelledby="effort-heading">
          <h2 id="effort-heading">Esfuerzo y descanso</h2>
          <p className="chart-summary">
            {effortInsight ??
              'Tu RPE medio y tu sueño por semana. Lo que el coach cruza para ajustar tus cargas.'}
          </p>
          <table className="table">
            <caption className="visually-hidden">RPE medio y sueño medio por semana</caption>
            <thead>
              <tr>
                <th scope="col">Semana del</th>
                <th scope="col">RPE medio</th>
                <th scope="col">Sueño medio</th>
              </tr>
            </thead>
            <tbody>
              {effortRows.map((w) => (
                <tr key={w.weekStart}>
                  <td>{formatShortDate(`${w.weekStart}T00:00:00.000Z`)}</td>
                  <td className="num">{w.avgRpe ?? '—'}</td>
                  <td className="num">
                    {w.avgSleepMin !== null ? `${Math.round((w.avgSleepMin / 60) * 10) / 10} h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {badges.length > 0 && (
        <section className="card" aria-labelledby="badges-heading">
          <h2 id="badges-heading">
            Logros <span className="muted num">· {unlockedCount} de {badges.length}</span>
          </h2>
          <ul className="achievements">
            {badges.map((badge) => (
              <li key={badge.id} className={badge.achieved ? 'achieved' : ''}>
                <span className="medal" aria-hidden="true">
                  {badge.achieved ? '🏅' : '🔒'}
                </span>
                <span>
                  <span className="title">{badge.title}</span>
                  <br />
                  <span className="meta">
                    {badge.description}
                    {!badge.achieved && badge.progress ? ` — llevas ${badge.progress}` : ''}
                  </span>
                  <span className="visually-hidden">
                    {badge.achieved ? '. Conseguido' : '. Pendiente'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {allRecords.length > 0 && (
        <section className="card" aria-labelledby="records-heading">
          <h2 id="records-heading">
            {allRecords.length === 1 ? 'Tu récord' : 'Tus récords'}{' '}
            <span className="muted num">· {allRecords.length}</span>
          </h2>
          <p className="chart-summary">
            Tu mejor marca en cada ejercicio. El 1RM se estima con las fórmulas de Epley y Brzycki.
          </p>
          <ul className="item-list">
            {allRecords.map((r) => (
              <li key={r.exerciseId}>
                <div style={{ flex: 1 }}>
                  <span className="title">{nameById.get(r.exerciseId) ?? r.exerciseId}</span>
                  <br />
                  <span className="meta num">
                    Mejor serie {r.bestWeight.reps}×{formatKg(r.bestWeight.weightKg)} · 1RM{' '}
                    {formatKg(r.best1RM.estimated1RM)}
                  </span>
                </div>
                <span className="pr-badge" aria-hidden="true">
                  🏆
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card" aria-labelledby="body-heading">
        <div className="btn-row" style={{ justifyContent: 'space-between' }}>
          <h2 id="body-heading" style={{ margin: 0 }}>
            Tu cuerpo
          </h2>
          <button type="button" className="btn btn--small btn--primary" onClick={() => setMeasuring(true)}>
            + Registrar medidas
          </button>
        </div>
        {lastMeasure ? (
          <>
            <p className="muted num" style={{ marginTop: '0.5rem' }}>
              Último registro ({formatShortDate(`${lastMeasure.date}T00:00:00.000Z`)}):{' '}
              {formatKg(lastMeasure.weightKg)}
              {lastMeasure.bodyFatPct ? ` · ${lastMeasure.bodyFatPct}% graso` : ''}
              {lastMeasure.waistCm ? ` · cintura ${lastMeasure.waistCm} cm` : ''}
            </p>
            {measurements && measurements.length > 1 && (
              <ChartBlock
                title="Evolución del peso corporal"
                summary={(() => {
                  const s = summarizeProgress(measurements.map((m) => m.weightKg));
                  return s
                    ? `Tu peso pasó de ${formatKg(s.firstValue)} a ${formatKg(s.lastValue)} (${s.deltaAbs > 0 ? '+' : ''}${s.deltaAbs} kg) en ${s.points} registros.`
                    : '';
                })()}
                tableHeaders={['Fecha', 'Peso (kg)', '% graso', 'Cintura (cm)']}
                tableRows={measurements.map((m) => [
                  formatShortDate(`${m.date}T00:00:00.000Z`),
                  m.weightKg.toLocaleString('es-ES'),
                  m.bodyFatPct?.toLocaleString('es-ES') ?? '—',
                  m.waistCm?.toLocaleString('es-ES') ?? '—',
                ])}
              >
                <BodyWeightChart data={measurements} />
              </ChartBlock>
            )}
          </>
        ) : (
          <p className="muted">
            Registra tu peso (y, si quieres, medidas) para ver tu evolución. El peso actualiza
            automáticamente tus objetivos de macros.
          </p>
        )}
      </section>

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

      <WeightGoalCard currentKg={lastMeasure?.weightKg} />

      <BodyMeasureDialog open={measuring} onSaved={reloadBody} onClose={() => setMeasuring(false)} />
    </>
  );
}
