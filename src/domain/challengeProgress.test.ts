import { describe, expect, it } from 'vitest';
import type { Session } from '../data/models';
import { daysLeft, isActive, trainingDaysInWindow } from './challengeProgress';

function session(date: string, withWork = true): Session {
  return {
    id: `s-${date}`,
    date: `${date}T10:00:00.000Z`,
    entries: [
      { exerciseId: 'press-banca', sets: [{ reps: 5, weightKg: 60, done: withWork }] },
    ],
  };
}

describe('trainingDaysInWindow', () => {
  const window = { start: '2026-06-22', end: '2026-06-28' };

  it('cuenta días distintos con trabajo dentro de la ventana', () => {
    const sessions = [
      session('2026-06-22'),
      session('2026-06-22'), // mismo día → no cuenta dos veces
      session('2026-06-24'),
      session('2026-06-30'), // fuera de ventana
      session('2026-06-20'), // fuera de ventana
    ];
    expect(trainingDaysInWindow(sessions, window.start, window.end)).toBe(2);
  });

  it('ignora sesiones sin series efectivas', () => {
    expect(trainingDaysInWindow([session('2026-06-23', false)], window.start, window.end)).toBe(0);
  });

  it('incluye los extremos de la ventana', () => {
    const sessions = [session('2026-06-22'), session('2026-06-28')];
    expect(trainingDaysInWindow(sessions, window.start, window.end)).toBe(2);
  });
});

describe('daysLeft / isActive', () => {
  it('calcula los días restantes', () => {
    expect(daysLeft('2026-06-28', '2026-06-25')).toBe(3);
    expect(daysLeft('2026-06-24', '2026-06-25')).toBe(0);
  });

  it('el reto está activo hasta su último día inclusive', () => {
    expect(isActive('2026-06-25', '2026-06-25')).toBe(true);
    expect(isActive('2026-06-24', '2026-06-25')).toBe(false);
  });
});
