import { describe, expect, it } from 'vitest';
import { canAddRoutines, FREE_ROUTINE_LIMIT } from './premium';

describe('freemium: límite de rutinas', () => {
  it('gratis: permite hasta el límite y bloquea al superarlo', () => {
    expect(canAddRoutines(0, 1, false).allowed).toBe(true);
    expect(canAddRoutines(FREE_ROUTINE_LIMIT - 1, 1, false).allowed).toBe(true);
    expect(canAddRoutines(FREE_ROUTINE_LIMIT, 1, false).allowed).toBe(false);
  });

  it('gratis: un plan de varios días respeta los huecos que quedan', () => {
    expect(canAddRoutines(1, 3, false).allowed).toBe(true); // 1+3 = 4
    expect(canAddRoutines(2, 3, false).allowed).toBe(false); // 2+3 = 5
    expect(canAddRoutines(2, 3, false).remaining).toBe(2);
  });

  it('premium: siempre permitido', () => {
    expect(canAddRoutines(100, 5, true).allowed).toBe(true);
  });
});
