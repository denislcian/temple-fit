import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import { computeProfileStats, EMPTY_STATS } from './profileStats';

function session(date: string, exerciseId: string, reps: number, weightKg: number): Session {
  return {
    id: `s-${date}-${exerciseId}`,
    date: `${date}T10:00:00.000Z`,
    entries: [{ exerciseId, sets: [{ reps, weightKg, done: true }] }],
  };
}

describe('computeProfileStats', () => {
  it('sin sesiones → todo a cero', () => {
    expect(computeProfileStats([], '2026-06-25')).toEqual(EMPTY_STATS);
  });

  it('agrega sesiones, volumen y mejores marcas', () => {
    const stats = computeProfileStats(
      [
        session('2026-06-20', 'press-banca', 5, 80),
        session('2026-06-22', 'sentadilla', 5, 100),
      ],
      '2026-06-25',
    );
    expect(stats.sessions).toBe(2);
    expect(stats.volumeKg).toBe(5 * 80 + 5 * 100);
    // La sentadilla a 100 kg tiene mayor 1RM estimado que el press a 80.
    expect(stats.bestLifts[0]?.exerciseId).toBe('sentadilla');
    expect(stats.bestLifts.length).toBeLessThanOrEqual(3);
  });
});
