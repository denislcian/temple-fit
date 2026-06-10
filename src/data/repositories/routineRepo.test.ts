import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/dbTestUtils';
import {
  addRoutine,
  getAllRoutines,
  getRoutineById,
  removeRoutine,
  updateRoutine,
} from './routineRepo';

describe('routineRepo', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('crea rutinas sin límite (Strong limita a 3, Hevy a 4)', async () => {
    for (let i = 1; i <= 12; i++) {
      await addRoutine({ name: `Rutina ${String(i).padStart(2, '0')}`, exerciseIds: [] });
    }
    expect(await getAllRoutines()).toHaveLength(12);
  });

  it('guarda el orden de los ejercicios de la rutina', async () => {
    const routine = await addRoutine({
      name: 'Empuje',
      exerciseIds: ['press-banca', 'press-militar', 'fondos-paralelas'],
    });
    const stored = await getRoutineById(routine.id);
    expect(stored?.exerciseIds).toEqual(['press-banca', 'press-militar', 'fondos-paralelas']);
  });

  it('actualiza y elimina rutinas', async () => {
    const routine = await addRoutine({ name: 'Pierna', exerciseIds: ['sentadilla'] });
    await updateRoutine(routine.id, { exerciseIds: ['sentadilla', 'hip-thrust'] });
    expect((await getRoutineById(routine.id))?.exerciseIds).toHaveLength(2);

    await removeRoutine(routine.id);
    expect(await getRoutineById(routine.id)).toBeUndefined();
  });
});
