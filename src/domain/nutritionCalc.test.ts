import { describe, expect, it } from 'vitest';
import {
  bmi,
  bmiCategory,
  bmrMifflin,
  bodyFatCategory,
  bodyFatNavy,
  calorieTarget,
  macroSplit,
  proteinRange,
  tdee,
  waterMl,
} from './nutritionCalc';

describe('bmrMifflin (Mifflin-St Jeor)', () => {
  it('hombre 80 kg, 180 cm, 30 años = 1780 kcal', () => {
    expect(bmrMifflin('hombre', 80, 180, 30)).toBe(1780);
  });
  it('mujer 60 kg, 165 cm, 30 años = 1320 kcal', () => {
    expect(bmrMifflin('mujer', 60, 165, 30)).toBe(1320);
  });
});

describe('tdee y calorieTarget', () => {
  it('TDEE = BMR × factor de actividad', () => {
    expect(tdee(1780, 'moderado')).toBe(2759); // 1780 × 1.55
    expect(tdee(1780, 'sedentario')).toBe(2136); // 1780 × 1.2
  });
  it('objetivo: -20 % definición, +12 % volumen, igual mantenimiento', () => {
    expect(calorieTarget(2759, 'definicion')).toBe(2207);
    expect(calorieTarget(2759, 'mantenimiento')).toBe(2759);
    expect(calorieTarget(2759, 'volumen')).toBe(3090);
  });
});

describe('proteinRange', () => {
  it('mantenimiento 80 kg = 128-160 g (1,6-2,0 g/kg)', () => {
    expect(proteinRange(80, 'mantenimiento')).toEqual({ minG: 128, maxG: 160 });
  });
  it('definición sube el extremo alto (1,8-2,4 g/kg)', () => {
    expect(proteinRange(80, 'definicion')).toEqual({ minG: 144, maxG: 192 });
  });
});

describe('waterMl', () => {
  it('≈ 35 ml/kg redondeado a 50', () => {
    expect(waterMl(80)).toBe(2800);
  });
  it('suelo de 1500 ml', () => {
    expect(waterMl(40)).toBe(1500);
  });
});

describe('bmi y categoría (OMS)', () => {
  it('80 kg, 180 cm = 24,7 (peso normal)', () => {
    expect(bmi(80, 180)).toBe(24.7);
    expect(bmiCategory(24.7)).toBe('Peso normal');
  });
  it('categorías por umbral', () => {
    expect(bmiCategory(17)).toBe('Bajo peso');
    expect(bmiCategory(27)).toBe('Sobrepeso');
    expect(bmiCategory(31)).toBe('Obesidad');
  });
});

describe('bodyFatNavy (Hodgdon-Beckett)', () => {
  it('hombre ≈ 16 % para medidas típicas', () => {
    expect(bodyFatNavy('hombre', 180, 38, 85)).toBeCloseTo(16.2, 0);
  });
  it('mujer ≈ 28 % para medidas típicas', () => {
    expect(bodyFatNavy('mujer', 165, 32, 75, 95)).toBeCloseTo(27.7, 0);
  });
  it('null si la cintura no supera el cuello (hombre)', () => {
    expect(bodyFatNavy('hombre', 180, 40, 38)).toBeNull();
  });
  it('null si falta la cadera (mujer)', () => {
    expect(bodyFatNavy('mujer', 165, 32, 75)).toBeNull();
  });
});

describe('bodyFatCategory (ACE)', () => {
  it('hombre', () => {
    expect(bodyFatCategory('hombre', 12)).toBe('Atleta');
    expect(bodyFatCategory('hombre', 20)).toBe('Aceptable');
    expect(bodyFatCategory('hombre', 28)).toBe('Obesidad');
  });
  it('mujer', () => {
    expect(bodyFatCategory('mujer', 19)).toBe('Atleta');
    expect(bodyFatCategory('mujer', 28)).toBe('Aceptable');
  });
});

describe('macroSplit', () => {
  it('proteína fijada, grasa al 25 % kcal, hidratos el resto', () => {
    expect(macroSplit(2200, 160, 80)).toEqual({ proteinG: 160, fatG: 61, carbsG: 253 });
  });
  it('los hidratos nunca son negativos', () => {
    expect(macroSplit(800, 200, 80).carbsG).toBeGreaterThanOrEqual(0);
  });
});
