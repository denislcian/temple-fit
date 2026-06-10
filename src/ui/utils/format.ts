// CAPA 3 · Interfaz — Formateo y parseo de números y fechas en español.

const kgFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormat = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });

export function formatKg(value: number): string {
  return `${kgFormat.format(value)} kg`;
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormat.format(new Date(iso));
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
