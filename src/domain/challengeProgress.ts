// CAPA 2 · Dominio — Progreso de un reto: días entrenados en la ventana.
// Función pura sobre las sesiones LOCALES del usuario. El resultado (un número)
// es lo único que se sube a la nube; las sesiones nunca salen del dispositivo.
import { isWorkingSet, type Session } from '../data/models';

/** Días distintos (YYYY-MM-DD) con al menos una serie efectiva, dentro de
 *  [startsAt, endsAt]. Es el progreso del usuario en un reto de "días entrenados". */
export function trainingDaysInWindow(
  sessions: Session[],
  startsAt: string,
  endsAt: string,
): number {
  const start = startsAt.slice(0, 10);
  const end = endsAt.slice(0, 10);
  const days = new Set<string>();
  for (const s of sessions) {
    const day = s.date.slice(0, 10);
    if (day < start || day > end) continue;
    const hasWork = s.entries.some((e) => e.sets.some(isWorkingSet));
    if (hasWork) days.add(day);
  }
  return days.size;
}

/** ¿Quedan cuántos días para que acabe el reto? (0 si ya terminó.) */
export function daysLeft(endsAt: string, todayISO: string): number {
  const end = new Date(endsAt.slice(0, 10)).getTime();
  const today = new Date(todayISO.slice(0, 10)).getTime();
  return Math.max(0, Math.round((end - today) / (24 * 60 * 60 * 1000)));
}

/** ¿El reto sigue activo hoy? */
export function isActive(challengeEndsAt: string, todayISO: string): boolean {
  return challengeEndsAt.slice(0, 10) >= todayISO.slice(0, 10);
}
