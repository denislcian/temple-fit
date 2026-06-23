// CAPA 2 · Dominio — Patrones de respiración guiada (puros, sin estado).
// La animación del círculo y el conteo se derivan del tiempo transcurrido.

export type BreathKind = 'inhala' | 'manten' | 'exhala';

export interface BreathPhase {
  kind: BreathKind;
  seconds: number;
  label: string;
}

export interface BreathPattern {
  id: string;
  label: string;
  description: string;
  phases: BreathPhase[];
}

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'caja',
    label: 'Respiración en caja (4-4-4-4)',
    description: 'Equilibra y calma. Usada por deportistas y fuerzas especiales.',
    phases: [
      { kind: 'inhala', seconds: 4, label: 'Inhala' },
      { kind: 'manten', seconds: 4, label: 'Mantén' },
      { kind: 'exhala', seconds: 4, label: 'Exhala' },
      { kind: 'manten', seconds: 4, label: 'Mantén' },
    ],
  },
  {
    id: 'relajante',
    label: 'Relajante (4-7-8)',
    description: 'Para conciliar el sueño y bajar la activación.',
    phases: [
      { kind: 'inhala', seconds: 4, label: 'Inhala' },
      { kind: 'manten', seconds: 7, label: 'Mantén' },
      { kind: 'exhala', seconds: 8, label: 'Exhala' },
    ],
  },
  {
    id: 'coherencia',
    label: 'Coherencia (5-5)',
    description: 'Respiración lenta y simétrica; estabiliza el ritmo cardíaco.',
    phases: [
      { kind: 'inhala', seconds: 5, label: 'Inhala' },
      { kind: 'exhala', seconds: 5, label: 'Exhala' },
    ],
  },
];

export function cycleSeconds(pattern: BreathPattern): number {
  return pattern.phases.reduce((acc, p) => acc + p.seconds, 0);
}

export interface BreathState {
  /** Fase actual. */
  phase: BreathPhase;
  /** Índice de la fase dentro del ciclo. */
  phaseIndex: number;
  /** Segundos restantes de la fase (redondeado hacia arriba: 4,3,2,1). */
  secondsLeft: number;
  /** Escala del círculo 0..1 (0 = exhalado/pequeño, 1 = inhalado/grande). */
  scale: number;
}

/**
 * Estado de la respiración en el segundo `elapsed`. La escala sube en inhala,
 * se mantiene en mantén (al valor de la fase previa) y baja en exhala.
 */
export function breathStateAt(pattern: BreathPattern, elapsed: number): BreathState {
  const cycle = cycleSeconds(pattern);
  let t = elapsed % cycle;
  if (t < 0) t += cycle;

  let index = 0;
  let acc = 0;
  for (let i = 0; i < pattern.phases.length; i++) {
    const dur = pattern.phases[i]!.seconds;
    if (t < acc + dur || i === pattern.phases.length - 1) {
      index = i;
      break;
    }
    acc += dur;
  }
  const phase = pattern.phases[index]!;
  const within = t - acc; // 0..phase.seconds
  const progress = Math.min(1, within / phase.seconds);
  const secondsLeft = Math.max(1, Math.ceil(phase.seconds - within));

  // Escala objetivo según el tipo de fase. En "mantén" se conserva la escala de
  // la fase anterior (grande tras inhalar, pequeña tras exhalar).
  let scale: number;
  if (phase.kind === 'inhala') {
    scale = progress;
  } else if (phase.kind === 'exhala') {
    scale = 1 - progress;
  } else {
    const prev = pattern.phases[(index - 1 + pattern.phases.length) % pattern.phases.length]!;
    scale = prev.kind === 'exhala' ? 0 : 1;
  }

  return { phase, phaseIndex: index, secondsLeft, scale };
}
