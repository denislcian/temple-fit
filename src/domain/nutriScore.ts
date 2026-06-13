// CAPA 2 · Dominio — Health score de alimentos (algoritmo Nutri-Score 2023).
//
// Cal AI y similares muestran una "puntuación de salud" pero no publican su
// fórmula. Aquí se implementa el Nutri-Score oficial (versión 2023 para
// alimentos sólidos generales), que SÍ es público y auditable. Función pura,
// testeada con valores conocidos.
//
// Requiere micronutrientes (azúcares, grasa saturada, sal, fibra) que solo
// están disponibles cuando el alimento viene de Open Food Facts o los
// introduce el usuario; por eso la UI solo muestra el score si hay datos.

/** Nutrientes por 100 g necesarios para el cálculo. */
export interface NutriInput {
  kcal: number;
  sugarsG: number;
  satFatG: number;
  saltG: number;
  proteinG: number;
  fiberG: number;
  /** % de fruta, verdura y legumbre (0-100). Si se desconoce, se asume 0. */
  fvlPct?: number;
}

export type NutriLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export interface NutriScore {
  points: number;
  letter: NutriLetter;
}

// Umbrales oficiales 2023 (alimentos generales). Cada array da los puntos
// según el primer umbral que el valor NO supera; si los supera todos, el
// máximo. Energía se evalúa en kJ (1 kcal = 4,184 kJ).
const ENERGY_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SUGARS = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51];
const SAT_FAT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SALT = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4];
const FIBER = [3, 4.1, 5.2, 6.3, 7.4];
const PROTEIN = [2.4, 4.8, 7.2, 9.6, 12, 14, 17];

/** Puntos = nº de umbrales superados (0..thresholds.length). */
function points(value: number, thresholds: number[]): number {
  let p = 0;
  for (const t of thresholds) {
    if (value > t) p++;
    else break;
  }
  return p;
}

function fvlPoints(pct: number): number {
  if (pct > 80) return 5;
  if (pct > 60) return 2;
  if (pct > 40) return 1;
  return 0;
}

function letterFor(score: number): NutriLetter {
  if (score <= 0) return 'A';
  if (score <= 2) return 'B';
  if (score <= 10) return 'C';
  if (score <= 18) return 'D';
  return 'E';
}

/** Calcula el Nutri-Score (puntos y letra A-E) de un alimento por 100 g. */
export function nutriScore(input: NutriInput): NutriScore {
  const energyKj = input.kcal * 4.184;
  const negative =
    points(energyKj, ENERGY_KJ) +
    points(input.sugarsG, SUGARS) +
    points(input.satFatG, SAT_FAT) +
    points(input.saltG, SALT);

  const fvl = fvlPoints(input.fvlPct ?? 0);
  const fiber = points(input.fiberG, FIBER);
  const protein = points(input.proteinG, PROTEIN);

  // La proteína solo cuenta si el total negativo es bajo (<11) o si el
  // alimento es muy rico en fruta/verdura (FVL = 5 puntos).
  const proteinCounts = negative < 11 || fvl === 5;
  const positive = fvl + fiber + (proteinCounts ? protein : 0);

  const score = negative - positive;
  return { points: score, letter: letterFor(score) };
}

export const NUTRI_DESCRIPTIONS: Record<NutriLetter, string> = {
  A: 'Muy buena opción nutricional',
  B: 'Buena opción nutricional',
  C: 'Opción aceptable, con moderación',
  D: 'De consumo ocasional',
  E: 'Mejor reservarlo a un capricho puntual',
};

/** Alimento con los micronutrientes opcionales necesarios para el score. */
interface ScorableFood {
  kcal: number;
  proteinG: number;
  sugarsG?: number;
  satFatG?: number;
  saltG?: number;
  fiberG?: number;
}

/**
 * Nutri-Score de un alimento, o null si no tiene los micronutrientes
 * necesarios (azúcares, grasa saturada, sal): solo se puede calcular para
 * alimentos de Open Food Facts o de etiqueta escaneada, no para el catálogo
 * básico que solo guarda los 4 macros.
 */
export function foodNutriScore(food: ScorableFood): NutriScore | null {
  if (food.sugarsG === undefined || food.satFatG === undefined || food.saltG === undefined) {
    return null;
  }
  return nutriScore({
    kcal: food.kcal,
    proteinG: food.proteinG,
    sugarsG: food.sugarsG,
    satFatG: food.satFatG,
    saltG: food.saltG,
    fiberG: food.fiberG ?? 0,
  });
}
