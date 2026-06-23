import { describe, expect, it } from 'vitest';
import { BREATH_PATTERNS, breathStateAt, cycleSeconds } from './breathing';

const box = BREATH_PATTERNS.find((p) => p.id === 'caja')!;

describe('breathing', () => {
  it('calcula la duración del ciclo', () => {
    expect(cycleSeconds(box)).toBe(16); // 4+4+4+4
  });

  it('arranca inhalando con escala creciente', () => {
    const s0 = breathStateAt(box, 0);
    expect(s0.phase.kind).toBe('inhala');
    expect(s0.scale).toBeCloseTo(0, 2);
    const s2 = breathStateAt(box, 2);
    expect(s2.phase.kind).toBe('inhala');
    expect(s2.scale).toBeCloseTo(0.5, 1);
  });

  it('mantiene la escala alta tras inhalar', () => {
    const s = breathStateAt(box, 6); // 2s dentro del primer "mantén"
    expect(s.phase.kind).toBe('manten');
    expect(s.scale).toBe(1);
  });

  it('exhala bajando la escala', () => {
    const s = breathStateAt(box, 8); // inicio de exhala
    expect(s.phase.kind).toBe('exhala');
    expect(s.scale).toBeCloseTo(1, 2);
    const s2 = breathStateAt(box, 10); // mitad de exhala
    expect(s2.scale).toBeCloseTo(0.5, 1);
  });

  it('mantiene la escala baja tras exhalar y es periódico', () => {
    const s = breathStateAt(box, 14); // segundo "mantén" tras exhala
    expect(s.phase.kind).toBe('manten');
    expect(s.scale).toBe(0);
    // Periodicidad: t y t+ciclo dan la misma fase.
    expect(breathStateAt(box, 1).phase.kind).toBe(breathStateAt(box, 17).phase.kind);
  });

  it('cuenta los segundos restantes hacia abajo (4,3,2,1)', () => {
    expect(breathStateAt(box, 0).secondsLeft).toBe(4);
    expect(breathStateAt(box, 3.1).secondsLeft).toBe(1);
  });
});
