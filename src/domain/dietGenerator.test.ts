import { describe, expect, it } from 'vitest';
import { FOOD_CATALOG } from '../data/foodCatalog';
import { generateDiet } from './dietGenerator';
import type { MacroTargets } from './nutritionTargets';

const targets: MacroTargets = { kcal: 2500, proteinG: 160, carbsG: 290, fatG: 70 };
const foods = [...FOOD_CATALOG];

describe('dietGenerator', () => {
  it('genera 4 comidas con alimentos reales del catálogo', () => {
    const plan = generateDiet(targets, foods);
    expect(plan.meals.map((m) => m.meal)).toEqual(['desayuno', 'comida', 'cena', 'snack']);
    const ids = new Set(foods.map((f) => f.id));
    for (const meal of plan.meals) {
      expect(meal.items.length).toBeGreaterThanOrEqual(2);
      for (const item of meal.items) {
        expect(ids.has(item.foodId)).toBe(true);
        expect(item.grams).toBeGreaterThan(0);
      }
    }
  });

  it('los totales del día se acercan a los objetivos (±12%)', () => {
    const plan = generateDiet(targets, foods);
    expect(Math.abs(plan.totals.proteinG - targets.proteinG) / targets.proteinG).toBeLessThan(0.12);
    expect(Math.abs(plan.totals.carbsG - targets.carbsG) / targets.carbsG).toBeLessThan(0.12);
    expect(Math.abs(plan.totals.fatG - targets.fatG) / targets.fatG).toBeLessThan(0.15);
    expect(Math.abs(plan.totals.kcal - targets.kcal) / targets.kcal).toBeLessThan(0.12);
  });

  it('funciona también con objetivos de definición más bajos', () => {
    const cut: MacroTargets = { kcal: 1800, proteinG: 150, carbsG: 160, fatG: 55 };
    const plan = generateDiet(cut, foods);
    expect(Math.abs(plan.totals.kcal - cut.kcal) / cut.kcal).toBeLessThan(0.15);
    expect(plan.totals.proteinG).toBeGreaterThan(cut.proteinG * 0.85);
  });

  it('es determinista y las variantes producen menús distintos', () => {
    const a = generateDiet(targets, foods, 0);
    const b = generateDiet(targets, foods, 0);
    const c = generateDiet(targets, foods, 1);
    expect(a).toEqual(b);
    const idsA = a.meals.flatMap((m) => m.items.map((i) => i.foodId)).join(',');
    const idsC = c.meals.flatMap((m) => m.items.map((i) => i.foodId)).join(',');
    expect(idsA).not.toEqual(idsC);
  });

  it('lanza un error claro si faltan los alimentos básicos', () => {
    expect(() => generateDiet(targets, [])).toThrow(/catálogo de alimentos/);
  });
});
