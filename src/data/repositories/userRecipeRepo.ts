// CAPA 1 · Datos — Recetas del usuario (propias y guardadas de la comunidad).
import { db } from '../db';
import { newId } from '../models';
import type { SharedRecipePayload, UserRecipe } from '../recipeModels';

export async function getAllUserRecipes(): Promise<UserRecipe[]> {
  return db.userRecipes.orderBy('createdAt').reverse().toArray();
}

export async function addUserRecipe(
  recipe: SharedRecipePayload,
  origin: UserRecipe['origin'],
  author?: string,
): Promise<UserRecipe> {
  const saved: UserRecipe = {
    ...recipe,
    id: `u-${newId()}`,
    createdAt: new Date().toISOString(),
    origin,
    ...(author ? { author } : {}),
  };
  await db.userRecipes.add(saved);
  return saved;
}

export async function removeUserRecipe(id: string): Promise<void> {
  await db.userRecipes.delete(id);
}
