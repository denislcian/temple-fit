import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/dbTestUtils';
import { CATALOG } from '../catalog';
import { ensureSeeded } from '../seed';
import {
  addCustomExercise,
  getAllExercises,
  getExerciseById,
  getExercisesByGroup,
  removeCustomExercise,
  updateExercise,
} from './exerciseRepo';

describe('exerciseRepo', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('siembra el catálogo completo una sola vez (idempotente)', async () => {
    await ensureSeeded();
    await ensureSeeded(); // segunda llamada: no debe duplicar
    const all = await getAllExercises();
    expect(all).toHaveLength(CATALOG.length);
    expect(CATALOG.length).toBeGreaterThanOrEqual(50);
  });

  it('devuelve los ejercicios ordenados alfabéticamente en español', async () => {
    await ensureSeeded();
    const all = await getAllExercises();
    const names = all.map((e) => e.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
  });

  it('filtra por grupo muscular', async () => {
    await ensureSeeded();
    const pierna = await getExercisesByGroup('pierna');
    expect(pierna.length).toBeGreaterThan(0);
    expect(pierna.every((e) => e.muscleGroup === 'pierna')).toBe(true);
  });

  it('crea ejercicios personalizados sin límite', async () => {
    await ensureSeeded();
    for (let i = 1; i <= 10; i++) {
      await addCustomExercise({
        name: `Ejercicio personalizado ${i}`,
        muscleGroup: 'core',
        equipment: 'otro',
        instructions: 'Instrucciones del usuario.',
      });
    }
    const all = await getAllExercises();
    expect(all.filter((e) => e.isCustom)).toHaveLength(10);
  });

  it('actualiza un ejercicio personalizado', async () => {
    const created = await addCustomExercise({
      name: 'Mi ejercicio',
      muscleGroup: 'pecho',
      equipment: 'banda elástica',
      instructions: 'Versión 1',
    });
    await updateExercise(created.id, { instructions: 'Versión 2' });
    const updated = await getExerciseById(created.id);
    expect(updated?.instructions).toBe('Versión 2');
  });

  it('elimina ejercicios personalizados pero protege el catálogo', async () => {
    await ensureSeeded();
    const custom = await addCustomExercise({
      name: 'Temporal',
      muscleGroup: 'core',
      equipment: 'otro',
      instructions: 'Borrar después.',
    });
    await removeCustomExercise(custom.id);
    expect(await getExerciseById(custom.id)).toBeUndefined();

    await expect(removeCustomExercise('press-banca')).rejects.toThrow(
      /catálogo no se pueden eliminar/,
    );
    expect(await getExerciseById('press-banca')).toBeDefined();
  });
});
