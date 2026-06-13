// CAPA 2 · Dominio — Proyección de objetivo de peso.
//
// Cal AI, MyFitnessPal y MacroFactor estiman cuándo alcanzarás tu peso
// objetivo. El estándar de la industria es 7700 kcal ≈ 1 kg de grasa
// corporal. Función pura testeable; el ajuste de fecha lo hace la UI.
import { addDays } from '../ui/utils/format';

/** kcal almacenadas en 1 kg de tejido graso (constante de la industria). */
export const KCAL_PER_KG = 7700;

export type GoalDirection = 'perder' | 'ganar' | 'mantener';

export interface WeightProjection {
  direction: GoalDirection;
  /** Diferencia con el objetivo, en kg (positiva siempre). */
  totalKg: number;
  weeklyRateKg: number;
  /** Déficit (perder) o superávit (ganar) calórico diario que implica. */
  dailyKcal: number;
  totalDays: number;
  /** Fecha estimada de llegada, YYYY-MM-DD. */
  targetDate: string;
  /** Aviso si el ritmo es poco saludable (null si todo correcto). */
  warning: string | null;
}

/**
 * Proyecta cuándo se alcanza el peso objetivo a un ritmo semanal dado.
 * @param currentKg peso actual
 * @param targetKg peso objetivo
 * @param weeklyRateKg ritmo deseado en kg/semana (valor positivo)
 * @param fromISO fecha de partida, YYYY-MM-DD
 */
export function projectWeightGoal(
  currentKg: number,
  targetKg: number,
  weeklyRateKg: number,
  fromISO: string,
): WeightProjection | null {
  if (!Number.isFinite(currentKg) || !Number.isFinite(targetKg) || currentKg <= 0 || targetKg <= 0) {
    return null;
  }
  if (!Number.isFinite(weeklyRateKg) || weeklyRateKg <= 0) return null;

  const diff = targetKg - currentKg;
  const totalKg = Math.abs(diff);

  if (totalKg < 0.1) {
    return {
      direction: 'mantener',
      totalKg: 0,
      weeklyRateKg,
      dailyKcal: 0,
      totalDays: 0,
      targetDate: fromISO,
      warning: null,
    };
  }

  const direction: GoalDirection = diff < 0 ? 'perder' : 'ganar';
  const totalDays = Math.round((totalKg / weeklyRateKg) * 7);
  const dailyKcal = Math.round((weeklyRateKg * KCAL_PER_KG) / 7);

  let warning: string | null = null;
  const pctPerWeek = (weeklyRateKg / currentKg) * 100;
  if (weeklyRateKg > 1 || pctPerWeek > 1) {
    warning =
      direction === 'perder'
        ? 'Ese ritmo es agresivo (más de ~1% del peso por semana). Un ritmo de 0,25–0,75 kg/semana preserva mejor el músculo.'
        : 'Ese ritmo es alto para ganar masa magra. Subir 0,25–0,5 kg/semana minimiza la grasa ganada.';
  }

  return {
    direction,
    totalKg: Math.round(totalKg * 10) / 10,
    weeklyRateKg,
    dailyKcal,
    totalDays,
    targetDate: addDays(fromISO, totalDays),
    warning,
  };
}
