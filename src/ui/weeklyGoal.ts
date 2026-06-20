// CAPA 3 · Interfaz — Objetivo semanal de entrenamientos (preferencia local).
// Una meta motivadora basada en datos reales: cuántas sesiones por semana te
// propones. Se guarda en el dispositivo; por defecto 4.
const KEY = 'forjafit-weekly-goal';
const DEFAULT_GOAL = 4;
export const MIN_GOAL = 1;
export const MAX_GOAL = 14;

export function loadWeeklyGoal(): number {
  const raw = Number(localStorage.getItem(KEY));
  if (!Number.isFinite(raw) || raw < MIN_GOAL) return DEFAULT_GOAL;
  return Math.min(MAX_GOAL, Math.round(raw));
}

export function saveWeeklyGoal(goal: number): number {
  const clamped = Math.min(MAX_GOAL, Math.max(MIN_GOAL, Math.round(goal)));
  localStorage.setItem(KEY, String(clamped));
  return clamped;
}
