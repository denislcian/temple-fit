// CAPA 1 · Datos — Repositorio de nutrición: alimentos y diario.
import { db } from '../db';
import { FOOD_CATALOG } from '../foodCatalog';
import { newId } from '../models';
import type { DiaryEntry, FoodItem, MacroAmounts, Meal } from '../nutritionModels';
import { macrosForGrams, sumMacros } from '../nutritionModels';

/** Siembra el catálogo de alimentos si está vacío (idempotente). */
export async function ensureFoodsSeeded(): Promise<void> {
  const count = await db.foods.count();
  if (count > 0) return;
  await db.foods.bulkAdd([...FOOD_CATALOG]);
}

export async function searchFoods(query: string, limit = 20): Promise<FoodItem[]> {
  const q = query.trim().toLocaleLowerCase('es');
  const all = await db.foods.toArray();
  return all
    .filter((f) => !q || f.name.toLocaleLowerCase('es').includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .slice(0, limit);
}

export async function getFoodByBarcode(barcode: string): Promise<FoodItem | undefined> {
  return db.foods.where('barcode').equals(barcode).first();
}

/** Guarda un alimento del usuario o de Open Food Facts (caché local). */
export async function saveFood(data: Omit<FoodItem, 'id'> & { id?: string }): Promise<FoodItem> {
  const food: FoodItem = { ...data, id: data.id ?? newId() };
  await db.foods.put(food);
  return food;
}

export async function removeFood(id: string): Promise<void> {
  const food = await db.foods.get(id);
  if (!food) return;
  if (food.source === 'catalogo') {
    throw new Error('Los alimentos del catálogo no se pueden eliminar');
  }
  await db.foods.delete(id);
}

// ── Diario ────────────────────────────────────────────────

export async function getDiary(date: string): Promise<DiaryEntry[]> {
  return db.diary.where('date').equals(date).toArray();
}

export interface NewDiaryInput {
  date: string;
  meal: Meal;
  foodName: string;
  foodId?: string;
  grams: number;
  /** Macros POR 100 g del alimento. */
  per100: MacroAmounts;
}

export async function addDiaryEntry(input: NewDiaryInput): Promise<DiaryEntry> {
  const macros = macrosForGrams(input.per100, input.grams);
  const entry: DiaryEntry = {
    id: newId(),
    date: input.date,
    meal: input.meal,
    foodName: input.foodName,
    ...(input.foodId ? { foodId: input.foodId } : {}),
    grams: input.grams,
    ...macros,
  };
  await db.diary.add(entry);
  return entry;
}

/** Añade una entrada cuyos macros ya vienen calculados en absoluto
 *  (escáner por foto o dieta generada). */
export async function addDiaryEntryAbsolute(input: {
  date: string;
  meal: Meal;
  foodName: string;
  foodId?: string;
  grams: number;
  macros: MacroAmounts;
}): Promise<DiaryEntry> {
  const entry: DiaryEntry = {
    id: newId(),
    date: input.date,
    meal: input.meal,
    foodName: input.foodName,
    ...(input.foodId ? { foodId: input.foodId } : {}),
    grams: input.grams,
    ...input.macros,
  };
  await db.diary.add(entry);
  return entry;
}

export async function removeDiaryEntry(id: string): Promise<void> {
  await db.diary.delete(id);
}

export function dayTotals(entries: DiaryEntry[]): MacroAmounts {
  return sumMacros(entries);
}
