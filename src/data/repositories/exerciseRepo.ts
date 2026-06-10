// CAPA 1 · Datos — Repositorio de ejercicios.
import { db } from '../db';
import type { Equipment, Exercise, MuscleGroup } from '../models';
import { newId } from '../models';

export async function getAllExercises(): Promise<Exercise[]> {
  const all = await db.exercises.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function getExercisesByGroup(group: MuscleGroup): Promise<Exercise[]> {
  const list = await db.exercises.where('muscleGroup').equals(group).toArray();
  return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export interface NewCustomExercise {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  instructions: string;
}

/** Crea un ejercicio personalizado. Sin límite (Strong: 3, Hevy: 7). */
export async function addCustomExercise(data: NewCustomExercise): Promise<Exercise> {
  const exercise: Exercise = {
    ...data,
    id: newId(),
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  await db.exercises.add(exercise);
  return exercise;
}

export async function updateExercise(
  id: string,
  changes: Partial<NewCustomExercise>,
): Promise<void> {
  await db.exercises.update(id, changes);
}

/** Solo se pueden eliminar ejercicios personalizados; el catálogo es fijo. */
export async function removeCustomExercise(id: string): Promise<void> {
  const exercise = await db.exercises.get(id);
  if (!exercise) return;
  if (!exercise.isCustom) {
    throw new Error('Los ejercicios del catálogo no se pueden eliminar');
  }
  await db.exercises.delete(id);
}
