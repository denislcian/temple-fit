// CAPA 1 · Datos — Seguimiento del sueño. El audio se analiza EN EL DISPOSITIVO
// (Web Audio): nunca se sube a ningún sitio. Solo se guardan eventos (instante,
// duración, intensidad y tipo) y, opcionalmente, un clip corto del más sonoro.

export type NoiseKind = 'ronquido' | 'ruido';

export interface NoiseEvent {
  /** Milisegundos desde el inicio de la sesión. */
  atMs: number;
  durationMs: number;
  /** Intensidad de pico, 0-100. */
  peak: number;
  kind: NoiseKind;
  /** Clip de audio corto del evento (solo de los más sonoros), opcional. */
  clip?: Blob;
}

export interface SleepSession {
  id: string;
  /** Fecha (YYYY-MM-DD) de la noche, por la hora de inicio. */
  date: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  /** Intensidad máxima por minuto (0-100) para la gráfica de la noche. */
  levels: number[];
  events: NoiseEvent[];
  snoreCount: number;
  noiseCount: number;
}
