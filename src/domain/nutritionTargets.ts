// CAPA 2 · Dominio — Objetivos calóricos y de macros.
// Fórmula de Mifflin-St Jeor (la referencia clínica actual para BMR)
// + factor de actividad + ajuste por objetivo + reparto de macros.
// Funciones puras: testeadas al 100%, sin dependencias.

export type Sex = 'hombre' | 'mujer';
export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'alto';
export type NutritionGoal = 'definicion' | 'mantenimiento' | 'volumen';

export interface BodyProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: NutritionGoal;
}

export interface MacroTargets {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentario (trabajo de oficina, sin ejercicio)',
  ligero: 'Ligero (1-3 entrenamientos/semana)',
  moderado: 'Moderado (3-5 entrenamientos/semana)',
  alto: 'Alto (6-7 entrenamientos/semana o trabajo físico)',
};

export const GOAL_ADJUSTMENT: Record<NutritionGoal, number> = {
  definicion: -0.2, // déficit del 20%
  mantenimiento: 0,
  volumen: 0.1, // superávit del 10%
};

export const NUTRITION_GOAL_LABELS: Record<NutritionGoal, string> = {
  definicion: 'Definición (perder grasa)',
  mantenimiento: 'Mantenimiento',
  volumen: 'Volumen (ganar músculo)',
};

/** Metabolismo basal (kcal/día) según Mifflin-St Jeor. */
export function bmr(profile: Pick<BodyProfile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  assertPositive(profile.age, 'edad');
  assertPositive(profile.heightCm, 'altura');
  assertPositive(profile.weightKg, 'peso');
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(base + (profile.sex === 'hombre' ? 5 : -161));
}

/** Gasto energético diario total (kcal/día). */
export function tdee(profile: Pick<BodyProfile, 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activity'>): number {
  return Math.round(bmr(profile) * ACTIVITY_FACTORS[profile.activity]);
}

/**
 * Objetivos diarios de calorías y macros.
 * Proteína: 1,8-2,2 g/kg según objetivo (rango respaldado para entrenamiento
 * de fuerza). Grasa: 25% de las kcal (mínimo 0,6 g/kg). Carbohidratos: resto.
 */
export function macroTargets(profile: BodyProfile): MacroTargets {
  const kcal = Math.round(tdee(profile) * (1 + GOAL_ADJUSTMENT[profile.goal]));

  const proteinPerKg = profile.goal === 'definicion' ? 2.2 : profile.goal === 'volumen' ? 1.8 : 2.0;
  const proteinG = Math.round(profile.weightKg * proteinPerKg);

  const fatG = Math.max(Math.round((kcal * 0.25) / 9), Math.round(profile.weightKg * 0.6));

  const remainingKcal = kcal - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(0, Math.round(remainingKcal / 4));

  return { kcal, proteinG, carbsG, fatG };
}

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`El valor de ${name} debe ser un número mayor que 0`);
  }
}
