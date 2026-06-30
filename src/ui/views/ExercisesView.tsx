// CAPA 3 · Interfaz — Biblioteca de ejercicios: catálogo propio en español
// + ejercicios personalizados sin límite (Strong: 3, Hevy: 7).
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { HowToIcon, ProgressIcon, StarIcon, TrashIcon } from '../components/icons';
import { loadFavorites, saveFavorites, sortByFavorite, toggleFavorite } from '../favorites';
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
  const [equipment, setEquipment] = useState('');
  const [favorites, setFavorites] = useState(loadFavorites);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<Exercise | null>(null);
  const [form, setForm] = useState({ name: '', muscleGroup: 'pecho', equipment: 'barra', instructions: '' });
  const [formError, setFormError] = useState<string | undefined>();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    const matches = (exercises ?? []).filter(
      (e) =>
        (!group || e.muscleGroup === (group as MuscleGroup)) &&
        (!equipment || e.equipment === (equipment as Equipment)) &&
        (!onlyFavorites || favorites.has(e.id)) &&
        (!q || e.name.toLocaleLowerCase('es').includes(q)),
    );
    return sortByFavorite(matches, favorites);
  }, [exercises, query, group, equipment, onlyFavorites, favorites]);

  // Persistencia separada del updater (que es puro): una sola escritura por cambio.
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  function onToggleFavorite(exercise: Exercise) {
    const wasFavorite = favorites.has(exercise.id);
    setFavorites((prev) => toggleFavorite(prev, exercise.id));
    announce(
      wasFavorite
        ? `${exercise.name} quitado de favoritos`
        : `${exercise.name} añadido a favoritos`,
    );
  }

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
        <div className="field-row">
          <SelectField label="Grupo muscular" value={group} onChange={setGroup}>
            <option value="">Todos los grupos</option>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </SelectField>
          <SelectField label="Equipamiento" value={equipment} onChange={setEquipment}>
            <option value="">Todo el material</option>
            {EQUIPMENT.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="btn-row">
          <button
            type="button"
            className={`btn btn--small ${onlyFavorites ? 'btn--primary' : 'btn--ghost'}`}
            aria-pressed={onlyFavorites}
            onClick={() => setOnlyFavorites((v) => !v)}
          >
            <span className="fav-ico" aria-hidden="true">{StarIcon}</span> Solo favoritos
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
            + Nuevo ejercicio personalizado
          </button>
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {filtered.length} ejercicios en la lista
      </p>

      <ul className="item-list">
        {filtered.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              className={`fav-toggle ${favorites.has(exercise.id) ? 'is-fav' : ''}`}
              aria-pressed={favorites.has(exercise.id)}
              aria-label={
                favorites.has(exercise.id)
                  ? `Quitar ${exercise.name} de favoritos`
                  : `Marcar ${exercise.name} como favorito`
              }
              onClick={() => onToggleFavorite(exercise)}
            >
              <span aria-hidden="true">{StarIcon}</span>
            </button>
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
            </div>
            <div className="row-actions">
              {exercise.instructions && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setDetail(exercise)}
                  title="Cómo se hace"
                  aria-label={`Cómo se hace: ${exercise.name}`}
                >
                  {HowToIcon}
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                onClick={() => setHistory(exercise)}
                title="Mi progreso"
                aria-label={`Mi progreso en ${exercise.name}`}
              >
                {ProgressIcon}
              </button>
              {exercise.isCustom && (
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  onClick={() => setToDelete({ id: exercise.id, name: exercise.name })}
                  title="Eliminar"
                  aria-label={`Eliminar ${exercise.name}`}
                >
                  {TrashIcon}
                </button>
              )}
            </div>
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
