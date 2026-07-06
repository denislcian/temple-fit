// CAPA 1 · Datos — Modelos del módulo de nutrición.
import type { SharedRecipePayload } from './recipeModels';

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
export type Visibility = 'publica' | 'seguidores' | 'mejores' | 'privada';

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  publica: 'Pública',
  seguidores: 'Solo seguidores',
  mejores: 'Mejores amigos',
  privada: 'Privada',
};

/** Publicación de la comunidad (rutina, sesión, texto, receta, foto o recuperación). */
export interface Post {
  id: string;
  author: string;
  /** id de la cuenta autora (ausente en las publicaciones de ejemplo). */
  authorId?: string;
  /** Foto del autor, añadida al leer el feed (no se persiste). */
  authorAvatar?: string;
  createdAt: string;
  text: string;
  kind: 'rutina' | 'sesion' | 'texto' | 'receta' | 'foto' | 'sueno' | 'meditacion';
  /** Quién puede verla. Ausente = pública (retrocompatible). */
  visibility?: Visibility;
  /** Contenido estructurado: título + líneas (ejercicios, series, receta...).
   *  exerciseIds (rutinas), recipeId (recetas del catálogo) y recipe (recetas
   *  creadas por la comunidad, con datos completos) permiten GUARDAR desde el
   *  feed; opcionales para retrocompatibilidad con publicaciones antiguas. */
  payload?: {
    title: string;
    lines: string[];
    exerciseIds?: string[];
    recipeId?: string;
    recipe?: SharedRecipePayload;
  };
  /** Foto adjunta como dataURL (comprimida en el dispositivo). */
  image?: string;
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

/** Mejor amigo: ownerId marcó a friendId. Tabla propia (no un campo en Follow):
 *  el grafo de seguidores es público, pero la lista de mejores amigos solo la
 *  ven el dueño y la persona marcada. La marca decide quién ve las
 *  publicaciones con visibilidad 'mejores' del dueño. */
export interface CloseFriend {
  ownerId: string;
  friendId: string;
  createdAt: string;
}

export function macrosForGrams(per100: MacroAmounts, grams: number): MacroAmounts {
  // Blindaje: gramos negativos o no finitos producirían macros negativos/NaN
  // que corromperían los totales del diario. Se tratan como 0.
  const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : 0;
  const f = safeGrams / 100;
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
