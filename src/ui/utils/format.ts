// CAPA 3 · Interfaz — Formateo y parseo de números y fechas en español.

const kgFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormat = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
const monthYearFormat = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

export function formatKg(value: number): string {
  return `${kgFormat.format(value)} kg`;
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormat.format(new Date(iso));
}

/** "junio de 2026" — para las subcabeceras de meses en el historial. */
export function formatMonthYear(iso: string): string {
  return monthYearFormat.format(new Date(iso));
}

/** Fecha local en formato YYYY-MM-DD (para las claves del diario). */
export function localDateISO(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Suma días a una fecha YYYY-MM-DD (respetando el calendario local). */
export function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y!, m! - 1, d! + days);
  return localDateISO(date);
}

/** Parsea un entero positivo escrito por el usuario ("8"). */
export function parseReps(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw.trim());
  return value >= 1 ? value : null;
}

/** Parsea un peso con decimales, aceptando coma o punto ("72,5" o "72.5"). */
export function parseWeight(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return value >= 0 ? value : null;
}
