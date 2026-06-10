import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/dbTestUtils';
import { FOOD_CATALOG } from '../foodCatalog';
import {
  addDiaryEntry,
  addDiaryEntryAbsolute,
  dayTotals,
  ensureFoodsSeeded,
  getDiary,
  getFoodByBarcode,
  removeDiaryEntry,
  removeFood,
  saveFood,
  searchFoods,
} from './nutritionRepo';

describe('nutritionRepo', () => {
  beforeEach(async () => {
    await resetDb();
    await ensureFoodsSeeded();
  });

  it('siembra el catálogo de alimentos una sola vez', async () => {
    await ensureFoodsSeeded();
    const all = await searchFoods('', 500);
    expect(all).toHaveLength(FOOD_CATALOG.length);
  });

  it('busca alimentos por nombre sin distinguir mayúsculas', async () => {
    const results = await searchFoods('POLLO');
    expect(results.some((f) => f.id === 'pechuga-pollo')).toBe(true);
  });

  it('guarda alimentos de OFF y los encuentra por código de barras', async () => {
    await saveFood({
      name: 'Crema de cacao',
      kcal: 539,
      proteinG: 6.3,
      carbsG: 57.5,
      fatG: 30.9,
      source: 'off',
      barcode: '3017620422003',
    });
    const found = await getFoodByBarcode('3017620422003');
    expect(found?.name).toBe('Crema de cacao');
  });

  it('protege el catálogo: solo se borran alimentos propios o de OFF', async () => {
    await expect(removeFood('avena')).rejects.toThrow(/catálogo/);
    const custom = await saveFood({
      name: 'Mi batido',
      kcal: 120,
      proteinG: 20,
      carbsG: 6,
      fatG: 2,
      source: 'personalizado',
    });
    await removeFood(custom.id);
    expect((await searchFoods('Mi batido')).length).toBe(0);
  });

  it('el diario calcula los macros para los gramos consumidos', async () => {
    await addDiaryEntry({
      date: '2026-06-11',
      meal: 'desayuno',
      foodName: 'Copos de avena',
      foodId: 'avena',
      grams: 80,
      per100: { kcal: 379, proteinG: 13, carbsG: 67, fatG: 6.5 },
    });
    const entries = await getDiary('2026-06-11');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kcal).toBe(303); // 379 × 0,8
    expect(entries[0]?.proteinG).toBe(10.4);
  });

  it('acepta entradas con macros absolutos (foto IA, dietas) y suma el día', async () => {
    await addDiaryEntryAbsolute({
      date: '2026-06-11',
      meal: 'comida',
      foodName: 'Plato combinado (foto IA)',
      grams: 350,
      macros: { kcal: 620, proteinG: 42, carbsG: 55, fatG: 24 },
    });
    await addDiaryEntryAbsolute({
      date: '2026-06-11',
      meal: 'cena',
      foodName: 'Ensalada',
      grams: 200,
      macros: { kcal: 180, proteinG: 8, carbsG: 12, fatG: 11 },
    });
    const totals = dayTotals(await getDiary('2026-06-11'));
    expect(totals.kcal).toBe(800);
    expect(totals.proteinG).toBe(50);
  });

  it('elimina entradas del diario sin afectar a otros días', async () => {
    const entry = await addDiaryEntryAbsolute({
      date: '2026-06-11',
      meal: 'snack',
      foodName: 'Plátano',
      grams: 120,
      macros: { kcal: 107, proteinG: 1.3, carbsG: 27.6, fatG: 0.4 },
    });
    await addDiaryEntryAbsolute({
      date: '2026-06-12',
      meal: 'snack',
      foodName: 'Manzana',
      grams: 150,
      macros: { kcal: 78, proteinG: 0.5, carbsG: 21, fatG: 0.3 },
    });
    await removeDiaryEntry(entry.id);
    expect(await getDiary('2026-06-11')).toHaveLength(0);
    expect(await getDiary('2026-06-12')).toHaveLength(1);
  });
});
