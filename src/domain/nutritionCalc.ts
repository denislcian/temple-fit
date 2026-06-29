// CAPA 2 · Dominio — Calculadora nutricional. Funciones PURAS y testeables que
// implementan estándares públicos y citados (ver src/data/formulaReferences.ts),
// no cajas negras: gasto energético (Mifflin-St Jeor), proteína (ISSN), agua
// (EFSA), grasa corporal (Marina EE. UU.), IMC (OMS) y reparto de macros.

export type Sex = 'hombre' | 'mujer';
export type Activity = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy-activo';
export type Goal = 'definicion' | 'mantenimiento' | 'volumen';

/** Factores de actividad física (PAL) sobre el metabolismo basal. */
export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  'muy-activo': 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentario: 'Sedentario (oficina, poco movimiento)',
  ligero: 'Ligero (1-3 entrenos/semana)',
  moderado: 'Moderado (3-5 entrenos/semana)',
  activo: 'Activo (6-7 entrenos/semana)',
  'muy-activo': 'Muy activo (físico + 2 al día)',
};

export const GOAL_LABELS: Record<Goal, string> = {
  definicion: 'Definición (perder grasa)',
  mantenimiento: 'Mantenimiento',
  volumen: 'Volumen (ganar músculo)',
};

/** Metabolismo basal (kcal/día) — ecuación de Mifflin-St Jeor (1990). */
export function bmrMifflin(sex: Sex, kg: number, cm: number, age: number): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return Math.round(base + (sex === 'hombre' ? 5 : -161));
}

/** Gasto energético total diario = BMR × factor de actividad. */
export function tdee(bmr: number, activity: Activity): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activity]);
}

/** Calorías objetivo según meta: -20 % en definición, +12 % en volumen. */
export function calorieTarget(tdeeValue: number, goal: Goal): number {
  const factor = goal === 'definicion' ? 0.8 : goal === 'volumen' ? 1.12 : 1;
  return Math.round(tdeeValue * factor);
}

/** Rango de proteína diaria (g) según objetivo. Ancla ISSN 1,4-2,0 g/kg, con el
 *  extremo alto en déficit para preservar masa magra. */
export function proteinRange(kg: number, goal: Goal): { minG: number; maxG: number } {
  const perKg =
    goal === 'definicion'
      ? { min: 1.8, max: 2.4 }
      : goal === 'volumen'
        ? { min: 1.6, max: 2.2 }
        : { min: 1.6, max: 2.0 };
  return { minG: Math.round(kg * perKg.min), maxG: Math.round(kg * perKg.max) };
}

/** Agua diaria estimada (ml) ≈ 35 ml/kg, con suelo razonable. */
export function waterMl(kg: number): number {
  return Math.max(1500, Math.round((35 * kg) / 50) * 50);
}

/** Índice de masa corporal (OMS). */
export function bmi(kg: number, cm: number): number {
  const m = cm / 100;
  return Math.round((kg / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return 'Bajo peso';
  if (value < 25) return 'Peso normal';
  if (value < 30) return 'Sobrepeso';
  return 'Obesidad';
}

/** % de grasa corporal — método de circunferencias de la Marina de EE. UU.
 *  (Hodgdon-Beckett, 1984). Medidas en cm; devuelve null si faltan o no son
 *  válidas (p. ej. cintura ≤ cuello). */
export function bodyFatNavy(
  sex: Sex,
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm?: number,
): number | null {
  const toIn = (cm: number) => cm / 2.54;
  const height = toIn(heightCm);
  const neck = toIn(neckCm);
  const waist = toIn(waistCm);
  if (height <= 0 || neck <= 0 || waist <= 0) return null;

  let bf: number;
  if (sex === 'hombre') {
    if (waist - neck <= 0) return null;
    bf = 86.01 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
  } else {
    if (hipCm === undefined || hipCm <= 0) return null;
    const hip = toIn(hipCm);
    if (waist + hip - neck <= 0) return null;
    bf = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
  }
  if (!Number.isFinite(bf)) return null;
  return Math.round(Math.min(60, Math.max(2, bf)) * 10) / 10;
}

/** Clasificación de % de grasa (American Council on Exercise). */
export function bodyFatCategory(sex: Sex, bf: number): string {
  if (sex === 'hombre') {
    if (bf < 6) return 'Esencial';
    if (bf < 14) return 'Atleta';
    if (bf < 18) return 'Fitness';
    if (bf < 25) return 'Aceptable';
    return 'Obesidad';
  }
  if (bf < 14) return 'Esencial';
  if (bf < 21) return 'Atleta';
  if (bf < 25) return 'Fitness';
  if (bf < 32) return 'Aceptable';
  return 'Obesidad';
}

/** Reparto de macros: proteína fijada, grasa al 25 % de las calorías (dentro del
 *  rango AMDR), e hidratos con el resto. */
export function macroSplit(
  calories: number,
  proteinG: number,
  kg: number,
): { proteinG: number; fatG: number; carbsG: number } {
  const fatG = Math.max(Math.round(0.6 * kg), Math.round((0.25 * calories) / 9));
  const carbsKcal = Math.max(0, calories - proteinG * 4 - fatG * 9);
  return { proteinG, fatG, carbsG: Math.round(carbsKcal / 4) };
}
