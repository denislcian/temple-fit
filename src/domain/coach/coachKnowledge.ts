// CAPA 2 · Dominio — Base de conocimiento del coach (citable, redactada propia).
//
// Heurísticas de entrenamiento de fuerza/hipertrofia con sus umbrales y fuentes.
// Es la ÚNICA fuente de verdad de las reglas: la consume el motor determinista
// (coachRules.ts) y, si el usuario activa la IA, también el prompt de Gemini.
// El texto es original; solo se CITA la evidencia (no se copia su contenido).
import type { MuscleGroup } from '../../data/models';
import type { Goal } from '../routineGenerator';

export interface CoachSource {
  autor: string;
  anio: number;
  url: string;
}

/** Fuentes citadas. Todas verificadas contra su DOI/PubMed (título, autores y
 *  año comprobados) salvo rpLandmarks, que es un marco práctico divulgativo y
 *  se etiqueta como tal. */
export const SOURCES = {
  acsm2009: {
    autor: 'ACSM Position Stand: progresión en entrenamiento de fuerza (Ratamess et al.)',
    anio: 2009,
    url: 'https://doi.org/10.1249/MSS.0b013e3181915670',
  },
  schoenfeld2016: {
    autor: 'Schoenfeld et al. (frecuencia semanal, meta-análisis)',
    anio: 2016,
    url: 'https://doi.org/10.1007/s40279-016-0543-8',
  },
  schoenfeld2017: {
    autor: 'Schoenfeld et al. (dosis-respuesta de volumen)',
    anio: 2017,
    url: 'https://pubmed.ncbi.nlm.nih.gov/28755103/',
  },
  schoenfeld2021: {
    autor: 'Schoenfeld et al. (continuo de repeticiones y cargas)',
    anio: 2021,
    url: 'https://doi.org/10.3390/sports9020032',
  },
  grgic2018: {
    autor: 'Grgic et al. (descansos entre series, revisión sistemática)',
    anio: 2018,
    url: 'https://doi.org/10.1007/s40279-017-0788-x',
  },
  zourdos2016: {
    autor: 'Zourdos et al. (escala RPE/RIR para fuerza, validación)',
    anio: 2016,
    url: 'https://doi.org/10.1519/JSC.0000000000001049',
  },
  helms2016: {
    autor: 'Helms et al. (prescripción por RIR)',
    anio: 2016,
    url: 'https://doi.org/10.1519/SSC.0000000000000218',
  },
  robinson2024: {
    autor: 'Robinson et al. (proximidad al fallo / RIR)',
    anio: 2024,
    url: 'https://link.springer.com/article/10.1186/s40798-024-00691-y',
  },
  bell2023: {
    autor: 'Bell et al. (descargas / deload)',
    anio: 2023,
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10809978/',
  },
  vitale2019: {
    autor: 'Vitale et al. (sueño y rendimiento en atletas, revisión)',
    anio: 2019,
    url: 'https://doi.org/10.1055/a-0905-3103',
  },
  watson2015: {
    autor: 'Watson et al., consenso AASM/SRS (≥7 h de sueño en adultos)',
    anio: 2015,
    url: 'https://doi.org/10.5664/jcsm.4758',
  },
  iversen2021: {
    autor: 'Iversen et al. (entrenamiento eficiente en tiempo: superseries)',
    anio: 2021,
    url: 'https://doi.org/10.1007/s40279-021-01490-1',
  },
  fradkin2010: {
    autor: 'Fradkin et al. (calentamiento y rendimiento, meta-análisis)',
    anio: 2010,
    url: 'https://doi.org/10.1519/JSC.0b013e3181c643a0',
  },
  rpLandmarks: {
    autor: 'Renaissance Periodization (landmarks MEV/MAV/MRV; marco práctico, no revisado por pares)',
    anio: 2024,
    url: 'https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth',
  },
} as const satisfies Record<string, CoachSource>;

export type SourceKey = keyof typeof SOURCES;

/** Series de trabajo por músculo y semana (landmarks). MEV mínimo eficaz,
 *  MAV adaptativo (objetivo), MRV máximo recuperable. */
export interface VolumeLandmark {
  mev: number;
  mav: number;
  mrv: number;
}

export const VOLUME_LANDMARKS: Record<MuscleGroup, VolumeLandmark> = {
  pecho: { mev: 8, mav: 16, mrv: 22 },
  espalda: { mev: 10, mav: 18, mrv: 25 },
  hombros: { mev: 8, mav: 16, mrv: 24 },
  bíceps: { mev: 6, mav: 14, mrv: 20 },
  tríceps: { mev: 6, mav: 14, mrv: 20 },
  pierna: { mev: 8, mav: 16, mrv: 22 },
  glúteo: { mev: 4, mav: 12, mrv: 16 },
  core: { mev: 0, mav: 12, mrv: 20 },
  'cuerpo completo': { mev: 8, mav: 16, mrv: 22 },
};

/** Pauta de carga/reps por objetivo. loadPct = % del 1RM. */
export interface GoalPrescription {
  loadPctMin: number;
  loadPctMax: number;
  repsMin: number;
  repsMax: number;
  rest: string;
  rir: string;
  enfoque: string;
}

export const GOAL_PRESCRIPTION: Record<Goal, GoalPrescription> = {
  fuerza: {
    loadPctMin: 80,
    loadPctMax: 90,
    repsMin: 2,
    repsMax: 6,
    rest: '2-3 min',
    rir: '1-3',
    enfoque: 'Cargas altas, pocas repeticiones, descansos largos para recuperar la fuerza.',
  },
  hipertrofia: {
    loadPctMin: 67,
    loadPctMax: 85,
    repsMin: 6,
    repsMax: 15,
    rest: '60-90 s',
    rir: '0-2',
    enfoque: 'Rango medio cerca del fallo (RIR 0-2) y volumen suficiente por músculo.',
  },
  definicion: {
    loadPctMin: 60,
    loadPctMax: 75,
    repsMin: 12,
    repsMax: 20,
    rest: '45-60 s',
    rir: '0-2',
    enfoque: 'Repeticiones altas, descansos cortos; el músculo se mantiene con intensidad.',
  },
};

/** Umbrales de las reglas (un único sitio para revisarlos/versionarlos). */
export const THRESHOLDS = {
  /** RPE a partir del cual una serie se considera "al límite" (escala RPE/RIR
   *  validada: RPE 9 = 1 repetición en reserva — zourdos2016). */
  rpeAltoSesion: 9,
  /** RPE por debajo del cual hay margen para progresar (helms2016). */
  rpeBajo: 7,
  /** Sueño objetivo: ≥7 h/noche en adultos (consenso AASM/SRS — watson2015). */
  suenoObjetivoMin: 7 * 60,
  suenoBajoMin: 6 * 60,
  /** Semanas de entrenamiento continuo tras las que conviene una descarga. */
  semanasParaDeload: 6,
  /** Frecuencia mínima recomendada por músculo (veces/semana — schoenfeld2016). */
  frecuenciaMin: 2,
  /** Duración media a partir de la cual proponemos superseries (iversen2021). */
  sesionLargaMin: 75,
} as const;

/** Las heurísticas como datos (documentación + base del prompt de IA). */
export interface Heuristic {
  id: string;
  titulo: string;
  regla: string;
  fuente: SourceKey;
}

export const HEURISTICS: Heuristic[] = [
  {
    id: 'fatiga-rpe',
    titulo: 'Fatiga por RPE alto sostenido',
    regla: 'Si el RPE medio es ≥9 en 2 sesiones seguidas, reduce 1 serie o ~5% la carga.',
    fuente: 'robinson2024',
  },
  {
    id: 'progresion-doble',
    titulo: 'Doble progresión',
    regla: 'Si completas el techo de repeticiones en todas las series con RPE <8, sube la carga un 2-10% (~2,5 kg aislamiento / ~5 kg compuesto).',
    fuente: 'acsm2009',
  },
  {
    id: 'volumen-bajo',
    titulo: 'Volumen por debajo del mínimo eficaz',
    regla: 'Si un músculo recibe menos del MEV de series/semana, añade 1-2 series.',
    fuente: 'schoenfeld2017',
  },
  {
    id: 'volumen-alto',
    titulo: 'Volumen por encima del máximo recuperable',
    regla: 'Si un músculo supera su MRV o el RPE se dispara, recorta hacia el MAV.',
    fuente: 'rpLandmarks',
  },
  {
    id: 'frecuencia',
    titulo: 'Frecuencia semanal',
    regla: 'Entrenar cada músculo ≥2 veces/semana reparte mejor el volumen que 1 sola.',
    fuente: 'schoenfeld2016',
  },
  {
    id: 'deload',
    titulo: 'Descarga (deload)',
    regla: 'Tras ~6 semanas sin descarga o ante una caída de rendimiento, baja el volumen ~50% una semana.',
    fuente: 'bell2023',
  },
  {
    id: 'sueno',
    titulo: 'Ajuste por sueño',
    regla: 'Con sueño medio por debajo del objetivo (7 h), baja 10-20% el volumen/intensidad de la sesión.',
    fuente: 'vitale2019',
  },
  {
    id: 'descansos',
    titulo: 'Descansos entre series',
    regla: 'Para fuerza en entrenados, descansa >2 min entre series; con descansos cortos (45-90 s) las ganancias siguen siendo robustas en hipertrofia/definición.',
    fuente: 'grgic2018',
  },
  {
    id: 'rpe-escala',
    titulo: 'Escala RPE/RIR',
    regla: 'El RPE 6-10 anclado en repeticiones en reserva (RPE 9 = 1 RIR, RPE 10 = 0 RIR) es una medida válida de intensidad serie a serie.',
    fuente: 'zourdos2016',
  },
  {
    id: 'cargas-objetivo',
    titulo: 'Cargas por objetivo',
    regla: 'La fuerza requiere cargas altas (≥80% 1RM); la hipertrofia se logra en un espectro amplio de cargas si las series se acercan al fallo.',
    fuente: 'schoenfeld2021',
  },
  {
    id: 'calentamiento',
    titulo: 'Calentamiento',
    regla: 'Calentar antes de las series efectivas mejora el rendimiento en la gran mayoría de los casos analizados (79%).',
    fuente: 'fradkin2010',
  },
  {
    id: 'superseries',
    titulo: 'Superseries para ahorrar tiempo',
    regla: 'Agrupar ejercicios en superserie mantiene las ganancias de fuerza e hipertrofia reduciendo la duración de la sesión.',
    fuente: 'iversen2021',
  },
];

/** Texto de cita corto para mostrar bajo cada recomendación. */
export function citation(key: SourceKey): string {
  const s = SOURCES[key];
  return `${s.autor}, ${s.anio}`;
}
