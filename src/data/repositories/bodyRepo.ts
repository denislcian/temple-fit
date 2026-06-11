// CAPA 1 · Datos — Repositorio de medidas corporales e hidratación.
import type { BodyMeasurement, WaterDay } from '../bodyModels';
import { db } from '../db';
import { newId } from '../models';
import { loadProfile, saveProfile } from '../profile';

/** Historial de medidas, de más antigua a más reciente (para gráficas). */
export async function getAllMeasurements(): Promise<BodyMeasurement[]> {
  return db.bodyMetrics.orderBy('date').toArray();
}

/**
 * Registra medidas. El peso actualiza también el perfil, así los objetivos
 * de calorías/macros se recalculan solos con tu peso real.
 */
export async function addMeasurement(
  data: Omit<BodyMeasurement, 'id'>,
): Promise<{ measurement: BodyMeasurement; profileUpdated: boolean }> {
  const measurement: BodyMeasurement = { ...data, id: newId() };
  await db.bodyMetrics.add(measurement);

  const profile = loadProfile();
  if (profile && measurement.weightKg > 0) {
    saveProfile({ ...profile, weightKg: measurement.weightKg });
    return { measurement, profileUpdated: true };
  }
  return { measurement, profileUpdated: false };
}

export async function removeMeasurement(id: string): Promise<void> {
  await db.bodyMetrics.delete(id);
}

// ── Hidratación ───────────────────────────────────────────

export async function getWater(date: string): Promise<number> {
  const day = await db.water.get(date);
  return day?.glasses ?? 0;
}

export async function setWater(date: string, glasses: number): Promise<number> {
  const value = Math.max(0, Math.min(99, Math.round(glasses)));
  const day: WaterDay = { date, glasses: value };
  await db.water.put(day);
  return value;
}
