// CAPA 1 · Datos — Catálogo base de alimentos (valores por 100 g).
// Datos de composición aproximados a partir de tablas de composición de
// alimentos de referencia; redactado para este proyecto. Los valores reales
// varían según marca y preparación: el usuario puede corregirlos creando
// alimentos personalizados.
import type { FoodItem } from './nutritionModels';

type Row = [id: string, name: string, kcal: number, p: number, c: number, f: number];

const ROWS: Row[] = [
  // ── Proteínas animales ─────────────────────────────────
  ['pechuga-pollo', 'Pechuga de pollo (plancha)', 165, 31, 0, 3.6],
  ['pavo-pechuga', 'Pechuga de pavo', 135, 29, 0, 1.7],
  ['ternera-magra', 'Ternera magra', 150, 26, 0, 5],
  ['lomo-cerdo', 'Lomo de cerdo', 143, 21, 0, 6],
  ['huevo', 'Huevo entero', 143, 12.6, 0.7, 9.5],
  ['clara-huevo', 'Clara de huevo', 52, 11, 0.7, 0.2],
  ['atun-natural', 'Atún en lata (al natural)', 116, 26, 0, 1],
  ['atun-aceite', 'Atún en lata (en aceite, escurrido)', 198, 29, 0, 9],
  ['salmon', 'Salmón', 208, 20, 0, 13],
  ['merluza', 'Merluza', 86, 17.8, 0, 1.3],
  ['bacalao', 'Bacalao fresco', 82, 18, 0, 0.7],
  ['sardinas-lata', 'Sardinas en lata', 208, 25, 0, 12],
  ['gambas', 'Gambas', 99, 24, 0.2, 0.3],
  ['jamon-serrano', 'Jamón serrano', 241, 31, 0, 13],
  ['jamon-cocido', 'Jamón cocido', 110, 18, 1.5, 3.5],
  // ── Proteínas vegetales y lácteos ──────────────────────
  ['tofu', 'Tofu', 76, 8, 1.9, 4.8],
  ['seitan', 'Seitán', 121, 21, 4, 2],
  ['leche-entera', 'Leche entera', 61, 3.2, 4.8, 3.3],
  ['leche-desnatada', 'Leche desnatada', 34, 3.4, 5, 0.1],
  ['leche-avena', 'Bebida de avena', 45, 1, 7, 1.5],
  ['yogur-natural', 'Yogur natural', 61, 3.5, 4.7, 3.3],
  ['yogur-proteico', 'Yogur proteico (tipo skyr)', 63, 10.6, 4, 0.2],
  ['kefir', 'Kéfir', 55, 3.3, 4, 3],
  ['queso-fresco-batido', 'Queso fresco batido 0%', 46, 8, 4, 0.2],
  ['requeson', 'Requesón', 98, 11, 3.4, 4.5],
  ['queso-curado', 'Queso curado', 402, 25, 1.3, 33],
  ['mozzarella', 'Mozzarella', 300, 22, 2.2, 22],
  ['whey', 'Proteína de suero (polvo)', 380, 78, 8, 5],
  // ── Legumbres y cereales (cocidos salvo indicación) ────
  ['lentejas', 'Lentejas cocidas', 116, 9, 20, 0.4],
  ['garbanzos', 'Garbanzos cocidos', 164, 8.9, 27, 2.6],
  ['alubias', 'Alubias cocidas', 127, 8.7, 22.8, 0.5],
  ['arroz-blanco', 'Arroz blanco cocido', 130, 2.7, 28, 0.3],
  ['arroz-integral', 'Arroz integral cocido', 111, 2.6, 23, 0.9],
  ['pasta', 'Pasta cocida', 158, 5.8, 31, 0.9],
  ['quinoa', 'Quinoa cocida', 120, 4.4, 21, 1.9],
  ['cuscus', 'Cuscús cocido', 112, 3.8, 23, 0.2],
  ['patata', 'Patata cocida', 87, 1.9, 20, 0.1],
  ['boniato', 'Boniato asado', 90, 2, 21, 0.2],
  ['avena', 'Copos de avena', 379, 13, 67, 6.5],
  ['pan-blanco', 'Pan blanco', 265, 9, 49, 3.2],
  ['pan-integral', 'Pan integral', 247, 13, 41, 3.4],
  ['tortitas-arroz', 'Tortitas de arroz', 387, 8, 81, 2.8],
  ['wrap-trigo', 'Tortilla de trigo (wrap)', 310, 8, 52, 7],
  ['maiz', 'Maíz dulce', 86, 3.2, 19, 1.2],
  // ── Grasas ─────────────────────────────────────────────
  ['aceite-oliva', 'Aceite de oliva virgen extra', 884, 0, 0, 100],
  ['mantequilla', 'Mantequilla', 717, 0.9, 0.1, 81],
  ['aguacate', 'Aguacate', 160, 2, 8.5, 14.7],
  ['almendras', 'Almendras', 579, 21, 22, 50],
  ['nueces', 'Nueces', 654, 15, 14, 65],
  ['crema-cacahuete', 'Crema de cacahuete', 588, 25, 20, 50],
  ['chocolate-negro', 'Chocolate negro 85%', 600, 9, 19, 53],
  // ── Frutas ─────────────────────────────────────────────
  ['platano', 'Plátano', 89, 1.1, 23, 0.3],
  ['manzana', 'Manzana', 52, 0.3, 14, 0.2],
  ['naranja', 'Naranja', 47, 0.9, 12, 0.1],
  ['fresas', 'Fresas', 32, 0.7, 7.7, 0.3],
  ['uvas', 'Uvas', 69, 0.7, 18, 0.2],
  ['kiwi', 'Kiwi', 61, 1.1, 15, 0.5],
  ['datiles', 'Dátiles', 282, 2.5, 75, 0.4],
  ['pasas', 'Pasas', 299, 3, 79, 0.5],
  // ── Verduras ───────────────────────────────────────────
  ['brocoli', 'Brócoli', 34, 2.8, 7, 0.4],
  ['espinacas', 'Espinacas', 23, 2.9, 3.6, 0.4],
  ['tomate', 'Tomate', 18, 0.9, 3.9, 0.2],
  ['lechuga', 'Lechuga', 15, 1.4, 2.9, 0.2],
  ['pimiento', 'Pimiento', 31, 1, 6, 0.3],
  ['cebolla', 'Cebolla', 40, 1.1, 9.3, 0.1],
  ['zanahoria', 'Zanahoria', 41, 0.9, 9.6, 0.2],
  ['calabacin', 'Calabacín', 17, 1.2, 3.1, 0.3],
  ['champinones', 'Champiñones', 22, 3.1, 3.3, 0.3],
  // ── Otros ──────────────────────────────────────────────
  ['hummus', 'Hummus', 166, 8, 14, 10],
  ['salsa-tomate', 'Salsa de tomate', 29, 1.5, 5, 0.2],
  ['miel', 'Miel', 304, 0.3, 82, 0],
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
