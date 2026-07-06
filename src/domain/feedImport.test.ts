import { describe, expect, it } from 'vitest';
import type { Exercise } from '../data/models';
import { resolveRoutineImport } from './feedImport';

const ex = (id: string, name: string): Exercise => ({
  id,
  name,
  muscleGroup: 'pecho',
  equipment: 'barra',
  instructions: '',
  isCustom: false,
  createdAt: '2026-07-01',
});

const EXERCISES = [ex('press-banca', 'Press de banca'), ex('remo-barra', 'Remo con barra')];

describe('importar rutina desde el feed', () => {
  it('con exerciseIds usa los ids, filtrando los que no existen aquí', () => {
    const r = resolveRoutineImport(
      { lines: ['Press de banca', 'Ejercicio raro'], exerciseIds: ['press-banca', 'custom-de-otro'] },
      EXERCISES,
    );
    expect(r.exerciseIds).toEqual(['press-banca']);
    expect(r.missing).toBe(1);
  });

  it('sin exerciseIds (post antiguo) casa por nombre, sin distinguir mayúsculas', () => {
    const r = resolveRoutineImport({ lines: ['press de banca', 'Remo con barra', 'Inventado'] }, EXERCISES);
    expect(r.exerciseIds).toEqual(['press-banca', 'remo-barra']);
    expect(r.missing).toBe(1);
  });
});
