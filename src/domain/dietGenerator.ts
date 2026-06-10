// CAPA 2 · Dominio — Generador de dietas con alimentos reales.
// Para cada comida se eligen un alimento proteico, uno de carbohidratos y
// una grasa (más verdura/fruta fija) y se resuelven los GRAMOS exactos con
// un sistema lineal 3×3 (proteína, carbohidratos y grasa de la comida).
// Determinista: mismas opciones → misma dieta; el parámetro `variant`
// rota los alimentos para generar menús distintos.
import type { FoodItem, MacroAmounts, Meal } from '../data/nutritionModels';
import { macrosForGrams, sumMacros } from '../data/nutritionModels';
import type { MacroTargets } from './nutritionTargets';

export interface DietItem extends MacroAmounts {
  foodId: string;
  foodName: string;
  grams: number;
}

export interface DietMeal {
  meal: Meal;
  items: DietItem[];
  totals: MacroAmounts;
}

export interface DietPlan {
  meals: DietMeal[];
  totals: MacroAmounts;
  targets: MacroTargets;
}

/** Reparto de las calorías del día entre comidas. */
const MEAL_SHARE: Array<{ meal: Meal; share: number }> = [
  { meal: 'desayuno', share: 0.25 },
  { meal: 'comida', share: 0.35 },
  { meal: 'cena', share: 0.3 },
  { meal: 'snack', share: 0.1 },
];

// Roles de los alimentos del catálogo en el menú.
const PROTEIN_LUNCH = ['pechuga-pollo', 'ternera-magra', 'merluza', 'pavo-pechuga', 'salmon'];
const PROTEIN_DINNER = ['huevo', 'merluza', 'atun-natural', 'bacalao', 'tofu'];
const PROTEIN_BREAKFAST = ['yogur-proteico', 'queso-fresco-batido', 'huevo', 'requeson'];
const CARB_MAIN = ['arroz-blanco', 'patata', 'pasta', 'arroz-integral', 'quinoa', 'boniato'];
const CARB_BREAKFAST = ['avena', 'pan-integral', 'tortitas-arroz'];
const FAT_SOURCES = ['aceite-oliva', 'aguacate', 'almendras', 'nueces'];
const VEG = ['brocoli', 'tomate', 'espinacas', 'pimiento', 'calabacin'];
const FRUIT = ['platano', 'manzana', 'naranja', 'fresas', 'kiwi'];
const SNACK_PROTEIN = ['yogur-proteico', 'queso-fresco-batido', 'kefir'];

function pick(pool: string[], foods: Map<string, FoodItem>, variant: number): FoodItem {
  const available = pool.filter((id) => foods.has(id));
  if (available.length === 0) {
    throw new Error('El catálogo de alimentos no contiene los básicos necesarios para generar la dieta');
  }
  return foods.get(available[variant % available.length]!)!;
}

/**
 * Resuelve A·x = b (3×3) por la regla de Cramer.
 * x = gramos/100 de cada alimento; A = macros por 100 g; b = objetivo.
 */
function solve3x3(a: number[][], b: number[]): number[] | null {
  const det = (m: number[][]) =>
    m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
    m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
    m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);

  const d = det(a);
  if (Math.abs(d) < 1e-9) return null;

  const replaceCol = (m: number[][], col: number) =>
    m.map((row, i) => row.map((v, j) => (j === col ? b[i]! : v)));

  return [0, 1, 2].map((col) => det(replaceCol(a, col)) / d);
}

function buildMeal(
  meal: Meal,
  targets: MacroTargets,
  share: number,
  protein: FoodItem,
  carb: FoodItem,
  fat: FoodItem,
  extra: FoodItem,
  extraGrams: number,
): DietMeal {
  const extraMacros = macrosForGrams(extra, extraGrams);
  // Objetivo de la comida menos lo que ya aporta la verdura/fruta fija.
  const goal = [
    Math.max(0, targets.proteinG * share - extraMacros.proteinG),
    Math.max(0, targets.carbsG * share - extraMacros.carbsG),
    Math.max(0, targets.fatG * share - extraMacros.fatG),
  ];
  // Columnas: [proteico, carbo, graso]; filas: [proteína, carbos, grasa].
  const matrix = [
    [protein.proteinG, carb.proteinG, fat.proteinG],
    [protein.carbsG, carb.carbsG, fat.carbsG],
    [protein.fatG, carb.fatG, fat.fatG],
  ];

  const solution = solve3x3(matrix, goal) ?? [
    goal[0]! / Math.max(protein.proteinG, 1),
    goal[1]! / Math.max(carb.carbsG, 1),
    goal[2]! / Math.max(fat.fatG, 1),
  ];

  const round5 = (g: number) => Math.max(0, Math.round((g * 100) / 5) * 5);
  const grams = [round5(solution[0]!), round5(solution[1]!), round5(solution[2]!)];

  const items: DietItem[] = [
    { food: protein, grams: grams[0]! },
    { food: carb, grams: grams[1]! },
    { food: fat, grams: grams[2]! },
    { food: extra, grams: extraGrams },
  ]
    .filter((x) => x.grams > 0)
    .map((x) => ({
      foodId: x.food.id,
      foodName: x.food.name,
      grams: x.grams,
      ...macrosForGrams(x.food, x.grams),
    }));

  return { meal, items, totals: sumMacros(items) };
}

/** Genera el menú de un día completo para unos objetivos de macros. */
export function generateDiet(
  targets: MacroTargets,
  foods: FoodItem[],
  variant = 0,
): DietPlan {
  const byId = new Map(foods.map((f) => [f.id, f]));

  const meals: DietMeal[] = MEAL_SHARE.map(({ meal, share }) => {
    if (meal === 'desayuno') {
      return buildMeal(
        meal,
        targets,
        share,
        pick(PROTEIN_BREAKFAST, byId, variant),
        pick(CARB_BREAKFAST, byId, variant),
        pick(FAT_SOURCES, byId, variant + 2),
        pick(FRUIT, byId, variant),
        120,
      );
    }
    if (meal === 'comida') {
      return buildMeal(
        meal,
        targets,
        share,
        pick(PROTEIN_LUNCH, byId, variant),
        pick(CARB_MAIN, byId, variant),
        pick(FAT_SOURCES, byId, variant),
        pick(VEG, byId, variant),
        150,
      );
    }
    if (meal === 'cena') {
      return buildMeal(
        meal,
        targets,
        share,
        pick(PROTEIN_DINNER, byId, variant + 1),
        pick(CARB_MAIN, byId, variant + 3),
        pick(FAT_SOURCES, byId, variant + 1),
        pick(VEG, byId, variant + 2),
        150,
      );
    }
    return buildMeal(
      meal,
      targets,
      share,
      pick(SNACK_PROTEIN, byId, variant),
      pick(FRUIT, byId, variant + 1),
      pick(FAT_SOURCES, byId, variant + 3),
      pick(FRUIT, byId, variant + 3),
      0,
    );
  });

  return {
    meals,
    totals: sumMacros(meals.map((m) => m.totals)),
    targets,
  };
}
