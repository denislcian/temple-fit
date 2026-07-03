import { describe, expect, it } from 'vitest';
import { isRoutineRequest } from './chatIntent';

describe('chat del coach: intención de rutina', () => {
  it('detecta peticiones de rutina/plan en lenguaje natural', () => {
    expect(isRoutineRequest('hazme una rutina')).toBe(true);
    expect(isRoutineRequest('Quiero un plan de entrenamiento para 4 días')).toBe(true);
    expect(isRoutineRequest('RUTINA de fuerza')).toBe(true);
    expect(isRoutineRequest('prepárame un plan')).toBe(true);
    expect(isRoutineRequest('¿qué entreno cada día?')).toBe(true);
  });

  it('no confunde preguntas normales con rutinas', () => {
    expect(isRoutineRequest('¿cuánto descanso entre series?')).toBe(false);
    expect(isRoutineRequest('¿por qué me pides bajar la intensidad?')).toBe(false);
    expect(isRoutineRequest('')).toBe(false);
  });
});
