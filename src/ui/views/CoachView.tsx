// CAPA 3 · Interfaz — Coach adaptativo.
// Siempre muestra el análisis determinista (funciona sin red y sin clave). Si
// el usuario tiene clave de Gemini, ofrece un consejo redactado por IA encima.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAiAdvice, isCoachAiAvailable } from '../../data/coachAi';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllSessions } from '../../data/repositories/sessionRepo';
import { getAllSleepSessions } from '../../data/repositories/sleepRepo';
import { buildCoachContext } from '../../domain/coach/coachContext';
import { buildAdvicePayload, type AiAdvice } from '../../domain/coach/coachPrompt';
import {
  composeCoachAdvice,
  evaluateCoach,
  fatigueVerdict,
  type CoachTone,
} from '../../domain/coach/coachRules';
import { suggestProgram } from '../../domain/coach/programs';
import type { ReactNode } from 'react';
import { AlertIcon, CheckIcon, HowToIcon, RepeatIcon, TargetIcon } from '../components/icons';
import { GOAL_LABELS, type Goal } from '../../domain/routineGenerator';
import { CoachChat } from '../components/CoachChat';
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
  // Consejo redactado por IA (proxy en Supabase; solo modo nube con sesión).
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState('');


  useEffect(() => {
    let alive = true;
    void isCoachAiAvailable().then((ok) => {
      if (alive) setAiAvailable(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  function changeGoal(g: string) {
    const next = (GOALS.includes(g as Goal) ? g : 'hipertrofia') as Goal;
    setGoal(next);
    localStorage.setItem(COACH_GOAL_KEY, next);
    setAiAdvice(null);
    setAiNote('');
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
  const advice = useMemo(
    () => (ctx && verdict ? composeCoachAdvice(ctx, verdict, recs, goal) : null),
    [ctx, verdict, recs, goal],
  );

  async function askAi() {
    if (!ctx || !verdict || aiBusy) return;
    setAiBusy(true);
    setAiNote('');
    const result = await fetchAiAdvice(buildAdvicePayload(ctx, verdict, recs, goal));
    if (result.ok) {
      setAiAdvice(result.advice);
    } else {
      setAiNote(
        result.reason === 'cuota'
          ? 'Has llegado al límite diario de consejos con IA. Sigues con el consejo del motor local.'
          : result.reason === 'invalido'
            ? 'La respuesta de la IA no pasó la validación anti-invenciones; se mantiene el consejo local.'
            : 'No se pudo conectar con la IA; sigues con el consejo del motor local.',
      );
    }
    setAiBusy(false);
  }

  const level = (ctx?.sessionCount ?? 0) < 16 ? 'principiante' : 'intermedio';
  const days = Math.min(6, Math.max(2, Math.round(ctx?.sessionsPerWeek || 3)));
  const program = useMemo(() => suggestProgram(goal, level, days), [goal, level, days]);
  const nameById = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e.name])), [exercises]);

  if (!ctx || !verdict) {
    return (
      <div className="view-narrow">
        <h1 id="view-title" tabIndex={-1}>
          Coach
        </h1>
        <p className="muted" role="status">
          Analizando tu entrenamiento…
        </p>
      </div>
    );
  }

  return (
    <div className="view-narrow">
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

      {/* Consejo personalizado: siempre el del motor local; en modo nube con
          sesión puede redactarlo la IA (los números y citas siguen siendo del motor). */}
      {advice && (
        <section className="card card--accent" aria-labelledby="ai-heading">
          <h2 id="ai-heading">Consejo personalizado</h2>
          {(aiAdvice ?? advice).foco && (
            <p className="coach-foco">
              <span className="coach-foco__icon" aria-hidden="true">
                {TargetIcon}
              </span>{' '}
              {(aiAdvice ?? advice).foco}
            </p>
          )}
          <p style={{ margin: '0.5rem 0 0' }}>{(aiAdvice ?? advice).mensaje}</p>
          {aiAdvice && (
            <p className="meta" style={{ marginTop: '0.4rem' }}>
              Redactado con IA — los datos, reglas y citas son del motor local.
            </p>
          )}
          {aiNote && (
            <p className="hint" role="status" style={{ marginTop: '0.4rem' }}>
              {aiNote}
            </p>
          )}
          {aiAvailable && (
            <div className="btn-row" style={{ marginTop: '0.6rem' }}>
              <button type="button" className="btn btn--small" onClick={askAi} disabled={aiBusy}>
                {aiBusy ? 'Redactando…' : aiAdvice ? 'Redactar de nuevo' : 'Redactar con IA'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Habla con tu coach: rutinas deterministas para todos + preguntas IA en nube. */}
      <CoachChat
        ctx={ctx}
        verdict={verdict}
        recs={recs}
        goal={goal}
        aiAvailable={aiAvailable}
        exercises={exercises ?? []}
      />

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
    </div>
  );
}
