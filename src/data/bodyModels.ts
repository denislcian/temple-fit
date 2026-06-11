// CAPA 1 · Datos — Medidas corporales e hidratación.

/** Un registro de medidas corporales (el peso es lo único obligatorio). */
export interface BodyMeasurement {
  id: string;
  /** Día en formato YYYY-MM-DD. */
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
}

/** Vasos de agua de un día (un vaso ≈ 250 ml). */
export interface WaterDay {
  /** Día en formato YYYY-MM-DD (clave primaria). */
  date: string;
  glasses: number;
}

export const WATER_GOAL_GLASSES = 8;
