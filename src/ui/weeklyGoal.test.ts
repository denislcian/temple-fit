import { beforeEach, describe, expect, it } from 'vitest';
import { loadWeeklyGoal, MAX_GOAL, MIN_GOAL, saveWeeklyGoal } from './weeklyGoal';

describe('weeklyGoal', () => {
  beforeEach(() => localStorage.clear());

  it('por defecto devuelve 4', () => {
    expect(loadWeeklyGoal()).toBe(4);
  });

  it('guarda y recupera el objetivo', () => {
    saveWeeklyGoal(5);
    expect(loadWeeklyGoal()).toBe(5);
  });

  it('limita el objetivo al rango permitido', () => {
    expect(saveWeeklyGoal(0)).toBe(MIN_GOAL);
    expect(saveWeeklyGoal(99)).toBe(MAX_GOAL);
  });

  it('ignora valores corruptos y vuelve al defecto', () => {
    localStorage.setItem('forjafit-weekly-goal', 'no-soy-un-numero');
    expect(loadWeeklyGoal()).toBe(4);
  });
});
