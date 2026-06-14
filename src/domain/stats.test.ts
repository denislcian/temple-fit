import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import { exerciseProgression, exerciseStats, summarizeProgress, totals } from './stats';

const sessions: Session[] = [
  {
    id: 's2',
    date: '2026-06-08T10:00:00.000Z',
    entries: [
      { exerciseId: 'press-banca', sets: [{ reps: 8, weightKg: 65, done: true }] },
      { exerciseId: 'plancha', sets: [{ reps: 60, weightKg: 0, done: false }] },
    ],
  },
  {
    id: 's1',
    date: '2026-06-01T10:00:00.000Z',
    entries: [
      {
        exerciseId: 'press-banca',
        sets: [
          { reps: 8, weightKg: 60, done: true },
          { reps: 6, weightKg: 62.5, done: true },
        ],
      },
    ],
  },
];

describe('stats', () => {
  it('construye la progresión de un ejercicio ordenada por fecha', () => {
    const points = exerciseProgression(sessions, 'press-banca');
    expect(points.map((p) => p.date)).toEqual(['2026-06-01', '2026-06-08']);
    expect(points[0]?.topWeightKg).toBe(62.5);
    expect(points[0]?.volumeKg).toBe(8 * 60 + 6 * 62.5);
    expect(points[1]?.best1RM).toBeGreaterThan(65);
  });

  it('ignora sesiones donde el ejercicio no tiene series completadas', () => {
    expect(exerciseProgression(sessions, 'plancha')).toEqual([]);
    expect(exerciseProgression(sessions, 'inexistente')).toEqual([]);
  });

  it('resume el progreso para la alternativa textual de las gráficas', () => {
    const summary = summarizeProgress([60, 62.5, 65, 72.5]);
    expect(summary).toEqual({
      firstValue: 60,
      lastValue: 72.5,
      deltaAbs: 12.5,
      deltaPct: 20.8,
      points: 4,
    });
  });

  it('summarizeProgress maneja series vacías y con inicio en 0', () => {
    expect(summarizeProgress([])).toBeNull();
    expect(summarizeProgress([0, 100])?.deltaPct).toBeNull();
  });

  it('calcula los totales históricos (solo series completadas)', () => {
    expect(totals(sessions)).toEqual({
      sessions: 2,
      sets: 3,
      reps: 22,
      volumeKg: 8 * 65 + 8 * 60 + 6 * 62.5,
    });
  });

  it('resume el historial de un ejercicio concreto', () => {
    const stats = exerciseStats(sessions, 'press-banca');
    expect(stats.sessionCount).toBe(2);
    expect(stats.setCount).toBe(3);
    expect(stats.totalVolumeKg).toBe(8 * 65 + 8 * 60 + 6 * 62.5);
    expect(stats.lastDate).toBe('2026-06-08T10:00:00.000Z');
  });

  it('exerciseStats ignora ejercicios sin series efectivas', () => {
    expect(exerciseStats(sessions, 'plancha').sessionCount).toBe(0);
    expect(exerciseStats(sessions, 'inexistente').lastDate).toBeNull();
  });
});
