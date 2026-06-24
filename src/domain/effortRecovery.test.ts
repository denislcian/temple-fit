import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import type { SleepSession } from '../data/sleepModels';
import { effortRecoveryInsight, weeklyEffortRecovery } from './effortRecovery';

function session(date: string, rpes: number[]): Session {
  return {
    id: `s-${date}`,
    date: `${date}T10:00:00.000Z`,
    entries: [{ exerciseId: 'press-banca', sets: rpes.map((rpe) => ({ reps: 5, weightKg: 80, done: true, rpe })) }],
  };
}

function night(date: string, durationMin: number): SleepSession {
  return { id: `n-${date}`, date, startedAt: `${date}T23:00:00Z`, endedAt: `${date}T07:00:00Z`, durationMin, levels: [], events: [], snoreCount: 0, noiseCount: 0 };
}

describe('weeklyEffortRecovery', () => {
  it('agrega RPE y sueño por semana', () => {
    const series = weeklyEffortRecovery(
      [session('2026-06-01', [8, 9])],
      [night('2026-06-02', 420), night('2026-06-03', 480)],
    );
    expect(series).toHaveLength(1);
    expect(series[0]!.avgRpe).toBe(8.5);
    expect(series[0]!.avgSleepMin).toBe(450);
  });

  it('detecta correlación inversa sueño↔RPE', () => {
    // 3 semanas: menos sueño → más RPE.
    const series = weeklyEffortRecovery(
      [session('2026-06-01', [7]), session('2026-06-08', [8]), session('2026-06-15', [10])],
      [night('2026-06-01', 480), night('2026-06-08', 420), night('2026-06-15', 330)],
    );
    expect(series.length).toBeGreaterThanOrEqual(3);
    expect(effortRecoveryInsight(series)).toMatch(/menos sueño/i);
  });

  it('sin datos suficientes → sin frase de correlación', () => {
    const series = weeklyEffortRecovery([session('2026-06-01', [8])], [night('2026-06-01', 450)]);
    expect(effortRecoveryInsight(series)).toBeNull();
  });
});
