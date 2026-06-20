import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import { draftFromSession } from './trainDraft';

const session: Session = {
  id: 's1',
  date: '2026-06-15T10:00:00.000Z',
  routineId: 'rutina-empuje',
  entries: [
    {
      exerciseId: 'press-banca',
      note: 'Buen día',
      sets: [
        { reps: 8, weightKg: 60, done: true },
        { reps: 6, weightKg: 62.5, done: true, type: 'fallo', rpe: 9 },
        { reps: 12, weightKg: 20, done: true, type: 'calentamiento' },
      ],
    },
  ],
};

describe('draftFromSession', () => {
  it('copia ejercicios, reps, pesos (coma decimal), tipo y nota', () => {
    const draft = draftFromSession(session, '2026-06-20T09:00:00.000Z');
    expect(draft.startedAt).toBe('2026-06-20T09:00:00.000Z');
    expect(draft.routineId).toBe('rutina-empuje');
    expect(draft.entries).toHaveLength(1);
    const entry = draft.entries[0]!;
    expect(entry.exerciseId).toBe('press-banca');
    expect(entry.note).toBe('Buen día');
    expect(entry.sets[0]).toEqual({ reps: '8', weight: '60', done: false });
    expect(entry.sets[1]).toEqual({ reps: '6', weight: '62,5', done: false, type: 'fallo' });
    expect(entry.sets[2]).toEqual({ reps: '12', weight: '20', done: false, type: 'calentamiento' });
  });

  it('reinicia el estado completado y descarta el RPE (es de cada día)', () => {
    const draft = draftFromSession(session, '2026-06-20T09:00:00.000Z');
    for (const set of draft.entries[0]!.sets) {
      expect(set.done).toBe(false);
      expect(set).not.toHaveProperty('rpe');
    }
  });
});
