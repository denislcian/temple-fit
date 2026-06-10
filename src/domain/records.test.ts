import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import { beatsRecord, computeRecords } from './records';

const sessions: Session[] = [
  {
    id: 's1',
    date: '2026-05-01T10:00:00.000Z',
    entries: [
      {
        exerciseId: 'press-banca',
        sets: [
          { reps: 8, weightKg: 60, done: true },
          { reps: 3, weightKg: 70, done: true },
        ],
      },
    ],
  },
  {
    id: 's2',
    date: '2026-06-01T10:00:00.000Z',
    entries: [
      {
        exerciseId: 'press-banca',
        sets: [
          { reps: 10, weightKg: 60, done: true },
          { reps: 1, weightKg: 80, done: false }, // fallida: no cuenta
        ],
      },
    ],
  },
];

describe('records', () => {
  it('calcula el mejor peso y el mejor 1RM estimado por ejercicio', () => {
    const records = computeRecords(sessions);
    const pr = records.get('press-banca');
    expect(pr).toBeDefined();
    // Mejor peso: 70 kg × 3 (la serie de 80 no se completó)
    expect(pr?.bestWeight).toEqual({ weightKg: 70, reps: 3, date: '2026-05-01T10:00:00.000Z' });
    // Mejor 1RM: 60 × 10 estima más que 70 × 3
    expect(pr?.best1RM.weightKg).toBe(60);
    expect(pr?.best1RM.reps).toBe(10);
    expect(pr?.best1RM.estimated1RM).toBeGreaterThan(75);
  });

  it('a igual peso, gana la serie con más repeticiones', () => {
    const records = computeRecords([
      {
        id: 's',
        date: '2026-06-01T10:00:00.000Z',
        entries: [
          {
            exerciseId: 'remo-barra',
            sets: [
              { reps: 5, weightKg: 50, done: true },
              { reps: 8, weightKg: 50, done: true },
            ],
          },
        ],
      },
    ]);
    expect(records.get('remo-barra')?.bestWeight.reps).toBe(8);
  });

  it('beatsRecord detecta nuevos PRs (cualquier serie en un ejercicio nuevo lo es)', () => {
    const records = computeRecords(sessions);
    expect(beatsRecord(records, 'press-banca', 72.5, 1)).toBe(true); // más peso
    expect(beatsRecord(records, 'press-banca', 60, 12)).toBe(true); // mejor 1RM estimado
    expect(beatsRecord(records, 'press-banca', 50, 5)).toBe(false);
    expect(beatsRecord(records, 'sentadilla', 20, 5)).toBe(true); // primer registro
    expect(beatsRecord(records, 'press-banca', 100, 0)).toBe(false); // serie sin reps
  });

  it('devuelve un mapa vacío sin historial', () => {
    expect(computeRecords([]).size).toBe(0);
  });
});
