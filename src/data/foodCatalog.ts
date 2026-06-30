// CAPA 1 · Datos — Catálogo base de alimentos (valores por 100 g).
// Fuente: USDA FoodData Central, base «SR Legacy» — DOMINIO PÚBLICO, sin
// restricción de redistribución (https://fdc.nal.usda.gov). Cada fila es el
// alimento genérico de referencia; los valores reales varían según marca y
// preparación, así que el usuario puede corregirlos creando alimentos propios.
// Tres alimentos sin equivalente en SR Legacy (jamón serrano, seitán y bebida
// de avena) llevan una estimación marcada como tal. El mapeo exacto de cada
// alimento a su id de USDA está en `foodCatalog.SOURCES.md`.
import type { FoodItem } from './nutritionModels';

type Row = [id: string, name: string, kcal: number, p: number, c: number, f: number];

const ROWS: Row[] = [
  // ── Proteínas animales ─────────────────────────────────
  ['pechuga-pollo', 'Pechuga de pollo (plancha)', 151, 30.5, 0, 3.2],
  ['pavo-pechuga', 'Pechuga de pavo (asada)', 147, 30.1, 0, 2.1],
  ['ternera-magra', 'Ternera magra (redondo, hecha)', 164, 29.7, 0, 5],
  ['lomo-cerdo', 'Lomo de cerdo (asado)', 209, 28.6, 0, 9.6],
  ['huevo', 'Huevo entero', 143, 12.6, 0.7, 9.5],
  ['clara-huevo', 'Clara de huevo', 52, 10.9, 0.7, 0.2],
  ['atun-natural', 'Atún en lata (al natural)', 116, 25.5, 0, 0.8],
  ['atun-aceite', 'Atún en lata (en aceite, escurrido)', 198, 29.1, 0, 8.2],
  ['salmon', 'Salmón', 208, 20.4, 0, 13.4],
  ['merluza', 'Merluza (equiv. pescadilla)', 90, 18.3, 0, 1.3],
  ['bacalao', 'Bacalao fresco', 82, 17.8, 0, 0.7],
  ['sardinas-lata', 'Sardinas en lata (en aceite)', 208, 24.6, 0, 11.4],
  ['gambas', 'Gambas (crudas)', 85, 20.1, 0, 0.5],
  ['jamon-serrano', 'Jamón serrano', 241, 31, 0, 13], // estimado (sin equiv. USDA)
  ['jamon-cocido', 'Jamón cocido', 107, 16.9, 0.7, 4],
  // ── Proteínas vegetales y lácteos ──────────────────────
  ['tofu', 'Tofu', 76, 8.1, 1.9, 4.8],
  ['seitan', 'Seitán', 121, 21, 4, 2], // estimado (sin equiv. USDA)
  ['leche-entera', 'Leche entera', 61, 3.1, 4.8, 3.2],
  ['leche-desnatada', 'Leche desnatada', 35, 3.4, 4.8, 0.2],
  ['leche-avena', 'Bebida de avena', 45, 1, 7, 1.5], // estimado (sin equiv. USDA)
  ['yogur-natural', 'Yogur natural', 61, 3.5, 4.7, 3.2],
  ['yogur-proteico', 'Yogur griego/proteico (desnatado)', 54, 9.5, 3.4, 0.2],
  ['kefir', 'Kéfir (desnatado)', 43, 3.8, 4.8, 1],
  ['queso-fresco-batido', 'Queso batido 0% (tipo requesón desnatado)', 72, 10.3, 6.7, 0.3],
  ['requeson', 'Requesón (ricotta semidesnatada)', 138, 11.4, 5.1, 7.9],
  ['queso-curado', 'Queso curado (tipo cheddar)', 410, 24.2, 2.1, 33.8],
  ['mozzarella', 'Mozzarella', 299, 22.2, 2.4, 22.1],
  ['whey', 'Proteína de suero (aislado)', 359, 58.1, 29.1, 1.2],
  // ── Legumbres y cereales (cocidos salvo indicación) ────
  ['lentejas', 'Lentejas cocidas', 114, 9, 19.5, 0.4],
  ['garbanzos', 'Garbanzos cocidos', 164, 8.9, 27.4, 2.6],
  ['alubias', 'Alubias blancas cocidas', 139, 9.7, 25.1, 0.3],
  ['arroz-blanco', 'Arroz blanco cocido', 130, 2.7, 28.2, 0.3],
  ['arroz-integral', 'Arroz integral cocido', 123, 2.7, 25.6, 1],
  ['pasta', 'Pasta cocida', 158, 5.8, 30.9, 0.9],
  ['quinoa', 'Quinoa cocida', 120, 4.4, 21.3, 1.9],
  ['cuscus', 'Cuscús cocido', 112, 3.8, 23.2, 0.2],
  ['patata', 'Patata cocida', 87, 1.9, 20.1, 0.1],
  ['boniato', 'Boniato asado', 90, 2, 20.7, 0.1],
  ['avena', 'Copos de avena', 379, 13.2, 67.7, 6.5],
  ['pan-blanco', 'Pan blanco', 267, 8.2, 49.6, 3.6],
  ['pan-integral', 'Pan integral', 252, 12.4, 42.7, 3.5],
  ['tortitas-arroz', 'Tortitas de arroz', 386, 8.1, 79.9, 3.8],
  ['wrap-trigo', 'Tortilla de trigo (wrap)', 297, 8, 49.3, 7.6],
  ['maiz', 'Maíz dulce', 96, 3.4, 21, 1.5],
  // ── Grasas ─────────────────────────────────────────────
  ['aceite-oliva', 'Aceite de oliva', 884, 0, 0, 100],
  ['mantequilla', 'Mantequilla', 717, 0.8, 0.1, 81.1],
  ['aguacate', 'Aguacate', 160, 2, 8.5, 14.7],
  ['almendras', 'Almendras', 579, 21.1, 21.6, 49.9],
  ['nueces', 'Nueces', 654, 15.2, 13.7, 65.2],
  ['crema-cacahuete', 'Crema de cacahuete', 598, 22.2, 22.3, 51.4],
  ['chocolate-negro', 'Chocolate negro (70-85%)', 598, 7.8, 45.9, 42.6],
  // ── Frutas ─────────────────────────────────────────────
  ['platano', 'Plátano', 89, 1.1, 22.8, 0.3],
  ['manzana', 'Manzana (con piel)', 52, 0.3, 13.8, 0.2],
  ['naranja', 'Naranja', 47, 0.9, 11.8, 0.1],
  ['fresas', 'Fresas', 32, 0.7, 7.7, 0.3],
  ['uvas', 'Uvas', 69, 0.7, 18.1, 0.2],
  ['kiwi', 'Kiwi', 61, 1.1, 14.7, 0.5],
  ['datiles', 'Dátiles', 282, 2.5, 75, 0.4],
  ['pasas', 'Pasas', 299, 3.3, 79.3, 0.2],
  // ── Verduras ───────────────────────────────────────────
  ['brocoli', 'Brócoli', 34, 2.8, 6.6, 0.4],
  ['espinacas', 'Espinacas', 23, 2.9, 3.6, 0.4],
  ['tomate', 'Tomate', 18, 0.9, 3.9, 0.2],
  ['lechuga', 'Lechuga (romana)', 17, 1.2, 3.3, 0.3],
  ['pimiento', 'Pimiento rojo', 26, 1, 6, 0.3],
  ['cebolla', 'Cebolla', 40, 1.1, 9.3, 0.1],
  ['zanahoria', 'Zanahoria', 41, 0.9, 9.6, 0.2],
  ['calabacin', 'Calabacín', 17, 1.2, 3.1, 0.3],
  ['champinones', 'Champiñones', 22, 3.1, 3.3, 0.3],
  // ── Otros ──────────────────────────────────────────────
  ['hummus', 'Hummus', 237, 7.8, 15, 17.8],
  ['salsa-tomate', 'Tomate triturado / salsa', 24, 1.2, 5.3, 0.3],
  ['miel', 'Miel', 304, 0.3, 82.4, 0],
  ['azucar', 'Azúcar', 387, 0, 100, 0],
];

export const FOOD_CATALOG: readonly FoodItem[] = ROWS.map(([id, name, kcal, proteinG, carbsG, fatG]) => ({
  id,
  name,
  kcal,
  proteinG,
  carbsG,
  fatG,
  source: 'catalogo' as const,
}));
