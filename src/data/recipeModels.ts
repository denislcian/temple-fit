// CAPA 1 · Datos — Recetas saludables. Catálogo propio en español con macros
// por ración. Imagen opcional (emoji por ahora; foto real llegará con la
// subida de la comunidad o ilustración propia).
export type RecipeCategory = 'desayuno' | 'comida' | 'cena' | 'snack' | 'postre';

export type RecipeTag =
  | 'vegano'
  | 'vegetariano'
  | 'alto-proteina'
  | 'bajo-carbo'
  | 'sin-gluten'
  | 'rapido'
  | 'economico'
  | 'meal-prep';

export const RECIPE_CATEGORIES: RecipeCategory[] = ['desayuno', 'comida', 'cena', 'snack', 'postre'];

export const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snack: 'Snack',
  postre: 'Postre',
};

/** Nivel de dificultad de elaboración. */
export type RecipeDifficulty = 'facil' | 'media' | 'dificil';

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  facil: 'Fácil',
  media: 'Media',
  dificil: 'Avanzada',
};

export const RECIPE_TAGS: RecipeTag[] = [
  'alto-proteina',
  'rapido',
  'vegetariano',
  'vegano',
  'bajo-carbo',
  'sin-gluten',
  'economico',
  'meal-prep',
];

export const TAG_LABELS: Record<RecipeTag, string> = {
  vegano: 'Vegano',
  vegetariano: 'Vegetariano',
  'alto-proteina': 'Alto en proteína',
  'bajo-carbo': 'Bajo en carbos',
  'sin-gluten': 'Sin gluten',
  rapido: 'Rápido (≤15 min)',
  economico: 'Económico',
  'meal-prep': 'Meal prep',
};

export interface RecipeIngredient {
  item: string;
  amount: string;
}

export interface Recipe {
  id: string;
  name: string;
  /** Emoji de cabecera (respaldo cuando no hay foto). */
  emoji: string;
  /** Reseña breve estilo recetario: origen, por qué merece la pena. En nuestras palabras. */
  description: string;
  difficulty: RecipeDifficulty;
  /** Truco del chef para que salga mejor. */
  tip: string;
  category: RecipeCategory;
  tags: RecipeTag[];
  minutes: number;
  servings: number;
  /** Peso aproximado de una ración, para el diario de nutrición. */
  servingG: number;
  /** Macros POR RACIÓN. */
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  /** URL/dataURL de foto, opcional (futuro: subida de la comunidad). */
  image?: string;
}
