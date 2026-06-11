import { describe, expect, it } from 'vitest';
import { platesFor, suggestProgression, warmupSets } from './gymTools';

describe('platesFor', () => {
  it('monta 100 kg con barra de 20: 40 kg por lado, empezando por el disco mayor', () => {
    const r = platesFor(100);
    expect(r.perSide).toEqual([25, 15]);
    expect(r.achievedKg).toBe(100);
    expect(r.residualKg).toBe(0);
  });

  it('monta 62,5 kg: 20 + 1,25 por lado', () => {
    const r = platesFor(62.5);
    expect(r.perSide).toEqual([20, 1.25]);
    expect(r.achievedKg).toBe(62.5);
  });

  it('si el peso no es montable exacto, se queda en el más cercano por debajo', () => {
    const r = platesFor(61); // 20,5 por lado → 20 + nada montable de 0,5
    expect(r.achievedKg).toBe(60);
    expect(r.residualKg).toBe(1);
  });

  it('por debajo del peso de la barra devuelve la barra vacía', () => {
    const r = platesFor(15);
    expect(r.perSide).toEqual([]);
    expect(r.achievedKg).toBe(20);
  });

  it('acepta otra barra y otros discos disponibles', () => {
    const r = platesFor(40, 10, [10, 5, 2.5]);
    expect(r.perSide).toEqual([10, 5]);
    expect(r.achievedKg).toBe(40);
  });
});

describe('warmupSets', () => {
  it('para 100 kg: barra, 40, 60 y 80 kg', () => {
    const sets = warmupSets(100);
    expect(sets).toEqual([
      { pct: 0, reps: 10, weightKg: 20 },
      { pct: 40, reps: 8, weightKg: 40 },
      { pct: 60, reps: 5, weightKg: 60 },
      { pct: 80, reps: 3, weightKg: 80 },
    ]);
  });

  it('redondea a múltiplos de 2,5 kg montables', () => {
    const sets = warmupSets(87.5);
    for (const s of sets) {
      expect((s.weightKg * 10) % 25).toBe(0);
      expect(s.weightKg).toBeLessThan(87.5);
    }
  });

  it('con pesos ligeros omite escalones redundantes', () => {
    const sets = warmupSets(30);
    // 40% de 30 = 12 → se queda en la barra (20); no debe repetirse
    expect(sets.length).toBeLessThanOrEqual(2);
    const weights = sets.map((s) => s.weightKg);
    expect(new Set(weights).size).toBe(weights.length);
  });

  it('si el trabajo es la propia barra o menos, no hay calentamiento con barra', () => {
    expect(warmupSets(20)).toEqual([]);
  });
});

describe('suggestProgression', () => {
  it('todas completadas con 8+ reps → subir peso', () => {
    const s = suggestProgression([
      { reps: 8, weightKg: 60, done: true },
      { reps: 8, weightKg: 60, done: true },
      { reps: 9, weightKg: 60, done: true },
    ]);
    expect(s?.action).toBe('subir');
    expect(s?.nextWeightKg).toBe(62.5);
  });

  it('con pesos altos el incremento escala (~2,5% redondeado a 2,5)', () => {
    const s = suggestProgression([{ reps: 8, weightKg: 140, done: true }]);
    expect(s?.action).toBe('subir');
    expect(s?.nextWeightKg).toBe(142.5); // 3,5 → redondeado a 2,5... mín 2,5
  });

  it('todas completadas con pocas reps → repetir peso buscando más reps', () => {
    const s = suggestProgression([
      { reps: 5, weightKg: 80, done: true },
      { reps: 5, weightKg: 80, done: true },
    ]);
    expect(s?.action).toBe('repetir');
    expect(s?.nextWeightKg).toBe(80);
  });

  it('alguna serie fallada → consolidar', () => {
    const s = suggestProgression([
      { reps: 8, weightKg: 70, done: true },
      { reps: 6, weightKg: 70, done: false },
    ]);
    expect(s?.action).toBe('consolidar');
  });

  it('sin series con peso (solo corporal) no sugiere nada', () => {
    expect(suggestProgression([{ reps: 12, weightKg: 0, done: true }])).toBeNull();
  });
});
