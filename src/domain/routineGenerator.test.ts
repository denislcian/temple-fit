import { describe, expect, it } from 'vitest';
import { CATALOG } from '../data/catalog';
import type { Exercise } from '../data/models';
import { generatePlan, type GeneratorOptions } from './routineGenerator';

const exercises: Exercise[] = CATALOG.map((c) => ({
  ...c,
  isCustom: false,
  createdAt: '2026-06-01T00:00:00.000Z',
}));

const base: GeneratorOptions = {
  goal: 'hipertrofia',
  daysPerWeek: 3,
  equipment: 'gimnasio',
  level: 'intermedio',
};

describe('routineGenerator', () => {
  it('genera tantos días como se piden, con 4-6 ejercicios por día', () => {
    for (const daysPerWeek of [2, 3, 4, 5] as const) {
      const plan = generatePlan({ ...base, daysPerWeek }, exercises);
      expect(plan.days).toHaveLength(daysPerWeek);
      for (const day of plan.days) {
        expect(day.exerciseIds.length).toBeGreaterThanOrEqual(4);
        expect(day.exerciseIds.length).toBeLessThanOrEqual(6);
      }
    }
  });

  it('solo usa ejercicios del catálogo disponible y sin repetir en el mismo día', () => {
    const ids = new Set(exercises.map((e) => e.id));
    const plan = generatePlan({ ...base, daysPerWeek: 5 }, exercises);
    for (const day of plan.days) {
      expect(new Set(day.exerciseIds).size).toBe(day.exerciseIds.length);
      for (const id of day.exerciseIds) {
        expect(ids.has(id)).toBe(true);
      }
    }
  });

  it('respeta el material: el perfil "casa" no usa barra, máquina ni polea', () => {
    const allowed = new Set(['peso corporal', 'banda elástica', 'otro']);
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const plan = generatePlan({ ...base, equipment: 'casa', daysPerWeek: 3 }, exercises);
    for (const day of plan.days) {
      for (const id of day.exerciseIds) {
        expect(allowed.has(byId.get(id)!.equipment)).toBe(true);
      }
    }
  });

  it('adapta el esquema al objetivo y lo refleja en las notas', () => {
    const fuerza = generatePlan({ ...base, goal: 'fuerza' }, exercises);
    expect(fuerza.days[0]?.notes).toContain('4-6 repeticiones');
    expect(fuerza.days[0]?.notes).toContain('2-3 min');

    const definicion = generatePlan({ ...base, goal: 'definicion' }, exercises);
    expect(definicion.days[0]?.notes).toContain('12-20');
    expect(definicion.summary).toContain('cardio');
  });

  it('para principiantes prioriza variantes guiadas (jalón antes que dominadas)', () => {
    const plan = generatePlan(
      { goal: 'hipertrofia', daysPerWeek: 5, equipment: 'gimnasio', level: 'principiante' },
      exercises,
    );
    const allIds = plan.days.flatMap((d) => d.exerciseIds);
    expect(allIds).toContain('jalon-al-pecho');
    expect(allIds).not.toContain('dominadas');
  });

  it('los días de cuerpo completo A y B usan ejercicios distintos entre sí', () => {
    const plan = generatePlan({ ...base, daysPerWeek: 2 }, exercises);
    const dayA = new Set(plan.days[0]?.exerciseIds);
    const dayB = plan.days[1]?.exerciseIds ?? [];
    const overlap = dayB.filter((id) => dayA.has(id));
    expect(overlap.length).toBeLessThanOrEqual(1);
  });

  it('es determinista: mismas opciones producen el mismo plan', () => {
    const a = generatePlan(base, exercises);
    const b = generatePlan(base, exercises);
    expect(a).toEqual(b);
  });
});
