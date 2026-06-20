// CAPA 3 · Interfaz — Vista Entrenar: el corazón de la app.
// - Precarga "lo que hiciste la última vez" (WCAG 2.2 · 3.3.7 Redundant Entry)
// - Botón "añadir serie" que copia la anterior (misma razón)
// - El borrador sobrevive a cierres de la app (localStorage)
// - Detección de récords personales al terminar
import { useCallback, useEffect, useState } from 'react';
import type { Exercise, SessionEntry, SetType, WorkoutSet } from '../../data/models';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllRoutines } from '../../data/repositories/routineRepo';
import {
  addSession,
  getAllSessions,
  getLastSetsForExercise,
} from '../../data/repositories/sessionRepo';
import { weeklyStreak } from '../../domain/consistency';
import { suggestProgression } from '../../domain/gymTools';
import { beatsRecord, computeRecords } from '../../domain/records';
import { sessionVolume, weeklyVolume, weekStartOf } from '../../domain/volume';
import { useAnnounce } from '../components/Announcer';
import { ConfirmDialog } from '../components/AppDialog';
import { ExercisePicker } from '../components/ExercisePicker';
import { TextField } from '../components/Field';
import { GymToolsDialog } from '../components/GymToolsDialog';
import { RestTimer, SET_DONE_EVENT } from '../components/RestTimer';
import { setTypeBadge, SetOptionsDialog } from '../components/SetOptionsDialog';
import { useAsyncData } from '../hooks/useAsyncData';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  EMPTY_SET,
  loadDraft,
  saveDraft,
  type Draft,
  type DraftEntry,
  type DraftSet,
} from '../trainDraft';
import { formatKg, formatShortDate, localDateISO, parseReps, parseWeight } from '../utils/format';

export function TrainView() {
  const announce = useAnnounce();
  const [draft, setDraft] = useState<Draft | null>(loadDraft);
  const [lastSets, setLastSets] = useState<Map<string, WorkoutSet[]>>(new Map());
  const [invalidSets, setInvalidSets] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [finishedNotice, setFinishedNotice] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [gymTools, setGymTools] = useState<{ weight: string; exerciseName?: string } | null>(null);
  const [setOptions, setSetOptions] = useState<{ entryIndex: number; setIndex: number } | null>(null);
  const [elapsedMin, setElapsedMin] = useState(0);

  // Cronómetro de la sesión (se actualiza cada medio minuto).
  useEffect(() => {
    if (!draft) {
      setElapsedMin(0);
      return;
    }
    const update = () =>
      setElapsedMin(Math.max(0, Math.floor((Date.now() - new Date(draft.startedAt).getTime()) / 60_000)));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [draft]);

  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const { data: routines } = useAsyncData(useCallback(() => getAllRoutines(), []));
  // Resumen del home (panel): se recarga al terminar un entrenamiento.
  const { data: sessions, reload: reloadSessions } = useAsyncData(
    useCallback(() => getAllSessions(), []),
  );

  // Pantalla siempre encendida mientras hay entrenamiento en curso.
  const screenAwake = useWakeLock(draft !== null);

  const exerciseById = new Map((exercises ?? []).map((e) => [e.id, e]));

  // Persistir el borrador en cada cambio.
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  // Cargar "la última vez" de cada ejercicio del borrador.
  useEffect(() => {
    if (!draft) return;
    for (const entry of draft.entries) {
      if (lastSets.has(entry.exerciseId)) continue;
      getLastSetsForExercise(entry.exerciseId).then((sets) => {
        setLastSets((prev) => new Map(prev).set(entry.exerciseId, sets ?? []));
      });
    }
  }, [draft, lastSets]);

  function startWorkout(routineId?: string) {
    const routine = routines?.find((r) => r.id === routineId);
    const entries: DraftEntry[] = (routine?.exerciseIds ?? []).map((exerciseId) => ({
      exerciseId,
      sets: [{ ...EMPTY_SET }],
    }));
    setDraft({
      startedAt: new Date().toISOString(),
      ...(routineId ? { routineId } : {}),
      entries,
    });
    setFinishedNotice(null);
    setFinishError(null);
    announce(routine ? `Entrenamiento iniciado con la rutina ${routine.name}` : 'Entrenamiento iniciado');
  }

  function updateDraft(mutate: (d: Draft) => Draft) {
    setDraft((prev) => (prev ? mutate(prev) : prev));
  }

  function addExercise(exercise: Exercise) {
    updateDraft((d) => {
      if (d.entries.some((e) => e.exerciseId === exercise.id)) return d;
      return { ...d, entries: [...d.entries, { exerciseId: exercise.id, sets: [{ ...EMPTY_SET }] }] };
    });
    announce(`${exercise.name} añadido al entrenamiento`);
  }

  function removeExercise(index: number) {
    updateDraft((d) => ({ ...d, entries: d.entries.filter((_, i) => i !== index) }));
  }

  /** Reordena un ejercicio (botones ↑/↓ accesibles: WCAG 2.5.7, sin arrastre). */
  function moveExercise(index: number, dir: -1 | 1) {
    updateDraft((d) => {
      const target = index + dir;
      if (target < 0 || target >= d.entries.length) return d;
      const entries = [...d.entries];
      const [moved] = entries.splice(index, 1);
      entries.splice(target, 0, moved!);
      return { ...d, entries };
    });
  }

  function setNote(entryIndex: number, note: string) {
    updateDraft((d) => ({
      ...d,
      entries: d.entries.map((entry, i) => (i === entryIndex ? { ...entry, note } : entry)),
    }));
  }

  function updateSet(entryIndex: number, setIndex: number, changes: Partial<DraftSet>) {
    setInvalidSets((prev) => {
      const next = new Set(prev);
      next.delete(`${entryIndex}-${setIndex}`);
      return next;
    });
    updateDraft((d) => {
      const entries = d.entries.map((entry, i) => {
        if (i !== entryIndex) return entry;
        const sets = entry.sets.map((s, j) => (j === setIndex ? { ...s, ...changes } : s));
        return { ...entry, sets };
      });
      return { ...d, entries };
    });
  }

  /** Añade una serie copiando los valores de la anterior (3.3.7). */
  function addSet(entryIndex: number) {
    updateDraft((d) => {
      const entries = d.entries.map((entry, i) => {
        if (i !== entryIndex) return entry;
        const previous = entry.sets[entry.sets.length - 1];
        // Copia reps/peso/tipo de la anterior (3.3.7); el RPE es de cada serie.
        const next: DraftSet = previous
          ? {
              reps: previous.reps,
              weight: previous.weight,
              done: false,
              ...(previous.type ? { type: previous.type } : {}),
            }
          : { ...EMPTY_SET };
        return { ...entry, sets: [...entry.sets, next] };
      });
      return { ...d, entries };
    });
  }

  function removeSet(entryIndex: number, setIndex: number) {
    updateDraft((d) => {
      const entries = d.entries.map((entry, i) =>
        i === entryIndex ? { ...entry, sets: entry.sets.filter((_, j) => j !== setIndex) } : entry,
      );
      return { ...d, entries };
    });
  }

  function toggleDone(entryIndex: number, setIndex: number) {
    const set = draft?.entries[entryIndex]?.sets[setIndex];
    if (!set) return;
    if (!set.done && (parseReps(set.reps) === null || parseWeight(set.weight) === null)) {
      setInvalidSets((prev) => new Set(prev).add(`${entryIndex}-${setIndex}`));
      announce('Revisa las repeticiones y el peso antes de marcar la serie');
      return;
    }
    updateSet(entryIndex, setIndex, { done: !set.done });
    // Al COMPLETAR una serie, el temporizador de descanso arranca solo
    // (si el auto-inicio está activado en la tarjeta del temporizador).
    if (!set.done) {
      window.dispatchEvent(new CustomEvent(SET_DONE_EVENT));
    }
  }

  async function finishWorkout() {
    if (!draft) return;

    const entries: SessionEntry[] = draft.entries
      .map((entry) => ({
        exerciseId: entry.exerciseId,
        ...(entry.note?.trim() ? { note: entry.note.trim() } : {}),
        sets: entry.sets
          .map((s) => {
            const reps = parseReps(s.reps);
            const weightKg = parseWeight(s.weight);
            if (reps === null || weightKg === null) return null;
            const set: WorkoutSet = { reps, weightKg, done: s.done };
            if (s.type && s.type !== 'normal') set.type = s.type;
            if (s.rpe !== undefined) set.rpe = s.rpe;
            return set;
          })
          .filter((s): s is WorkoutSet => s !== null),
      }))
      .filter((entry) => entry.sets.length > 0);

    const doneSets = entries.flatMap((e) => e.sets.filter((s) => s.done));
    if (doneSets.length === 0) {
      setFinishError('Marca al menos una serie como completada para guardar el entrenamiento.');
      announce('No se pudo guardar: no hay series completadas');
      return;
    }
    setFinishError(null);

    // Récords ANTES de guardar, para comparar contra el historial previo.
    const previousSessions = await getAllSessions();
    const previousRecords = computeRecords(previousSessions);

    const durationMin = Math.max(
      1,
      Math.round((Date.now() - new Date(draft.startedAt).getTime()) / 60_000),
    );
    const session = await addSession({
      date: draft.startedAt,
      ...(draft.routineId ? { routineId: draft.routineId } : {}),
      entries,
      durationMin,
    });

    const prExercises = new Set<string>();
    for (const entry of entries) {
      for (const set of entry.sets) {
        if (set.done && beatsRecord(previousRecords, entry.exerciseId, set.weightKg, set.reps)) {
          prExercises.add(exerciseById.get(entry.exerciseId)?.name ?? entry.exerciseId);
        }
      }
    }

    const volume = formatKg(sessionVolume(session));
    const prText =
      prExercises.size > 0
        ? ` ¡Récord personal en ${[...prExercises].join(', ')}!`
        : '';
    const setsLabel = doneSets.length === 1 ? '1 serie' : `${doneSets.length} series`;
    const message = `Entrenamiento guardado: ${setsLabel}, ${volume} de volumen en ${durationMin} min.${prText}`;

    setDraft(null);
    setLastSets(new Map());
    setFinishedNotice(message);
    void reloadSessions();
    announce(message);
  }

  // ── Render ──────────────────────────────────────────────

  if (!draft) {
    const today = localDateISO();
    const hasHistory = !!sessions && sessions.length > 0;
    const streak = hasHistory ? weeklyStreak(sessions, today) : null;
    const thisWeek = weekStartOf(`${today}T12:00:00.000Z`);
    const thisWeekVolume = hasHistory
      ? (weeklyVolume(sessions).find((w) => w.weekStart === thisWeek)?.volumeKg ?? 0)
      : 0;
    const lastSession = hasHistory ? sessions[0] : undefined;
    const lastExerciseCount = lastSession?.entries.length ?? 0;

    return (
      <>
        <span className="kicker">Hoy toca</span>
        <h1 id="view-title" tabIndex={-1}>
          Entrenar
        </h1>

        {finishedNotice && (
          <p className="notice notice--success" role="status">
            {finishedNotice}
          </p>
        )}

        {hasHistory && streak && (
          <div className="stat-grid" aria-label="Resumen de tu actividad">
            <div className="stat">
              <span className="value num">{streak.currentWeeks}</span>
              <span className="label">
                {streak.currentWeeks === 1 ? 'semana seguida' : 'semanas seguidas'}
              </span>
            </div>
            <div className="stat">
              <span className="value num">
                {Math.round(thisWeekVolume).toLocaleString('es-ES')}
              </span>
              <span className="label">kg movidos esta semana</span>
            </div>
            <div className="stat">
              <span className="value num">{sessions.length}</span>
              <span className="label">
                {sessions.length === 1 ? 'entrenamiento' : 'entrenamientos en total'}
              </span>
            </div>
          </div>
        )}

        <div className={lastSession ? 'home-cards' : undefined}>
          <div className="card card--accent">
            <h2>Empezar entrenamiento</h2>
            <p className="muted">
              Registra series, repeticiones y peso. Todo queda en tu dispositivo.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn--primary" onClick={() => startWorkout()}>
                Entrenamiento libre
              </button>
            </div>
          </div>

          {lastSession && (
            <div className="card">
              <h2>Tu última sesión</h2>
              <p className="muted num">
                {formatShortDate(lastSession.date)} · {lastExerciseCount}{' '}
                {lastExerciseCount === 1 ? 'ejercicio' : 'ejercicios'} ·{' '}
                {formatKg(sessionVolume(lastSession))}
                {lastSession.durationMin ? ` · ${lastSession.durationMin} min` : ''}
              </p>
              <div className="btn-row">
                <a className="btn btn--small btn--ghost" href="#/historial">
                  Ver historial completo
                </a>
              </div>
            </div>
          )}
        </div>

        {routines && routines.length > 0 && (
          <div className="card">
            <h2>O empieza desde una rutina</h2>
            <ul className="item-list">
              {routines.map((routine) => (
                <li key={routine.id}>
                  <div>
                    <span className="title">{routine.name}</span>
                    <br />
                    <span className="meta">{routine.exerciseIds.length} ejercicios</span>
                  </div>
                  <button type="button" className="btn" onClick={() => startWorkout(routine.id)}>
                    Empezar<span className="visually-hidden"> {routine.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <span className="kicker">
        Entrenamiento en curso · <span className="num">{elapsedMin} min</span>
        {screenAwake && <span className="muted"> · pantalla siempre encendida</span>}
      </span>
      <h1 id="view-title" tabIndex={-1}>
        Entrenar
      </h1>

      {draft.entries.map((entry, entryIndex) => {
        const exercise = exerciseById.get(entry.exerciseId);
        const last = lastSets.get(entry.exerciseId);
        const suggestion = last && last.length > 0 ? suggestProgression(last) : null;
        return (
          <section key={entry.exerciseId} className="card" aria-label={exercise?.name}>
            <div className="btn-row" style={{ justifyContent: 'space-between' }}>
              <h2>{exercise?.name ?? entry.exerciseId}</h2>
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  disabled={entryIndex === 0}
                  onClick={() => moveExercise(entryIndex, -1)}
                >
                  <span aria-hidden="true">↑</span>
                  <span className="visually-hidden">Subir {exercise?.name}</span>
                </button>
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  disabled={entryIndex === draft.entries.length - 1}
                  onClick={() => moveExercise(entryIndex, 1)}
                >
                  <span aria-hidden="true">↓</span>
                  <span className="visually-hidden">Bajar {exercise?.name}</span>
                </button>
                <button
                  type="button"
                  className="btn btn--small btn--danger"
                  onClick={() => removeExercise(entryIndex)}
                >
                  Quitar<span className="visually-hidden"> {exercise?.name}</span>
                </button>
              </div>
            </div>

            {last && last.length > 0 && (
              <p className="last-time">
                La última vez: {last.map((s) => `${s.reps}×${formatKg(s.weightKg)}`).join(' · ')}
                {suggestion && (
                  <>
                    <br />
                    <strong>
                      {suggestion.action === 'subir'
                        ? `Hoy prueba ${formatKg(suggestion.nextWeightKg)}.`
                        : suggestion.action === 'repetir'
                          ? `Hoy: ${formatKg(suggestion.nextWeightKg)} buscando una repetición más.`
                          : `Hoy consolida ${formatKg(suggestion.nextWeightKg)}.`}
                    </strong>{' '}
                    {suggestion.reason}
                  </>
                )}
              </p>
            )}

            <div className="btn-row" style={{ marginBottom: '0.5rem' }}>
              <button
                type="button"
                className="btn btn--small btn--ghost"
                onClick={() =>
                  setGymTools({
                    weight: String(
                      suggestion?.nextWeightKg ??
                        (last && last.length > 0
                          ? Math.max(...last.map((s) => s.weightKg))
                          : ''),
                    ).replace('.', ','),
                    ...(exercise?.name ? { exerciseName: exercise.name } : {}),
                  })
                }
              >
                🏋 Barra y calentamiento
                <span className="visually-hidden"> para {exercise?.name}</span>
              </button>
            </div>

            <div className="field" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor={`note-${entryIndex}`} className="visually-hidden">
                Nota para {exercise?.name}
              </label>
              <input
                id={`note-${entryIndex}`}
                className="input note-input"
                type="text"
                placeholder="Nota (técnica, sensaciones, ajustes…)"
                value={entry.note ?? ''}
                onChange={(e) => setNote(entryIndex, e.target.value)}
              />
            </div>

            {entry.sets.map((set, setIndex) => {
              const invalid = invalidSets.has(`${entryIndex}-${setIndex}`);
              const setType: SetType = set.type ?? 'normal';
              return (
                <div className={`set-row set-row--${setType}`} key={setIndex}>
                  <button
                    type="button"
                    className="set-index"
                    onClick={() => setSetOptions({ entryIndex, setIndex })}
                  >
                    <span aria-hidden="true">{setTypeBadge(set.type, setIndex)}</span>
                    {set.rpe !== undefined && (
                      <span className="rpe-badge" aria-hidden="true">
                        @{set.rpe}
                      </span>
                    )}
                    <span className="visually-hidden">
                      Opciones de la serie {setIndex + 1} de {exercise?.name}
                      {set.type && set.type !== 'normal' ? `, tipo ${setType}` : ''}
                      {set.rpe !== undefined ? `, RPE ${set.rpe}` : ''}
                    </span>
                  </button>
                  {/* Etiquetas cortas visibles (espacio de una mano en móvil) con
                      nombre accesible completo que EMPIEZA por el texto visible
                      (WCAG 2.5.3 Label in Name). */}
                  <TextField
                    label="Reps"
                    ariaLabel={`Reps, serie ${setIndex + 1} de ${exercise?.name ?? entry.exerciseId}`}
                    mode="int"
                    value={set.reps}
                    onChange={(v) => updateSet(entryIndex, setIndex, { reps: v })}
                    error={invalid && parseReps(set.reps) === null ? 'Número entero, mínimo 1' : undefined}
                  />
                  <TextField
                    label="kg"
                    ariaLabel={`kg, serie ${setIndex + 1} de ${exercise?.name ?? entry.exerciseId}`}
                    mode="decimal"
                    value={set.weight}
                    onChange={(v) => updateSet(entryIndex, setIndex, { weight: v })}
                    error={
                      invalid && parseWeight(set.weight) === null
                        ? 'Ej.: 60 o 62,5 (0 = corporal)'
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    className="set-done"
                    aria-pressed={set.done}
                    onClick={() => toggleDone(entryIndex, setIndex)}
                  >
                    <span aria-hidden="true">✓</span>
                    <span className="visually-hidden">
                      Serie {setIndex + 1} de {exercise?.name} completada
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => removeSet(entryIndex, setIndex)}
                  >
                    <span aria-hidden="true">✕</span>
                    <span className="visually-hidden">
                      Eliminar serie {setIndex + 1} de {exercise?.name}
                    </span>
                  </button>
                </div>
              );
            })}

            <div className="btn-row" style={{ marginTop: '0.75rem' }}>
              <button type="button" className="btn btn--small" onClick={() => addSet(entryIndex)}>
                + Añadir serie<span className="visually-hidden"> a {exercise?.name}</span>
              </button>
            </div>
          </section>
        );
      })}

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={() => setPickerOpen(true)}>
          + Añadir ejercicio
        </button>
      </div>

      <RestTimer />

      {finishError && (
        <p className="notice notice--error" role="alert">
          {finishError}
        </p>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={finishWorkout}>
          Terminar y guardar
        </button>
        <button type="button" className="btn btn--danger" onClick={() => setConfirmDiscard(true)}>
          Descartar entrenamiento
        </button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        exercises={exercises ?? []}
        onPick={addExercise}
        onClose={() => setPickerOpen(false)}
      />

      {gymTools && (
        <GymToolsDialog
          open={gymTools !== null}
          initialWeight={gymTools.weight}
          exerciseName={gymTools.exerciseName}
          onClose={() => setGymTools(null)}
        />
      )}

      {setOptions &&
        (() => {
          const { entryIndex, setIndex } = setOptions;
          const entry = draft.entries[entryIndex];
          const set = entry?.sets[setIndex];
          if (!set) return null;
          return (
            <SetOptionsDialog
              open
              setNumber={setIndex + 1}
              exerciseName={exerciseById.get(entry.exerciseId)?.name ?? entry.exerciseId}
              type={set.type ?? 'normal'}
              rpe={set.rpe}
              onChangeType={(type) =>
                updateSet(entryIndex, setIndex, { type: type === 'normal' ? undefined : type })
              }
              onChangeRpe={(rpe) => updateSet(entryIndex, setIndex, { rpe })}
              onClose={() => setSetOptions(null)}
            />
          );
        })()}

      <ConfirmDialog
        open={confirmDiscard}
        title="¿Descartar el entrenamiento?"
        description="Se perderán las series registradas en esta sesión. Esta acción no se puede deshacer."
        confirmLabel="Sí, descartar"
        onConfirm={() => {
          setDraft(null);
          setLastSets(new Map());
          setConfirmDiscard(false);
          announce('Entrenamiento descartado');
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
