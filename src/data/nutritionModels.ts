// CAPA 1 · Datos — Modelos del módulo de nutrición.

export type Meal = 'desayuno' | 'comida' | 'cena' | 'snack';

export const MEALS: readonly Meal[] = ['desayuno', 'comida', 'cena', 'snack'];

export const MEAL_LABELS: Record<Meal, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snack: 'Snacks',
};

/** Macros absolutos (de una ración, una comida o un día). */
export interface MacroAmounts {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Un alimento con sus valores POR 100 g. */
export interface FoodItem extends MacroAmounts {
  id: string;
  name: string;
  /** catalogo = incluido en la app · off = Open Food Facts · personalizado = del usuario */
  source: 'catalogo' | 'off' | 'personalizado';
  barcode?: string;
  // Micronutrientes por 100 g (opcionales): solo presentes en alimentos de
  // Open Food Facts o de etiqueta escaneada. Necesarios para el Nutri-Score.
  sugarsG?: number;
  satFatG?: number;
  saltG?: number;
  fiberG?: number;
}

/** Una entrada del diario: un alimento consumido en una comida de un día.
 *  Los macros se guardan ya calculados para los gramos consumidos
 *  (instantánea: si el alimento cambia después, el historial no se altera). */
export interface DiaryEntry extends MacroAmounts {
  id: string;
  /** Día en formato YYYY-MM-DD. */
  date: string;
  meal: Meal;
  foodName: string;
  foodId?: string;
  grams: number;
}

/** Comentario de una publicación de la comunidad. */
export interface PostComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

/** Quién puede ver una publicación. */
export type Visibility = 'publica' | 'seguidores' | 'privada';

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  publica: 'Pública',
  seguidores: 'Solo seguidores',
  privada: 'Privada',
};

/** Publicación de la comunidad (rutina, sesión o texto). */
export interface Post {
  id: string;
  author: string;
  /** id de la cuenta autora (ausente en las publicaciones de ejemplo). */
  authorId?: string;
  createdAt: string;
  text: string;
  kind: 'rutina' | 'sesion' | 'texto';
  /** Quién puede verla. Ausente = pública (retrocompatible). */
  visibility?: Visibility;
  /** Contenido estructurado: título + líneas (ejercicios, series...). */
  payload?: { title: string; lines: string[] };
  likes: number;
  likedByMe: boolean;
  comments: PostComment[];
  /** true en las publicaciones de ejemplo del modo local. */
  isDemo?: boolean;
}

/** Relación de seguimiento: followerId sigue a followeeId. */
export interface Follow {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
}

export function macrosForGrams(per100: MacroAmounts, grams: number): MacroAmounts {
  const f = grams / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    proteinG: Math.round(per100.proteinG * f * 10) / 10,
    carbsG: Math.round(per100.carbsG * f * 10) / 10,
    fatG: Math.round(per100.fatG * f * 10) / 10,
  };
}

export function sumMacros(items: MacroAmounts[]): MacroAmounts {
  return {
    kcal: Math.round(items.reduce((a, i) => a + i.kcal, 0)),
    proteinG: Math.round(items.reduce((a, i) => a + i.proteinG, 0) * 10) / 10,
    carbsG: Math.round(items.reduce((a, i) => a + i.carbsG, 0) * 10) / 10,
    fatG: Math.round(items.reduce((a, i) => a + i.fatG, 0) * 10) / 10,
  };
}
