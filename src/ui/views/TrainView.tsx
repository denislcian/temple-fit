// CAPA 3 · Interfaz — Vista Entrenar: el corazón de la app.
// - Precarga "lo que hiciste la última vez" (WCAG 2.2 · 3.3.7 Redundant Entry)
// - Botón "añadir serie" que copia la anterior (misma razón)
// - El borrador sobrevive a cierres de la app (localStorage)
// - Detección de récords personales al terminar
import { useCallback, useEffect, useState } from 'react';
import type { Exercise, SessionEntry, WorkoutSet } from '../../data/models';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import { getAllRoutines } from '../../data/repositories/routineRepo';
import {
  addSession,
  getAllSessions,
  getLastSetsForExercise,
} from '../../data/repositories/sessionRepo';
import { beatsRecord, computeRecords } from '../../domain/records';
import { sessionVolume } from '../../domain/volume';
import { useAnnounce } from '../components/Announcer';
import { ConfirmDialog } from '../components/AppDialog';
import { ExercisePicker } from '../components/ExercisePicker';
import { TextField } from '../components/Field';
import { RestTimer } from '../components/RestTimer';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatKg, parseReps, parseWeight } from '../utils/format';

const DRAFT_KEY = 'forjafit-draft';

interface DraftSet {
  reps: string;
  weight: string;
  done: boolean;
}

interface DraftEntry {
  exerciseId: string;
  sets: DraftSet[];
}

interface Draft {
  startedAt: string;
  routineId?: string;
  entries: DraftEntry[];
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft | null): void {
  if (draft === null) {
    localStorage.removeItem(DRAFT_KEY);
  } else {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }
}

const EMPTY_SET: DraftSet = { reps: '', weight: '', done: false };

export function TrainView() {
  const announce = useAnnounce();
  const [draft, setDraft] = useState<Draft | null>(loadDraft);
  const [lastSets, setLastSets] = useState<Map<string, WorkoutSet[]>>(new Map());
  const [invalidSets, setInvalidSets] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [finishedNotice, setFinishedNotice] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);

  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const { data: routines } = useAsyncData(useCallback(() => getAllRoutines(), []));

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
        const next: DraftSet = previous
          ? { reps: previous.reps, weight: previous.weight, done: false }
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
  }

  async function finishWorkout() {
    if (!draft) return;

    const entries: SessionEntry[] = draft.entries
      .map((entry) => ({
        exerciseId: entry.exerciseId,
        sets: entry.sets
          .map((s) => {
            const reps = parseReps(s.reps);
            const weightKg = parseWeight(s.weight);
            return reps !== null && weightKg !== null ? { reps, weightKg, done: s.done } : null;
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

    const session = await addSession({
      date: draft.startedAt,
      ...(draft.routineId ? { routineId: draft.routineId } : {}),
      entries,
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
    const message = `Entrenamiento guardado: ${doneSets.length} series, ${volume} de volumen.${prText}`;

    setDraft(null);
    setLastSets(new Map());
    setFinishedNotice(message);
    announce(message);
  }

  // ── Render ──────────────────────────────────────────────

  if (!draft) {
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

        <div className="card card--accent">
          <h2>Empezar entrenamiento</h2>
          <p className="muted">Registra series, repeticiones y peso. Todo queda en tu dispositivo.</p>
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={() => startWorkout()}>
              Entrenamiento libre
            </button>
          </div>
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
      <span className="kicker">Entrenamiento en curso</span>
      <h1 id="view-title" tabIndex={-1}>
        Entrenar
      </h1>

      {draft.entries.map((entry, entryIndex) => {
        const exercise = exerciseById.get(entry.exerciseId);
        const last = lastSets.get(entry.exerciseId);
        return (
          <section key={entry.exerciseId} className="card" aria-label={exercise?.name}>
            <div className="btn-row" style={{ justifyContent: 'space-between' }}>
              <h2>{exercise?.name ?? entry.exerciseId}</h2>
              <button
                type="button"
                className="btn btn--small btn--danger"
                onClick={() => removeExercise(entryIndex)}
              >
                Quitar<span className="visually-hidden"> {exercise?.name}</span>
              </button>
            </div>

            {last && last.length > 0 && (
              <p className="last-time">
                La última vez: {last.map((s) => `${s.reps}×${formatKg(s.weightKg)}`).join(' · ')}
              </p>
            )}

            {entry.sets.map((set, setIndex) => {
              const invalid = invalidSets.has(`${entryIndex}-${setIndex}`);
              return (
                <div className="set-row" key={setIndex}>
                  <span className="set-index" aria-hidden="true">
                    {setIndex + 1}
                  </span>
                  <TextField
                    label={`Repeticiones, serie ${setIndex + 1}`}
                    mode="int"
                    value={set.reps}
                    onChange={(v) => updateSet(entryIndex, setIndex, { reps: v })}
                    error={invalid && parseReps(set.reps) === null ? 'Número entero, mínimo 1' : undefined}
                  />
                  <TextField
                    label={`Peso en kg, serie ${setIndex + 1}`}
                    mode="decimal"
                    value={set.weight}
                    onChange={(v) => updateSet(entryIndex, setIndex, { weight: v })}
                    error={
                      invalid && parseWeight(set.weight) === null
                        ? 'Ej.: 60 o 62,5 (0 = peso corporal)'
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
