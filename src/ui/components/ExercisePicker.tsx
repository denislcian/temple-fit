// CAPA 3 · Interfaz — Selector de ejercicio con búsqueda y filtro por grupo.
import { useMemo, useState } from 'react';
import type { Exercise, MuscleGroup } from '../../data/models';
import { MUSCLE_GROUPS } from '../../data/models';
import { AppDialog } from './AppDialog';
import { SelectField, TextField } from './Field';

interface ExercisePickerProps {
  open: boolean;
  exercises: Exercise[];
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ open, exercises, onPick, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    return exercises.filter(
      (e) =>
        (!group || e.muscleGroup === (group as MuscleGroup)) &&
        (!q || e.name.toLocaleLowerCase('es').includes(q)),
    );
  }, [exercises, query, group]);

  return (
    <AppDialog open={open} title="Elegir ejercicio" onClose={onClose}>
      <TextField label="Buscar por nombre" value={query} onChange={setQuery} />
      <SelectField label="Grupo muscular" value={group} onChange={setGroup}>
        <option value="">Todos</option>
        {MUSCLE_GROUPS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </SelectField>

      <p className="visually-hidden" aria-live="polite">
        {filtered.length} ejercicios disponibles
      </p>

      {filtered.length > 30 && (
        <p className="hint">
          Mostrando 30 de {filtered.length} ejercicios. Usa la búsqueda o el filtro para encontrar
          el resto.
        </p>
      )}

      <ul className="item-list">
        {filtered.slice(0, 30).map((exercise) => (
          <li key={exercise.id}>
            <div>
              <span className="title">{exercise.name}</span>
              <br />
              <span className="meta">
                {exercise.muscleGroup} · {exercise.equipment}
              </span>
            </div>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => {
                onPick(exercise);
                onClose();
              }}
            >
              Añadir<span className="visually-hidden"> {exercise.name}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li>No hay ejercicios que coincidan con la búsqueda.</li>}
      </ul>

      <div className="btn-row" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </AppDialog>
  );
}
