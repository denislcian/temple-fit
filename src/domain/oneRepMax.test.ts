import { describe, expect, it } from 'vitest';
import { brzycki1RM, epley1RM, estimate1RM } from './oneRepMax';

describe('oneRepMax', () => {
  it('Epley: 100 kg × 10 reps ≈ 133,3 kg', () => {
    expect(epley1RM(100, 10)).toBe(133.3);
  });

  it('Brzycki: 100 kg × 10 reps ≈ 133,3 kg', () => {
    expect(brzycki1RM(100, 10)).toBe(133.3);
  });

  it('con 1 repetición, el 1RM es el propio peso (sin estimar)', () => {
    expect(epley1RM(120, 1)).toBe(120);
    expect(brzycki1RM(120, 1)).toBe(120);
    expect(estimate1RM(120, 1)).toBe(120);
  });

  it('estimate1RM promedia Epley y Brzycki', () => {
    // 80 kg × 5 reps → Epley 93,3 · Brzycki 90 → media 91,7 (las fórmulas
    // divergen con pocas repeticiones; la media compensa el sesgo)
    expect(epley1RM(80, 5)).toBe(93.3);
    expect(brzycki1RM(80, 5)).toBe(90);
    expect(estimate1RM(80, 5)).toBe(91.7);
  });

  it('Brzycki no es válida con 37+ reps; estimate1RM usa Epley en ese caso', () => {
    expect(() => brzycki1RM(50, 37)).toThrow(RangeError);
    expect(estimate1RM(50, 40)).toBe(epley1RM(50, 40));
  });

  it('acepta peso 0 (ejercicios a peso corporal)', () => {
    expect(epley1RM(0, 12)).toBe(0);
  });

  it('rechaza entradas inválidas con errores descriptivos', () => {
    expect(() => epley1RM(-10, 5)).toThrow(/peso/);
    expect(() => epley1RM(NaN, 5)).toThrow(/peso/);
    expect(() => epley1RM(100, 0)).toThrow(/repeticiones/);
    expect(() => epley1RM(100, 2.5)).toThrow(/repeticiones/);
    expect(() => brzycki1RM(100, -1)).toThrow(/repeticiones/);
    expect(() => estimate1RM(-1, 5)).toThrow(/peso/);
  });
});
