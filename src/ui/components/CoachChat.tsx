// CAPA 3 · Interfaz — Habla con tu coach (chat).
// Dos vías con garantías distintas:
//  · RUTINAS: el chat solo recoge parámetros; el plan lo construye el generador
//    DETERMINISTA (routineGenerator). Funciona para todos, también en modo
//    local y sin gastar cuota de IA. Es la puerta de entrada del usuario nuevo.
//  · PREGUNTAS libres: van a la IA anclada (proxy Supabase), solo en modo nube
//    con sesión, con validación anti-invenciones y cuota diaria.
import { useState } from 'react';
import type { Exercise } from '../../data/models';
import { fetchAiAdvice } from '../../data/coachAi';
import { addRoutine } from '../../data/repositories/routineRepo';
import { isRoutineRequest } from '../../domain/coach/chatIntent';
import type { CoachContext } from '../../domain/coach/coachContext';
import {
  buildQuestionPayload,
  MAX_QUESTION_LENGTH,
} from '../../domain/coach/coachPrompt';
import type { CoachRecommendation, CoachVerdict } from '../../domain/coach/coachRules';
import {
  generatePlan,
  GOAL_LABELS,
  type EquipmentProfile,
  type GeneratedPlan,
  type GeneratorOptions,
  type Goal,
  type Level,
} from '../../domain/routineGenerator';
import { useAnnounce } from './Announcer';
import { SelectField } from './Field';

type ChatTurn =
  | { kind: 'user'; text: string }
  | { kind: 'coach'; text: string }
  | { kind: 'form' }
  | { kind: 'plan'; plan: GeneratedPlan; saved: boolean };

interface CoachChatProps {
  ctx: CoachContext;
  verdict: CoachVerdict;
  recs: CoachRecommendation[];
  goal: Goal;
  aiAvailable: boolean;
  exercises: Exercise[];
}

export function CoachChat({ ctx, verdict, recs, goal, aiAvailable, exercises }: CoachChatProps) {
  const announce = useAnnounce();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  // Parámetros del formulario de rutina (el objetivo hereda el del coach).
  const [formGoal, setFormGoal] = useState<Goal>(goal);
  const [formDays, setFormDays] = useState('3');
  const [formEquipment, setFormEquipment] = useState<EquipmentProfile>('gimnasio');
  const [formLevel, setFormLevel] = useState<Level>('principiante');

  const nameById = new Map(exercises.map((e) => [e.id, e.name]));

  function startRoutine(userText: string) {
    setNote('');
    setTurns((prev) => [
      ...prev.filter((t) => t.kind !== 'form'),
      { kind: 'user', text: userText },
      {
        kind: 'coach',
        text: 'Claro. Dime cómo la quieres y te monto el plan al momento — lo genera el motor de reglas de la app, con su pauta citada.',
      },
      { kind: 'form' },
    ]);
  }

  function generateFromForm() {
    const options: GeneratorOptions = {
      goal: formGoal,
      daysPerWeek: Number(formDays) as GeneratorOptions['daysPerWeek'],
      equipment: formEquipment,
      level: formLevel,
    };
    const plan = generatePlan(options, exercises);
    setTurns((prev) => [
      ...prev.filter((t) => t.kind !== 'form'),
      {
        kind: 'user',
        text: `${GOAL_LABELS[formGoal]} · ${formDays} días/semana · ${formEquipment} · ${formLevel}`,
      },
      { kind: 'coach', text: plan.summary },
      { kind: 'plan', plan, saved: false },
    ]);
    announce(`Plan generado: ${plan.days.length} días de entrenamiento`);
  }

  async function savePlan(turnIndex: number, plan: GeneratedPlan) {
    for (const day of plan.days) {
      await addRoutine({
        name: `${plan.title} — ${day.name}`,
        exerciseIds: day.exerciseIds,
        notes: day.notes,
      });
    }
    setTurns((prev) =>
      prev
        .map((t, i) => (i === turnIndex && t.kind === 'plan' ? { ...t, saved: true } : t))
        .concat({
          kind: 'coach',
          text: `Guardado: ${plan.days.length} ${plan.days.length === 1 ? 'rutina' : 'rutinas'} en tu biblioteca. Las tienes en Rutinas, y al empezar un entrenamiento te saldrán listas para usar.`,
        }),
    );
    announce(`Plan guardado: ${plan.days.length} rutinas nuevas`);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setNote('');

    // 1) ¿Pide una rutina? Vía determinista, gratis y sin cuota.
    if (isRoutineRequest(text)) {
      startRoutine(text);
      return;
    }

    // 2) Pregunta libre: requiere IA (modo nube con sesión).
    if (!aiAvailable) {
      setTurns((prev) => [
        ...prev,
        { kind: 'user', text },
        {
          kind: 'coach',
          text: 'Las preguntas libres las responde la IA y necesitan cuenta (modo nube). Lo que sí puedo hacer aquí mismo: montarte una rutina a tu medida — pídemela o toca "Hazme una rutina".',
        },
      ]);
      return;
    }

    setBusy(true);
    setTurns((prev) => [...prev, { kind: 'user', text }]);
    const result = await fetchAiAdvice(buildQuestionPayload(ctx, verdict, recs, goal, text));
    if (result.ok) {
      setTurns((prev) => [...prev, { kind: 'coach', text: result.advice.mensaje }]);
    } else {
      setNote(
        result.reason === 'cuota'
          ? 'Has llegado al límite diario del plan gratuito. Pronto podrás ampliarlo con Premium; mañana se renueva.'
          : result.reason === 'invalido'
            ? 'La respuesta no pasó la validación anti-invenciones. Reformula la pregunta e inténtalo de nuevo.'
            : 'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.',
      );
    }
    setBusy(false);
  }

  return (
    <section className="card" aria-labelledby="chat-heading">
      <h2 id="chat-heading">Habla con tu coach</h2>
      <p className="muted" style={{ marginTop: '0.25rem' }}>
        {aiAvailable
          ? 'Pídeme una rutina a tu medida o pregunta sobre tu entrenamiento (volumen, descansos, sueño…). Respondo solo con tus datos y reglas con estudio citado; nunca doy consejo médico.'
          : 'Pídeme una rutina a tu medida: la genera el motor de la app, al momento y sin conexión. Para preguntas libres con IA, crea tu cuenta (modo nube).'}
      </p>

      {turns.length === 0 && (
        <div className="btn-row" style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => startRoutine('Hazme una rutina a mi medida')}
          >
            Hazme una rutina
          </button>
        </div>
      )}

      {turns.length > 0 && (
        <ul className="coach-chat" aria-live="polite">
          {turns.map((turn, i) => (
            <li key={i}>
              {turn.kind === 'user' && <p className="coach-chat__q">{turn.text}</p>}
              {turn.kind === 'coach' && <p className="coach-chat__a">{turn.text}</p>}
              {turn.kind === 'form' && (
                <div className="coach-chat__a">
                  <SelectField label="Objetivo" value={formGoal} onChange={(v) => setFormGoal(v as Goal)}>
                    <option value="fuerza">Fuerza</option>
                    <option value="hipertrofia">Hipertrofia (ganar músculo)</option>
                    <option value="definicion">Definición (perder grasa)</option>
                  </SelectField>
                  <SelectField label="Días por semana" value={formDays} onChange={setFormDays}>
                    <option value="2">2 días</option>
                    <option value="3">3 días</option>
                    <option value="4">4 días</option>
                    <option value="5">5 días</option>
                  </SelectField>
                  <SelectField
                    label="Material disponible"
                    value={formEquipment}
                    onChange={(v) => setFormEquipment(v as EquipmentProfile)}
                  >
                    <option value="gimnasio">Gimnasio completo</option>
                    <option value="mancuernas">Mancuernas / kettlebell en casa</option>
                    <option value="casa">Solo peso corporal y bandas</option>
                  </SelectField>
                  <SelectField label="Nivel" value={formLevel} onChange={(v) => setFormLevel(v as Level)}>
                    <option value="principiante">Principiante (&lt;1 año)</option>
                    <option value="intermedio">Intermedio</option>
                  </SelectField>
                  <div className="btn-row" style={{ marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn--small btn--primary" onClick={generateFromForm}>
                      Generar mi plan
                    </button>
                  </div>
                </div>
              )}
              {turn.kind === 'plan' && (
                <div className="coach-chat__a">
                  <strong>{turn.plan.title}</strong>
                  {turn.plan.days.map((day) => (
                    <div key={day.name} style={{ marginTop: '0.5rem' }}>
                      <span className="title">{day.name}</span>
                      <br />
                      <span className="meta">{day.notes}</span>
                      <ul style={{ margin: '0.25rem 0 0' }}>
                        {day.exerciseIds.map((id) => (
                          <li key={id}>{nameById.get(id) ?? id}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="btn-row" style={{ marginTop: '0.6rem' }}>
                    {turn.saved ? (
                      <a className="btn btn--small" href="#/rutinas">
                        Ver en Rutinas
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--small btn--primary"
                        onClick={() => void savePlan(i, turn.plan)}
                      >
                        Guardar plan ({turn.plan.days.length}{' '}
                        {turn.plan.days.length === 1 ? 'rutina' : 'rutinas'})
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="field" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
        <label htmlFor="coach-question" className="visually-hidden">
          Tu mensaje al coach
        </label>
        <input
          id="coach-question"
          className="input"
          type="text"
          maxLength={MAX_QUESTION_LENGTH}
          placeholder={
            aiAvailable
              ? 'P. ej.: hazme una rutina · ¿cuánto descanso entre series?'
              : 'P. ej.: hazme una rutina para 3 días'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
        />
      </div>
      {note && (
        <p className="hint" role="status" style={{ marginTop: '0.4rem' }}>
          {note}
        </p>
      )}
      <div className="btn-row" style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn btn--small btn--primary"
          onClick={send}
          disabled={busy || !input.trim()}
        >
          {busy ? 'Pensando…' : 'Enviar'}
        </button>
      </div>
    </section>
  );
}
