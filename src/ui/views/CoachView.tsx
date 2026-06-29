// CAPA 3 · Interfaz — Coach adaptativo.
// Siempre muestra el análisis determinista (funciona sin red y sin clave). Si
// el usuario tiene clave de Gemini, ofrece un consejo redactado por IA encima.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { getAllSleepSessions } from '../../data/repositories/sleepRepo';
import { generateCoachMessage, type CoachMessage } from '../../data/coach';
import { isOnDeviceSupported, type DownloadProgress } from '../../data/onDeviceLLM';
import { buildCoachContext } from '../../domain/coach/coachContext';
import { evaluateCoach, fatigueVerdict, type CoachTone } from '../../domain/coach/coachRules';
import { suggestProgram } from '../../domain/coach/programs';
import type { ReactNode } from 'react';
import { AlertIcon, CheckIcon, HowToIcon, RepeatIcon, TargetIcon } from '../components/icons';
import { GOAL_LABELS, type Goal } from '../../domain/routineGenerator';
import { EmptyState } from '../components/EmptyState';
import { SelectField } from '../components/Field';
import { useAsyncData } from '../hooks/useAsyncData';
import { localDateISO } from '../utils/format';

const COACH_GOAL_KEY = 'forjafit-coach-goal';
const GOALS: Goal[] = ['fuerza', 'hipertrofia', 'definicion'];

const COACH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 3l2.2 4.6 5 .7-3.6 3.5.9 5L12 18.9 7.5 16.8l.9-5L4.8 8.3l5-.7L12 3Z" strokeLinejoin="round" />
  </svg>
);

const TONE_ICON: Record<CoachTone, ReactNode> = {
  positivo: CheckIcon,
  info: HowToIcon,
  ajuste: RepeatIcon,
  alerta: AlertIcon,
};

const VERDICT_ICON: Record<string, ReactNode> = {
  cargado: AlertIcon,
  descansado: CheckIcon,
  'sin-datos': HowToIcon,
};

export function CoachView() {
  const { data: sessions } = useAsyncData(useCallback(() => getAllSessions(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const { data: sleep } = useAsyncData(useCallback(() => getAllSleepSessions(), []));

  const [goal, setGoal] = useState<Goal>(
    () => (localStorage.getItem(COACH_GOAL_KEY) as Goal) || 'hipertrofia',
  );
  const [ai, setAi] = useState<CoachMessage | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [dl, setDl] = useState<DownloadProgress | null>(null);
  const [onDeviceOk, setOnDeviceOk] = useState<boolean | null>(null);

  // El coach IA es SIEMPRE on-device (sin clave, sin cuenta, sin configurar).
  // Comprobamos una vez si el navegador soporta WebGPU.
  useEffect(() => {
    let alive = true;
    void isOnDeviceSupported().then((ok) => {
      if (alive) setOnDeviceOk(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  function changeGoal(g: string) {
    const next = (GOALS.includes(g as Goal) ? g : 'hipertrofia') as Goal;
    setGoal(next);
    localStorage.setItem(COACH_GOAL_KEY, next);
    setAi(null);
    setAiError('');
  }

  const today = localDateISO();
  const ctx = useMemo(
    () =>
      sessions && exercises
        ? buildCoachContext({
            sessions,
            sleepSessions: sleep ?? [],
            exercises,
            todayISO: today,
          })
        : null,
    [sessions, exercises, sleep, today],
  );

  const verdict = ctx ? fatigueVerdict(ctx) : null;
  const recs = useMemo(() => (ctx ? evaluateCoach(ctx, goal) : []), [ctx, goal]);

  const level = (ctx?.sessionCount ?? 0) < 16 ? 'principiante' : 'intermedio';
  const days = Math.min(6, Math.max(2, Math.round(ctx?.sessionsPerWeek || 3)));
  const program = useMemo(() => suggestProgram(goal, level, days), [goal, level, days]);
  const nameById = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e.name])), [exercises]);

  const canUseAi = onDeviceOk === true;

  async function askAi() {
    if (!ctx || !verdict) return;
    setAiLoading(true);
    setAiError('');
    setAi(null);
    setDl(null);
    try {
      const msg = await generateCoachMessage(
        'ondevice',
        '',
        {
          verdict,
          recommendations: recs,
          context: {
            goal,
            avgRpe7d: ctx.avgRpe7d,
            avgSleepHours:
              ctx.avgSleepMin === null ? null : Math.round((ctx.avgSleepMin / 60) * 10) / 10,
            sessionsPerWeek: ctx.sessionsPerWeek,
            fatigueScore: ctx.fatigueScore,
          },
        },
        (p) => setDl(p),
      );
      setAi(msg);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'No se pudo generar el consejo.');
    } finally {
      setAiLoading(false);
      setDl(null);
    }
  }

  if (!ctx || !verdict) {
    return (
      <>
        <h1 id="view-title" tabIndex={-1}>
          Coach
        </h1>
        <p className="muted" role="status">
          Analizando tu entrenamiento…
        </p>
      </>
    );
  }

  return (
    <>
      <span className="kicker">Tu entrenador adaptativo</span>
      <h1 id="view-title" tabIndex={-1}>
        Coach
      </h1>

      {/* Veredicto de cabecera. */}
      <section className={`card coach-verdict coach-verdict--${verdict.estado}`} aria-labelledby="verdict-heading">
        <span className="coach-fatiga" aria-hidden="true">
          {VERDICT_ICON[verdict.estado] ?? TargetIcon}
        </span>
        <div>
          <h2 id="verdict-heading" style={{ margin: 0 }}>
            {verdict.titulo}
          </h2>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            {verdict.detalle}
          </p>
          {ctx.rpeSampleSize > 0 && (
            <p className="meta num" style={{ margin: '0.4rem 0 0' }}>
              Fatiga {verdict.fatigueScore}/10 · RPE medio {ctx.avgRpe7d}
              {ctx.avgSleepMin !== null ? ` · sueño ${Math.round((ctx.avgSleepMin / 60) * 10) / 10} h` : ''}
            </p>
          )}
        </div>
      </section>

      {sessions && sessions.length === 0 ? (
        <EmptyState
          icon={COACH_ICON}
          title="Tu coach está listo"
          action={
            <a className="btn btn--primary" href="#/entrenar">
              Empezar a entrenar
            </a>
          }
        >
          En cuanto registres entrenamientos, cruzaré tu RPE, volumen y descanso para ajustar cargas,
          series y descansos a ti — sin que ningún dato salga de tu dispositivo.
        </EmptyState>
      ) : null}

      <div className="card">
        <SelectField label="Tu objetivo" value={goal} onChange={changeGoal}>
          {GOALS.map((g) => (
            <option key={g} value={g}>
              {GOAL_LABELS[g]}
            </option>
          ))}
        </SelectField>
      </div>

      {/* Consejo con IA (opcional). */}
      <section className="card card--accent" aria-labelledby="ai-heading">
        <h2 id="ai-heading">Consejo personalizado</h2>
        {ai ? (
          <>
            {ai.foco && (
              <p className="coach-foco">
                <span className="coach-foco__icon" aria-hidden="true">{TargetIcon}</span> {ai.foco}
              </p>
            )}
            <p style={{ margin: '0.5rem 0 0' }}>{ai.mensaje}</p>
          </>
        ) : (
          <p className="muted" style={{ marginTop: '0.25rem' }}>
            {canUseAi
              ? 'Consejo redactado por una IA que corre en TU dispositivo, sin clave, sin cuenta y sin nada que configurar. La primera vez descarga el modelo (~1,6 GB); luego es instantáneo y funciona offline. Nada sale de aquí.'
              : 'Tu navegador no soporta IA en el dispositivo (WebGPU), pero todo el análisis de abajo funciona igual — sin clave ni configuración.'}
          </p>
        )}
        {dl && dl.progress < 1 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div className="goal-bar">
              <span className="fill" style={{ width: `${Math.round(dl.progress * 100)}%` }} />
            </div>
            <p className="meta num" style={{ marginTop: '0.3rem' }} role="status">
              Descargando el modelo… {Math.round(dl.progress * 100)}% (solo la primera vez)
            </p>
          </div>
        )}
        {aiError && (
          <p className="notice notice--error" role="alert" style={{ marginTop: '0.75rem' }}>
            {aiError}
          </p>
        )}
        {canUseAi && (
          <div className="btn-row" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn--primary" onClick={askAi} disabled={aiLoading}>
              {aiLoading
                ? dl && dl.progress < 1
                  ? `Descargando… ${Math.round(dl.progress * 100)}%`
                  : 'Pensando…'
                : ai
                  ? 'Volver a preguntar'
                  : 'Activar IA y pedir consejo'}
            </button>
          </div>
        )}
      </section>

      {/* Recomendaciones deterministas (siempre). */}
      <section className="card" aria-labelledby="recs-heading">
        <h2 id="recs-heading">Qué hacer ahora</h2>
        <ul className="coach-recs">
          {recs.map((r) => (
            <li key={r.id} className={`coach-rec coach-rec--${r.tone}`}>
              <span className="coach-rec__icon" aria-hidden="true">
                {TONE_ICON[r.tone]}
              </span>
              <span className="coach-rec__body">
                <span className="title">{r.titulo}</span>
                <span className="meta">{r.detalle}</span>
                {r.fuente && <span className="coach-rec__src">Base: {r.fuente}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Programa sugerido. */}
      <section className="card" aria-labelledby="program-heading">
        <h2 id="program-heading">Programa que te encaja</h2>
        <p className="chart-summary">
          <strong>{program.nombre}</strong> · {program.metodologia}. {program.descripcion}
        </p>
        <p className="meta" style={{ marginTop: '0.4rem' }}>
          Progresión: {program.progresion}
        </p>
        <ul className="item-list" style={{ marginTop: '0.5rem' }}>
          {program.dias.map((d) => (
            <li key={d.nombre}>
              <div style={{ flex: 1 }}>
                <span className="title">{d.nombre}</span>
                <br />
                <span className="meta">
                  {d.ejercicios.map((e) => `${nameById.get(e.exerciseId) ?? e.exerciseId} (${e.esquema})`).join(' · ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="hint" style={{ marginTop: '0.5rem' }}>
          Las rutinas son orientativas para adultos sanos; no sustituyen a un profesional ante
          molestias o lesiones.
        </p>
      </section>
    </>
  );
}
