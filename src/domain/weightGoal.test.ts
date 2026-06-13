import { describe, expect, it } from 'vitest';
import { projectWeightGoal } from './weightGoal';

describe('projectWeightGoal', () => {
  it('proyecta una pérdida de peso a un ritmo sano', () => {
    // 80 → 75 kg (5 kg) a 0,5 kg/semana = 10 semanas = 70 días
    const r = projectWeightGoal(80, 75, 0.5, '2026-06-12')!;
    expect(r.direction).toBe('perder');
    expect(r.totalKg).toBe(5);
    expect(r.totalDays).toBe(70);
    // 0,5 kg/sem × 7700 / 7 ≈ 550 kcal/día de déficit
    expect(r.dailyKcal).toBe(550);
    expect(r.targetDate).toBe('2026-08-21');
    expect(r.warning).toBeNull();
  });

  it('proyecta una ganancia de peso', () => {
    const r = projectWeightGoal(70, 75, 0.25, '2026-06-12')!;
    expect(r.direction).toBe('ganar');
    expect(r.totalKg).toBe(5);
    expect(r.totalDays).toBe(140);
    expect(r.dailyKcal).toBe(275);
  });

  it('detecta "mantener" cuando ya estás en el objetivo', () => {
    const r = projectWeightGoal(75, 75, 0.5, '2026-06-12')!;
    expect(r.direction).toBe('mantener');
    expect(r.totalDays).toBe(0);
    expect(r.targetDate).toBe('2026-06-12');
  });

  it('avisa si el ritmo es agresivo (>1% del peso por semana)', () => {
    const r = projectWeightGoal(80, 70, 1.5, '2026-06-12')!;
    expect(r.warning).toMatch(/agresivo/);
  });

  it('rechaza entradas inválidas', () => {
    expect(projectWeightGoal(0, 70, 0.5, '2026-06-12')).toBeNull();
    expect(projectWeightGoal(80, 70, 0, '2026-06-12')).toBeNull();
    expect(projectWeightGoal(80, 70, -1, '2026-06-12')).toBeNull();
  });
});
