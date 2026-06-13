import { describe, expect, it } from 'vitest';
import { nutriScore } from './nutriScore';

describe('nutriScore', () => {
  it('puntúa un alimento neutro (todo 0) como A', () => {
    const r = nutriScore({ kcal: 0, sugarsG: 0, satFatG: 0, saltG: 0, proteinG: 0, fiberG: 0 });
    expect(r.points).toBe(0);
    expect(r.letter).toBe('A');
  });

  it('pechuga de pollo: alta proteína, baja en negativos → A', () => {
    // 165 kcal (690 kJ→2), azúcar 0, satFat 1 (→0), sal 0,1 (→0): N=2
    // proteína 31 (→7), N<11 cuenta proteína: 2 − 7 = −5 → A
    const r = nutriScore({
      kcal: 165,
      sugarsG: 0,
      satFatG: 1,
      saltG: 0.1,
      proteinG: 31,
      fiberG: 0,
    });
    expect(r.points).toBe(-5);
    expect(r.letter).toBe('A');
  });

  it('aceite de oliva: muy calórico y graso → E', () => {
    // 884 kcal (3698 kJ→10), satFat 14 (→10): N=20; sin positivos relevantes
    const r = nutriScore({
      kcal: 884,
      sugarsG: 0,
      satFatG: 14,
      saltG: 0,
      proteinG: 0,
      fiberG: 0,
    });
    expect(r.points).toBe(20);
    expect(r.letter).toBe('E');
  });

  it('refresco azucarado tratado como alimento general → C', () => {
    // 42 kcal (176 kJ→0), azúcar 10,6 (→3): N=3, sin positivos → 3 → C
    const r = nutriScore({
      kcal: 42,
      sugarsG: 10.6,
      satFatG: 0,
      saltG: 0,
      proteinG: 0,
      fiberG: 0,
    });
    expect(r.points).toBe(3);
    expect(r.letter).toBe('C');
  });

  it('con N alto, la proteína NO descuenta salvo que FVL sea máximo', () => {
    const base = { kcal: 900, sugarsG: 40, satFatG: 12, saltG: 3, proteinG: 20, fiberG: 0 };
    // N = energía(10) + azúcar(11) + satFat(10) + sal(14) = 45; N≥11 y FVL≠5 →
    // la proteína (7) no cuenta: score = 45 − 0 = 45
    const sinFvl = nutriScore(base);
    expect(sinFvl.points).toBe(45);
    // con FVL=5 (>80%), la proteína sí cuenta: 45 − (5 + 7) = 33
    const conFvl = nutriScore({ ...base, fvlPct: 90 });
    expect(conFvl.points).toBe(33);
  });

  it('la fibra y la fruta/verdura mejoran la nota', () => {
    const sinFibra = nutriScore({ kcal: 200, sugarsG: 12, satFatG: 2, saltG: 0.5, proteinG: 3, fiberG: 0 });
    const conFibra = nutriScore({ kcal: 200, sugarsG: 12, satFatG: 2, saltG: 0.5, proteinG: 3, fiberG: 8, fvlPct: 85 });
    expect(conFibra.points).toBeLessThan(sinFibra.points);
  });
});
