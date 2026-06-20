// CAPA 3 · Interfaz — Biblioteca de ejercicios: catálogo propio en español
// + ejercicios personalizados sin límite (Strong: 3, Hevy: 7).
import { useCallback, useMemo, useState } from 'react';
import type { Equipment, Exercise, MuscleGroup } from '../../data/models';
import { MUSCLE_GROUPS } from '../../data/models';
import {
  addCustomExercise,
  getAllExercises,
  removeCustomExercise,
} from '../../data/repositories/exerciseRepo';
import { useAnnounce } from '../components/Announcer';
import { AppDialog, ConfirmDialog } from '../components/AppDialog';
import { ExerciseHistoryDialog } from '../components/ExerciseHistoryDialog';
import { ExerciseImage } from '../components/ExerciseImage';
import { SelectField, TextAreaField, TextField } from '../components/Field';
import { useAsyncData } from '../hooks/useAsyncData';

const EQUIPMENT: Equipment[] = [
  'barra',
  'mancuernas',
  'máquina',
  'polea',
  'peso corporal',
  'kettlebell',
  'banda elástica',
  'otro',
];

export function ExercisesView() {
  const announce = useAnnounce();
  const { data: exercises, reload } = useAsyncData(useCallback(() => getAllExercises(), []));
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<Exercise | null>(null);
  const [form, setForm] = useState({ name: '', muscleGroup: 'pecho', equipment: 'barra', instructions: '' });
  const [formError, setFormError] = useState<string | undefined>();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    return (exercises ?? []).filter(
      (e) =>
        (!group || e.muscleGroup === (group as MuscleGroup)) &&
        (!q || e.name.toLocaleLowerCase('es').includes(q)),
    );
  }, [exercises, query, group]);

  async function createExercise() {
    const name = form.name.trim();
    if (!name) {
      setFormError('Escribe el nombre del ejercicio');
      return;
    }
    await addCustomExercise({
      name,
      muscleGroup: form.muscleGroup as MuscleGroup,
      equipment: form.equipment as Equipment,
      instructions: form.instructions.trim(),
    });
    setCreating(false);
    setForm({ name: '', muscleGroup: 'pecho', equipment: 'barra', instructions: '' });
    await reload();
    announce(`Ejercicio ${name} creado`);
  }

  return (
    <>
      <span className="kicker">{exercises?.length ?? '—'} movimientos en español</span>
      <h1 id="view-title" tabIndex={-1}>
        Ejercicios
      </h1>

      <div className="card">
        <TextField label="Buscar por nombre" value={query} onChange={setQuery} />
        <SelectField label="Filtrar por grupo muscular" value={group} onChange={setGroup}>
          <option value="">Todos los grupos</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </SelectField>
        <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
          + Nuevo ejercicio personalizado
        </button>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {filtered.length} ejercicios en la lista
      </p>

      <ul className="item-list">
        {filtered.map((exercise) => (
          <li key={exercise.id}>
            <ExerciseImage exerciseId={exercise.id} />
            <div style={{ flex: 1 }}>
              <span className="title">
                {exercise.name}
                {exercise.isCustom && (
                  <span className="pr-badge badge--steel" style={{ marginLeft: '0.5rem' }}>
                    propio
                  </span>
                )}
              </span>
              <br />
              <span className="meta">
                {exercise.muscleGroup} · {exercise.equipment}
              </span>
              <div className="btn-row" style={{ gap: '0.25rem' }}>
                {exercise.instructions && (
                  <button
                    type="button"
                    className="btn btn--small btn--ghost"
                    onClick={() => setDetail(exercise)}
                  >
                    Cómo se hace<span className="visually-hidden">: {exercise.name}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--small btn--ghost"
                  onClick={() => setHistory(exercise)}
                >
                  Mi progreso<span className="visually-hidden"> en {exercise.name}</span>
                </button>
              </div>
            </div>
            {exercise.isCustom && (
              <button
                type="button"
                className="btn btn--small btn--danger"
                onClick={() => setToDelete({ id: exercise.id, name: exercise.name })}
              >
                Eliminar<span className="visually-hidden"> {exercise.name}</span>
              </button>
            )}
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="muted">
            Ningún ejercicio coincide. Prueba con otro nombre o grupo muscular, o crea el tuyo con
            «+ Nuevo ejercicio personalizado».
          </li>
        )}
      </ul>

      {detail && (
        <AppDialog open={detail !== null} title={detail.name} onClose={() => setDetail(null)}>
          <div className="exercise-detail">
            <ExerciseImage exerciseId={detail.id} size={200} />
            <p className="meta-line">
              <span className="pr-badge">{detail.muscleGroup}</span>
              <span className="muted"> · {detail.equipment}</span>
            </p>
            <p className="color-legend muted">
              En la ilustración: <strong className="legend-primary">naranja</strong> = músculo
              principal · <strong className="legend-secondary">verde azulado</strong> = secundarios
            </p>
            <p className="instructions">{detail.instructions}</p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  const ex = detail;
                  setDetail(null);
                  setHistory(ex);
                }}
              >
                Ver mi progreso
              </button>
              <button type="button" className="btn" onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </AppDialog>
      )}

      {history && (
        <ExerciseHistoryDialog
          open={history !== null}
          exerciseId={history.id}
          exerciseName={history.name}
          onClose={() => setHistory(null)}
        />
      )}

      <AppDialog open={creating} title="Nuevo ejercicio personalizado" onClose={() => setCreating(false)}>
        <TextField
          label="Nombre"
          value={form.name}
          onChange={(name) => {
            setForm({ ...form, name });
            setFormError(undefined);
          }}
          error={formError}
          required
        />
        <SelectField
          label="Grupo muscular"
          value={form.muscleGroup}
          onChange={(muscleGroup) => setForm({ ...form, muscleGroup })}
        >
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Material"
          value={form.equipment}
          onChange={(equipment) => setForm({ ...form, equipment })}
        >
          {EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>
              {eq}
            </option>
          ))}
        </SelectField>
        <TextAreaField
          label="Instrucciones (opcional)"
          hint="Describe brevemente cómo ejecutarlo con buena técnica."
          value={form.instructions}
          onChange={(instructions) => setForm({ ...form, instructions })}
        />
        <div className="btn-row">
          <button type="button" className="btn btn--primary" onClick={createExercise}>
            Crear ejercicio
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setCreating(false)}>
            Cancelar
          </button>
        </div>
      </AppDialog>

      <ConfirmDialog
        open={toDelete !== null}
        title={`¿Eliminar "${toDelete?.name ?? ''}"?`}
        description="Solo se elimina el ejercicio de la biblioteca; tu historial no cambia."
        confirmLabel="Sí, eliminar"
        onConfirm={async () => {
          if (toDelete) {
            await removeCustomExercise(toDelete.id);
            await reload();
            announce(`Ejercicio ${toDelete.name} eliminado`);
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
