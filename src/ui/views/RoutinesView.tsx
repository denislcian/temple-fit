// CAPA 3 · Interfaz — Rutinas (plantillas) ilimitadas.
// Reordenar con botones "subir/bajar" accesibles por teclado en lugar de
// solo arrastre (WCAG 2.2 · 2.5.7 Dragging Movements + 2.1.1 Teclado).
import { useCallback, useState } from 'react';
import type { Exercise, Routine } from '../../data/models';
import { getAllExercises } from '../../data/repositories/exerciseRepo';
import {
  addRoutine,
  getAllRoutines,
  removeRoutine,
  updateRoutine,
} from '../../data/repositories/routineRepo';
import { useAnnounce } from '../components/Announcer';
import { AppDialog, ConfirmDialog } from '../components/AppDialog';
import { ExercisePicker } from '../components/ExercisePicker';
import { TextField } from '../components/Field';
import { useAsyncData } from '../hooks/useAsyncData';

interface EditorState {
  routineId: string | null; // null = nueva rutina
  name: string;
  exerciseIds: string[];
}

export function RoutinesView() {
  const announce = useAnnounce();
  const { data: routines, reload } = useAsyncData(useCallback(() => getAllRoutines(), []));
  const { data: exercises } = useAsyncData(useCallback(() => getAllExercises(), []));
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Routine | null>(null);

  const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));

  function openNew() {
    setEditor({ routineId: null, name: '', exerciseIds: [] });
    setNameError(undefined);
  }

  function openEdit(routine: Routine) {
    setEditor({ routineId: routine.id, name: routine.name, exerciseIds: [...routine.exerciseIds] });
    setNameError(undefined);
  }

  function move(index: number, delta: -1 | 1) {
    setEditor((prev) => {
      if (!prev) return prev;
      const target = index + delta;
      if (target < 0 || target >= prev.exerciseIds.length) return prev;
      const ids = [...prev.exerciseIds];
      const [moved] = ids.splice(index, 1);
      ids.splice(target, 0, moved!);
      return { ...prev, exerciseIds: ids };
    });
    announce(delta === -1 ? 'Ejercicio movido hacia arriba' : 'Ejercicio movido hacia abajo');
  }

  function addExercise(exercise: Exercise) {
    setEditor((prev) =>
      prev && !prev.exerciseIds.includes(exercise.id)
        ? { ...prev, exerciseIds: [...prev.exerciseIds, exercise.id] }
        : prev,
    );
  }

  async function save() {
    if (!editor) return;
    const name = editor.name.trim();
    if (!name) {
      setNameError('Escribe un nombre para la rutina');
      return;
    }
    if (editor.routineId) {
      await updateRoutine(editor.routineId, { name, exerciseIds: editor.exerciseIds });
      announce(`Rutina ${name} actualizada`);
    } else {
      await addRoutine({ name, exerciseIds: editor.exerciseIds });
      announce(`Rutina ${name} creada`);
    }
    setEditor(null);
    await reload();
  }

  return (
    <>
      <span className="kicker">Tus plantillas, sin límite</span>
      <h1 id="view-title" tabIndex={-1}>
        Rutinas
      </h1>

      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn--primary" onClick={openNew}>
          + Nueva rutina
        </button>
      </div>

      {routines && routines.length === 0 && (
        <div className="card">
          <p>
            Una rutina es una plantilla: la lista de ejercicios de tu día de empuje, pierna, full
            body... Al empezar un entrenamiento desde una rutina, los ejercicios ya están listos.
          </p>
        </div>
      )}

      <ul className="item-list">
        {(routines ?? []).map((routine) => (
          <li key={routine.id}>
            <div>
              <span className="title">{routine.name}</span>
              <br />
              <span className="meta">
                {routine.exerciseIds.length > 0
                  ? routine.exerciseIds.map((id) => nameById.get(id) ?? id).join(' · ')
                  : 'Sin ejercicios todavía'}
              </span>
            </div>
            <div className="btn-row">
              <button type="button" className="btn btn--small" onClick={() => openEdit(routine)}>
                Editar<span className="visually-hidden"> {routine.name}</span>
              </button>
              <button
                type="button"
                className="btn btn--small btn--danger"
                onClick={() => setToDelete(routine)}
              >
                Eliminar<span className="visually-hidden"> {routine.name}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <AppDialog
        open={editor !== null}
        title={editor?.routineId ? 'Editar rutina' : 'Nueva rutina'}
        onClose={() => setEditor(null)}
      >
        {editor && (
          <>
            <TextField
              label="Nombre de la rutina"
              value={editor.name}
              onChange={(name) => {
                setEditor({ ...editor, name });
                setNameError(undefined);
              }}
              error={nameError}
              required
            />

            <h3>Ejercicios (en orden)</h3>
            <ul className="item-list">
              {editor.exerciseIds.map((id, index) => (
                <li key={id}>
                  <span className="title">{nameById.get(id) ?? id}</span>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn btn--small"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <span aria-hidden="true">↑</span>
                      <span className="visually-hidden">Subir {nameById.get(id)}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn--small"
                      disabled={index === editor.exerciseIds.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <span aria-hidden="true">↓</span>
                      <span className="visually-hidden">Bajar {nameById.get(id)}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn--small btn--danger"
                      onClick={() =>
                        setEditor({
                          ...editor,
                          exerciseIds: editor.exerciseIds.filter((x) => x !== id),
                        })
                      }
                    >
                      <span aria-hidden="true">✕</span>
                      <span className="visually-hidden">Quitar {nameById.get(id)}</span>
                    </button>
                  </div>
                </li>
              ))}
              {editor.exerciseIds.length === 0 && <li>Añade al menos un ejercicio.</li>}
            </ul>

            <div className="btn-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn" onClick={() => setPickerOpen(true)}>
                + Añadir ejercicio
              </button>
              <button type="button" className="btn btn--primary" onClick={save}>
                Guardar rutina
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setEditor(null)}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </AppDialog>

      <ExercisePicker
        open={pickerOpen}
        exercises={exercises ?? []}
        onPick={addExercise}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title={`¿Eliminar la rutina "${toDelete?.name ?? ''}"?`}
        description="Las sesiones ya guardadas en el historial no se verán afectadas."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => {
          if (toDelete) {
            await removeRoutine(toDelete.id);
            await reload();
            announce(`Rutina ${toDelete.name} eliminada`);
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
