import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/dbTestUtils';
import {
  addSession,
  getAllSessions,
  getLastSetsForExercise,
  getSessionById,
  removeSession,
  updateSession,
} from './sessionRepo';

function makeSession(date: string, exerciseId: string, weightKg: number) {
  return {
    date,
    entries: [
      {
        exerciseId,
        sets: [
          { reps: 8, weightKg, done: true },
          { reps: 6, weightKg: weightKg + 2.5, done: true },
        ],
      },
    ],
  };
}

describe('sessionRepo', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('guarda sesiones y devuelve el historial de más reciente a más antigua', async () => {
    await addSession(makeSession('2026-06-01T10:00:00.000Z', 'press-banca', 60));
    await addSession(makeSession('2026-06-08T10:00:00.000Z', 'press-banca', 62.5));
    await addSession(makeSession('2026-06-05T10:00:00.000Z', 'sentadilla', 80));

    const sessions = await getAllSessions();
    expect(sessions.map((s) => s.date.slice(0, 10))).toEqual([
      '2026-06-08',
      '2026-06-05',
      '2026-06-01',
    ]);
  });

  it('recupera las series de la última sesión de un ejercicio (precarga 3.3.7)', async () => {
    await addSession(makeSession('2026-06-01T10:00:00.000Z', 'press-banca', 60));
    await addSession(makeSession('2026-06-08T10:00:00.000Z', 'press-banca', 62.5));

    const last = await getLastSetsForExercise('press-banca');
    expect(last).not.toBeNull();
    expect(last?.[0]?.weightKg).toBe(62.5);
  });

  it('devuelve null si el ejercicio nunca se ha entrenado', async () => {
    expect(await getLastSetsForExercise('dominadas')).toBeNull();
  });

  it('actualiza y elimina sesiones', async () => {
    const created = await addSession(makeSession('2026-06-01T10:00:00.000Z', 'remo-barra', 50));
    await updateSession(created.id, { notes: 'Buen día de espalda' });
    expect((await getSessionById(created.id))?.notes).toBe('Buen día de espalda');

    await removeSession(created.id);
    expect(await getSessionById(created.id)).toBeUndefined();
  });
});
