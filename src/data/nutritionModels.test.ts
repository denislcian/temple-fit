import { describe, expect, it } from 'vitest';
import { macrosForGrams, type MacroAmounts } from './nutritionModels';

const per100: MacroAmounts = { kcal: 200, proteinG: 20, carbsG: 10, fatG: 8 };

describe('macrosForGrams', () => {
  it('escala los macros proporcionalmente a los gramos', () => {
    expect(macrosForGrams(per100, 150)).toEqual({
      kcal: 300,
      proteinG: 30,
      carbsG: 15,
      fatG: 12,
    });
  });

  it('devuelve ceros con 0 gramos', () => {
    expect(macrosForGrams(per100, 0)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it('blinda gramos negativos a 0 (no corrompe el diario con macros negativos)', () => {
    expect(macrosForGrams(per100, -50)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });

  it('blinda valores no finitos (NaN/Infinity) a 0', () => {
    expect(macrosForGrams(per100, NaN)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
    expect(macrosForGrams(per100, Infinity)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  });
});
