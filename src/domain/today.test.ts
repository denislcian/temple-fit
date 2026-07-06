import { describe, expect, it } from 'vitest';
import type { Routine, Session } from '../data/models';
import { motivationalLine, suggestToday } from './today';

const TODAY = '2026-07-03';

const routine = (id: string, name: string): Routine => ({
  id,
  name,
  exerciseIds: ['press-banca'],
  createdAt: TODAY,
});

const session = (date: string, routineId?: string): Session => ({
  id: `s-${date}`,
  date: `${date}T10:00:00.000Z`,
  entries: [{ exerciseId: 'press-banca', sets: [{ reps: 8, weightKg: 60, done: true }] }],
  ...(routineId ? { routineId } : {}),
});

const ROUTINES = [routine('a', 'Día 1 · Empuje'), routine('b', 'Día 2 · Tirón'), routine('c', 'Día 3 · Pierna')];

describe('suggestToday: rotación de rutinas', () => {
  it('sin rutinas → manda al coach', () => {
    expect(suggestToday([], [], TODAY).kind).toBe('sin-rutinas');
  });

  it('con rutinas y sin historial → estrena la primera', () => {
    const s = suggestToday(ROUTINES, [], TODAY);
    expect(s.kind).toBe('rutina');
    expect(s.routine?.id).toBe('a');
  });

  it('rota a la siguiente tras la última usada (con el "hace N días")', () => {
    const s = suggestToday(ROUTINES, [session('2026-07-01', 'a')], TODAY);
    expect(s.routine?.id).toBe('b');
    expect(s.reason).toContain('hace 2 días');
    expect(s.reason).toContain('Día 1');
  });

  it('desde la última rutina vuelve a la primera (ciclo)', () => {
    const s = suggestToday(ROUTINES, [session('2026-07-02', 'c')], TODAY);
    expect(s.routine?.id).toBe('a');
    expect(s.reason).toContain('ayer');
  });

  it('si ya entrenaste hoy lo reconoce', () => {
    const s = suggestToday(ROUTINES, [session(TODAY, 'a')], TODAY);
    expect(s.kind).toBe('entrenado');
  });

  it('ignora sesiones de rutinas borradas', () => {
    const s = suggestToday(ROUTINES, [session('2026-07-02', 'zz-borrada')], TODAY);
    expect(s.routine?.id).toBe('a');
  });
});

describe('motivationalLine', () => {
  it('estable dentro del día y distinta al día siguiente', () => {
    expect(motivationalLine(TODAY)).toBe(motivationalLine(TODAY));
    expect(motivationalLine('2026-07-04')).not.toBe(motivationalLine(TODAY));
  });
});
