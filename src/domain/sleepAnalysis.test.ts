import { describe, expect, it } from 'vitest';
import type { NoiseEvent } from '../data/sleepModels';
import { classifyNoise, sleepVerdict, summarizeNight } from './sleepAnalysis';

describe('sleepAnalysis', () => {
  it('clasifica como ronquido un evento grave de duración media', () => {
    expect(classifyNoise(1500, 0.75)).toBe('ronquido');
  });

  it('clasifica como ruido lo muy corto, muy largo o agudo', () => {
    expect(classifyNoise(200, 0.8)).toBe('ruido'); // demasiado corto
    expect(classifyNoise(6000, 0.8)).toBe('ruido'); // demasiado largo
    expect(classifyNoise(1500, 0.3)).toBe('ruido'); // agudo (no grave)
  });

  it('resume ronquidos, ruidos, los más fuertes y minutos inquietos', () => {
    const events: NoiseEvent[] = [
      { atMs: 0, durationMs: 1000, peak: 40, kind: 'ronquido' },
      { atMs: 65000, durationMs: 1200, peak: 80, kind: 'ronquido' },
      { atMs: 70000, durationMs: 300, peak: 60, kind: 'ruido' },
    ];
    const s = summarizeNight(events);
    expect(s.snoreCount).toBe(2);
    expect(s.noiseCount).toBe(1);
    expect(s.loudest[0]!.peak).toBe(80);
    expect(s.restlessMinutes).toBe(2); // minutos 0 y 1
  });

  it('da un veredicto según la noche', () => {
    expect(sleepVerdict(summarizeNight([]), 20)).toMatch(/corta/i);
    expect(sleepVerdict(summarizeNight([]), 480)).toMatch(/tranquila/i);
  });
});
