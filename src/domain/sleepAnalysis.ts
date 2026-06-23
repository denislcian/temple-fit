// CAPA 2 · Dominio — Heurísticas de análisis del sueño (puras, testeables).
// La captura de audio vive en la capa de interfaz; aquí solo la lógica de
// decisión sobre las muestras ya medidas.
import type { NoiseEvent, NoiseKind } from '../data/sleepModels';

/**
 * Clasifica un evento sonoro. Sin ML: un ronquido es relativamente grave
 * (energía concentrada en bajas frecuencias) y dura entre ~0,6 y ~4 s; el
 * resto se considera ruido (portazo, voz, tráfico…).
 */
export function classifyNoise(durationMs: number, lowFreqRatio: number): NoiseKind {
  const ronca = durationMs >= 600 && durationMs <= 4000 && lowFreqRatio >= 0.6;
  return ronca ? 'ronquido' : 'ruido';
}

export interface NightSummary {
  snoreCount: number;
  noiseCount: number;
  /** Eventos ordenados por intensidad, de más fuerte a más flojo. */
  loudest: NoiseEvent[];
  /** Minutos con al menos un evento (aprox. de inquietud). */
  restlessMinutes: number;
}

export function summarizeNight(events: NoiseEvent[]): NightSummary {
  const snoreCount = events.filter((e) => e.kind === 'ronquido').length;
  const noiseCount = events.length - snoreCount;
  const loudest = [...events].sort((a, b) => b.peak - a.peak);
  const minutes = new Set(events.map((e) => Math.floor(e.atMs / 60000)));
  return { snoreCount, noiseCount, loudest, restlessMinutes: minutes.size };
}

/** Valoración cualitativa de la noche según ronquidos y desvelos. */
export function sleepVerdict(summary: NightSummary, durationMin: number): string {
  if (durationMin < 30) return 'Sesión muy corta para valorar.';
  const restPct = durationMin > 0 ? summary.restlessMinutes / durationMin : 0;
  if (summary.snoreCount === 0 && restPct < 0.05) return 'Noche tranquila: apenas ruido.';
  if (summary.snoreCount > 0 && restPct < 0.1) return 'Algunos ronquidos, pero descanso estable.';
  if (restPct < 0.2) return 'Sueño algo inquieto; revisa los momentos marcados.';
  return 'Noche movida: mucho ruido o ronquidos frecuentes.';
}
