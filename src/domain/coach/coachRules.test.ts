import { describe, expect, it } from 'vitest';
import type { Exercise, Session, WorkoutSet } from '../../data/models';
import type { SleepSession } from '../../data/sleepModels';
import { buildCoachContext } from './coachContext';
import { composeCoachAdvice, evaluateCoach, fatigueVerdict } from './coachRules';

const TODAY = '2026-06-24';

function daysAgo(n: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return `${d.toISOString().slice(0, 10)}T10:00:00.000Z`;
}

function set(reps: number, weightKg: number, rpe?: number): WorkoutSet {
  return { reps, weightKg, done: true, ...(rpe !== undefined ? { rpe } : {}) };
}

function session(date: string, entries: Array<{ exerciseId: string; sets: WorkoutSet[] }>): Session {
  return { id: `s-${date}-${Math.round(Math.random() * 1e6)}`, date, entries };
}

const EXERCISES: Exercise[] = [
  { id: 'press-banca', name: 'Press banca', muscleGroup: 'pecho', equipment: 'barra', instructions: '', isCustom: false, createdAt: TODAY },
  { id: 'curl-mancuernas', name: 'Curl con mancuernas', muscleGroup: 'bíceps', equipment: 'mancuernas', instructions: '', isCustom: false, createdAt: TODAY },
];

function ctx(sessions: Session[], sleep: SleepSession[] = []) {
  return buildCoachContext({ sessions, sleepSessions: sleep, exercises: EXERCISES, todayISO: TODAY });
}

describe('coach: contexto', () => {
  it('sin sesiones → veredicto sin datos y recomendación de empezar', () => {
    const c = ctx([]);
    expect(c.sessionCount).toBe(0);
    expect(fatigueVerdict(c).estado).toBe('sin-datos');
    const recs = evaluateCoach(c, 'hipertrofia');
    expect(recs.some((r) => r.id === 'datos-empezar')).toBe(true);
    expect(recs.some((r) => r.kind === 'objetivo')).toBe(true);
  });

  it('agrega RPE y volumen por músculo de los últimos 7 días', () => {
    const c = ctx([
      session(daysAgo(1), [{ exerciseId: 'press-banca', sets: [set(8, 60, 8), set(8, 60, 8)] }]),
    ]);
    expect(c.avgRpe7d).toBe(8);
    expect(c.rpeSampleSize).toBe(2);
    expect(c.muscleVolumes.find((m) => m.muscle === 'pecho')?.sets).toBe(2);
  });
});

describe('coach: reglas', () => {
  it('2 sesiones seguidas con RPE ≥9 → alerta de fatiga', () => {
    const hard = [set(5, 100, 9), set(5, 100, 10)];
    const c = ctx([
      session(daysAgo(0), [{ exerciseId: 'press-banca', sets: hard }]),
      session(daysAgo(2), [{ exerciseId: 'press-banca', sets: hard }]),
    ]);
    expect(c.hardSessionsInARow).toBeGreaterThanOrEqual(2);
    const recs = evaluateCoach(c, 'fuerza');
    const fatiga = recs.find((r) => r.id === 'fatiga-rpe');
    expect(fatiga?.tone).toBe('alerta');
    expect(fatigueVerdict(c).estado).toBe('cargado');
  });

  it('sueño bajo (<6 h) → recomienda bajar intensidad', () => {
    const sleep: SleepSession[] = [0, 1, 2].map((n) => ({
      id: `sl-${n}`,
      date: daysAgo(n).slice(0, 10),
      startedAt: daysAgo(n),
      endedAt: daysAgo(n),
      durationMin: 300,
      levels: [],
      events: [],
      snoreCount: 0,
      noiseCount: 0,
    }));
    const c = ctx([session(daysAgo(1), [{ exerciseId: 'press-banca', sets: [set(8, 60, 7)] }])], sleep);
    expect(c.avgSleepMin).toBe(300);
    const recs = evaluateCoach(c, 'hipertrofia');
    expect(recs.some((r) => r.id === 'sueno-bajo')).toBe(true);
  });

  it('6+ semanas seguidas entrenando → sugiere descarga', () => {
    const sessions = Array.from({ length: 7 }, (_, w) =>
      session(daysAgo(w * 7), [{ exerciseId: 'press-banca', sets: [set(8, 60, 7)] }]),
    );
    const c = ctx(sessions);
    expect(c.weeksContinuous).toBeGreaterThanOrEqual(6);
    expect(evaluateCoach(c, 'hipertrofia').some((r) => r.id === 'deload')).toBe(true);
  });

  it('todas las series con muchas reps y poco esfuerzo → sube peso', () => {
    const c = ctx([
      session(daysAgo(0), [{ exerciseId: 'press-banca', sets: [set(12, 60, 6), set(12, 60, 7)] }]),
    ]);
    expect(c.exerciseSignals[0]?.readyToProgress).toBe(true);
    const recs = evaluateCoach(c, 'hipertrofia');
    const prog = recs.find((r) => r.id === 'progresion-press-banca');
    expect(prog?.tone).toBe('positivo');
    expect(prog?.detalle).toContain('5 kg'); // compuesto
  });

  it('volumen por debajo del MEV → sugiere añadir series', () => {
    const c = ctx([
      session(daysAgo(1), [{ exerciseId: 'curl-mancuernas', sets: [set(10, 12, 8), set(10, 12, 8)] }]),
    ]);
    // bíceps MEV = 6; aquí solo 2 series → por debajo.
    expect(evaluateCoach(c, 'hipertrofia').some((r) => r.id === 'volumen-bajo-bíceps')).toBe(true);
  });

  it('sin RPE registrado → invita a capturarlo', () => {
    const c = ctx([session(daysAgo(1), [{ exerciseId: 'press-banca', sets: [set(8, 60)] }])]);
    expect(c.rpeSampleSize).toBe(0);
    expect(evaluateCoach(c, 'fuerza').some((r) => r.id === 'datos-rpe')).toBe(true);
  });
});

describe('coach: consejo local (sin IA, sin descargas)', () => {
  it('sin datos → invita a registrar y no menciona descargas ni modelos', () => {
    const c = ctx([]);
    const advice = composeCoachAdvice(c, fatigueVerdict(c), evaluateCoach(c, 'hipertrofia'), 'hipertrofia');
    expect(advice.foco).toBe('Empieza a registrar');
    expect(advice.mensaje).not.toMatch(/descarg|modelo|GB|WebGPU/i);
  });

  it('con fatiga alta → el foco es la acción prioritaria y el mensaje cita estado y objetivo', () => {
    const hard = [set(5, 100, 9), set(5, 100, 10)];
    const c = ctx([
      session(daysAgo(0), [{ exerciseId: 'press-banca', sets: hard }]),
      session(daysAgo(2), [{ exerciseId: 'press-banca', sets: hard }]),
    ]);
    const advice = composeCoachAdvice(c, fatigueVerdict(c), evaluateCoach(c, 'fuerza'), 'fuerza');
    expect(advice.foco).toBe('Baja la intensidad hoy'); // la alerta tiene prioridad
    expect(advice.mensaje).toContain('cargado');
    expect(advice.mensaje).toContain('fuerza');
  });
});
