import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import { sessionVolume, setVolume, volumeByExercise, weeklyVolume, weekStartOf } from './volume';

function session(date: string, entries: Session['entries']): Session {
  return { id: date, date, entries };
}

describe('volume', () => {
  it('volumen de una serie = reps × peso', () => {
    expect(setVolume({ reps: 8, weightKg: 60, done: true })).toBe(480);
  });

  it('el volumen de sesión solo cuenta series completadas', () => {
    const s = session('2026-06-08T10:00:00.000Z', [
      {
        exerciseId: 'press-banca',
        sets: [
          { reps: 8, weightKg: 60, done: true },
          { reps: 8, weightKg: 60, done: false }, // planificada pero no hecha
        ],
      },
    ]);
    expect(sessionVolume(s)).toBe(480);
  });

  it('desglosa el volumen por ejercicio', () => {
    const s = session('2026-06-08T10:00:00.000Z', [
      { exerciseId: 'press-banca', sets: [{ reps: 10, weightKg: 50, done: true }] },
      { exerciseId: 'sentadilla', sets: [{ reps: 5, weightKg: 100, done: true }] },
      { exerciseId: 'plancha', sets: [{ reps: 60, weightKg: 0, done: true }] },
    ]);
    const byExercise = volumeByExercise(s);
    expect(byExercise.get('press-banca')).toBe(500);
    expect(byExercise.get('sentadilla')).toBe(500);
    expect(byExercise.has('plancha')).toBe(false); // volumen 0 no se lista
  });

  it('las series de calentamiento no cuentan para el volumen', () => {
    const s = session('2026-06-08T10:00:00.000Z', [
      {
        exerciseId: 'press-banca',
        sets: [
          { reps: 10, weightKg: 20, done: true, type: 'calentamiento' },
          { reps: 8, weightKg: 60, done: true, type: 'normal' },
          { reps: 6, weightKg: 60, done: true }, // sin type = normal
        ],
      },
    ]);
    // Solo cuentan las dos de trabajo: 8×60 + 6×60 = 840 (el calentamiento se excluye)
    expect(sessionVolume(s)).toBe(840);
  });

  it('weekStartOf devuelve el lunes de la semana (UTC)', () => {
    expect(weekStartOf('2026-06-10T18:00:00.000Z')).toBe('2026-06-08'); // miércoles → lunes
    expect(weekStartOf('2026-06-08T00:00:00.000Z')).toBe('2026-06-08'); // lunes → lunes
    expect(weekStartOf('2026-06-14T23:59:00.000Z')).toBe('2026-06-08'); // domingo → lunes anterior
  });

  it('agrupa el volumen por semanas y las ordena cronológicamente', () => {
    const sessions: Session[] = [
      session('2026-06-10T10:00:00.000Z', [
        { exerciseId: 'a', sets: [{ reps: 10, weightKg: 10, done: true }] },
      ]),
      session('2026-06-02T10:00:00.000Z', [
        { exerciseId: 'a', sets: [{ reps: 10, weightKg: 20, done: true }] },
      ]),
      session('2026-06-12T10:00:00.000Z', [
        { exerciseId: 'a', sets: [{ reps: 10, weightKg: 30, done: true }] },
      ]),
    ];
    expect(weeklyVolume(sessions)).toEqual([
      { weekStart: '2026-06-01', volumeKg: 200 },
      { weekStart: '2026-06-08', volumeKg: 400 },
    ]);
  });
});
