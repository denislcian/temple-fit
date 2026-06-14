// CAPA 1 · Datos — Base de datos local (IndexedDB vía Dexie).
// Los datos viven en el dispositivo del usuario: sin cuentas, sin servidores.
import Dexie, { type EntityTable } from 'dexie';
import type { Account } from './authModels';
import type { BodyMeasurement, WaterDay } from './bodyModels';
import type { Exercise, Routine, Session } from './models';
import type { DiaryEntry, FoodItem, Follow, Post } from './nutritionModels';

export class TempleDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  routines!: EntityTable<Routine, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  foods!: EntityTable<FoodItem, 'id'>;
  diary!: EntityTable<DiaryEntry, 'id'>;
  posts!: EntityTable<Post, 'id'>;
  bodyMetrics!: EntityTable<BodyMeasurement, 'id'>;
  water!: EntityTable<WaterDay, 'date'>;
  accounts!: EntityTable<Account, 'id'>;
  follows!: EntityTable<Follow, 'id'>;

  constructor() {
    super('forjafit');
    // Solo se indexan los campos por los que se busca u ordena.
    this.version(1).stores({
      exercises: 'id, name, muscleGroup, isCustom',
      routines: 'id, name, createdAt',
      sessions: 'id, date',
    });
    // v2 (fase nutrición + comunidad): las migraciones de Dexie son aditivas,
    // los datos existentes de la v1 se conservan tal cual.
    this.version(2).stores({
      exercises: 'id, name, muscleGroup, isCustom',
      routines: 'id, name, createdAt',
      sessions: 'id, date',
      foods: 'id, name, source, barcode',
      diary: 'id, date, meal',
      posts: 'id, createdAt',
    });
    // v3: medidas corporales e hidratación.
    this.version(3).stores({
      exercises: 'id, name, muscleGroup, isCustom',
      routines: 'id, name, createdAt',
      sessions: 'id, date',
      foods: 'id, name, source, barcode',
      diary: 'id, date, meal',
      posts: 'id, createdAt',
      bodyMetrics: 'id, date',
      water: 'date',
    });
    // v4 (red social): cuentas y grafo de seguidores. Los posts ganan
    // authorId y visibility (campos opcionales → datos previos válidos).
    this.version(4).stores({
      exercises: 'id, name, muscleGroup, isCustom',
      routines: 'id, name, createdAt',
      sessions: 'id, date',
      foods: 'id, name, source, barcode',
      diary: 'id, date, meal',
      posts: 'id, createdAt, authorId',
      bodyMetrics: 'id, date',
      water: 'date',
      accounts: 'id, &username', // &username = índice único
      follows: 'id, followerId, followeeId, [followerId+followeeId]',
    });
  }
}

export const db = new TempleDB();

/**
 * Pide al navegador almacenamiento persistente para reducir el riesgo de
 * que IndexedDB se borre por presión de disco (best-effort).
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}
