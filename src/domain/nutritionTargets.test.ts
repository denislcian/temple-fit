import { describe, expect, it } from 'vitest';
import { bmr, macroTargets, tdee, type BodyProfile } from './nutritionTargets';

const hombre: BodyProfile = {
  sex: 'hombre',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'moderado',
  goal: 'mantenimiento',
};

describe('nutritionTargets', () => {
  it('calcula el BMR con Mifflin-St Jeor (valores de referencia)', () => {
    // Hombre 80 kg, 180 cm, 30 años: 800 + 1125 − 150 + 5 = 1780
    expect(bmr(hombre)).toBe(1780);
    // Mujer 60 kg, 165 cm, 25 años: 600 + 1031,25 − 125 − 161 = 1345,25 → 1345
    expect(bmr({ sex: 'mujer', age: 25, heightCm: 165, weightKg: 60 })).toBe(1345);
  });

  it('aplica el factor de actividad al TDEE', () => {
    expect(tdee(hombre)).toBe(Math.round(1780 * 1.55)); // 2759
    expect(tdee({ ...hombre, activity: 'sedentario' })).toBe(2136);
  });

  it('ajusta las calorías según el objetivo', () => {
    expect(macroTargets(hombre).kcal).toBe(2759);
    expect(macroTargets({ ...hombre, goal: 'definicion' }).kcal).toBe(Math.round(2759 * 0.8));
    expect(macroTargets({ ...hombre, goal: 'volumen' }).kcal).toBe(Math.round(2759 * 1.1));
  });

  it('reparte macros: proteína por peso corporal, grasa 25%, resto carbohidratos', () => {
    const targets = macroTargets(hombre); // mantenimiento: 2,0 g/kg
    expect(targets.proteinG).toBe(160);
    expect(targets.fatG).toBe(Math.round((2759 * 0.25) / 9)); // 77
    const kcalFromMacros = targets.proteinG * 4 + targets.carbsG * 4 + targets.fatG * 9;
    expect(Math.abs(kcalFromMacros - targets.kcal)).toBeLessThanOrEqual(5);
  });

  it('en definición sube la proteína a 2,2 g/kg para preservar músculo', () => {
    expect(macroTargets({ ...hombre, goal: 'definicion' }).proteinG).toBe(176);
  });

  it('rechaza datos corporales inválidos con errores claros', () => {
    expect(() => bmr({ ...hombre, age: 0 })).toThrow(/edad/);
    expect(() => bmr({ ...hombre, heightCm: -1 })).toThrow(/altura/);
    expect(() => bmr({ ...hombre, weightKg: NaN })).toThrow(/peso/);
  });
});
