// CAPA 1 · Datos — Cliente de Open Food Facts (API abierta, sin API key).
// Datos bajo licencia ODbL (https://world.openfoodfacts.org/data).
// Límites documentados: 10 búsquedas/min y 15 lecturas de producto/min por
// IP — esta app hace peticiones puntuales iniciadas por el usuario y cachea
// los resultados elegidos en la base local (ver nutritionRepo.saveFood).
import type { MacroAmounts } from './nutritionModels';

export interface OffProduct extends MacroAmounts {
  name: string;
  barcode: string;
}

interface OffNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffRawProduct {
  product_name?: string;
  code?: string;
  nutriments?: OffNutriments;
}

function toProduct(raw: OffRawProduct): OffProduct | null {
  const n = raw.nutriments;
  if (!raw.product_name || !raw.code || !n || typeof n['energy-kcal_100g'] !== 'number') {
    return null;
  }
  return {
    name: raw.product_name,
    barcode: raw.code,
    kcal: Math.round(n['energy-kcal_100g']),
    proteinG: round1(n.proteins_100g ?? 0),
    carbsG: round1(n.carbohydrates_100g ?? 0),
    fatG: round1(n.fat_100g ?? 0),
  };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

async function fetchJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    // El limitador de OFF (10 búsquedas/min) responde sin cabeceras CORS,
    // así que el navegador lo ve como un fallo de red genérico: hay que
    // distinguirlo de estar realmente sin conexión.
    if (!navigator.onLine) {
      throw new Error('Sin conexión: la búsqueda online necesita internet (tu diario sigue funcionando offline)');
    }
    throw new Error(
      'Open Food Facts no responde (suele ser su límite de peticiones por minuto). Prueba en un momento o usa el código de barras.',
    );
  }
  if (response.status === 429) {
    throw new Error('Open Food Facts pide un respiro (límite de peticiones). Espera un minuto.');
  }
  if (!response.ok) {
    throw new Error(`Open Food Facts respondió con un error (${response.status})`);
  }
  return response.json();
}

/** Búsqueda por nombre de producto. */
export async function searchOffByName(query: string): Promise<OffProduct[]> {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&page_size=10' +
    '&fields=product_name,code,nutriments' +
    `&search_terms=${encodeURIComponent(query)}`;
  const data = (await fetchJson(url)) as { products?: OffRawProduct[] };
  return (data.products ?? []).map(toProduct).filter((p): p is OffProduct => p !== null);
}

/** Consulta por código de barras (EAN). */
export async function getOffByBarcode(barcode: string): Promise<OffProduct | null> {
  const code = barcode.replace(/\D/g, '');
  if (!code) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,code,nutriments`;
  const data = (await fetchJson(url)) as { status?: number; product?: OffRawProduct };
  if (!data.product) return null;
  return toProduct(data.product);
}
