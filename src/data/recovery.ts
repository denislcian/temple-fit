// CAPA 1 · Datos — Días de recuperación (local, solo en el dispositivo).
// Marca los días en que el usuario hizo algo por su descanso (registrar sueño o
// completar una respiración). Alimenta la racha de recuperación de Descanso.
const KEY = 'forjafit-recovery-days';
const MAX_DAYS = 180;

export function loadRecoveryDays(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((d): d is string => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

/** Marca un día (YYYY-MM-DD, derivado de un ISO) como día de recuperación. */
export function markRecoveryDay(dateISO: string): void {
  const day = dateISO.slice(0, 10);
  const days = new Set(loadRecoveryDays());
  days.add(day);
  const trimmed = [...days].sort().slice(-MAX_DAYS);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
}
