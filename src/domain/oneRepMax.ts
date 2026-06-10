// CAPA 2 · Dominio — Estimación de 1RM (repetición máxima).
// Funciones puras: sin estado, sin dependencias. La analítica que las apps
// comerciales venden como "premium".

/**
 * Fórmula de Epley: 1RM ≈ peso × (1 + reps/30).
 * La más usada; tiende a estimar al alza con repeticiones altas.
 */
export function epley1RM(weightKg: number, reps: number): number {
  assertValidSet(weightKg, reps);
  if (reps === 1) return weightKg;
  return round1(weightKg * (1 + reps / 30));
}

/**
 * Fórmula de Brzycki: 1RM ≈ peso × 36 / (37 − reps).
 * Más conservadora; solo es válida hasta 36 repeticiones.
 */
export function brzycki1RM(weightKg: number, reps: number): number {
  assertValidSet(weightKg, reps);
  if (reps >= 37) {
    throw new RangeError('La fórmula de Brzycki no es válida para 37 o más repeticiones');
  }
  if (reps === 1) return weightKg;
  return round1((weightKg * 36) / (37 - reps));
}

/**
 * Estimación por defecto de la app: media de Epley y Brzycki cuando ambas
 * son válidas (compensa el sesgo de cada una), Epley en caso contrario.
 */
export function estimate1RM(weightKg: number, reps: number): number {
  assertValidSet(weightKg, reps);
  if (reps === 1) return weightKg;
  if (reps >= 37) return epley1RM(weightKg, reps);
  return round1((epley1RM(weightKg, reps) + brzycki1RM(weightKg, reps)) / 2);
}

function assertValidSet(weightKg: number, reps: number): void {
  if (!Number.isFinite(weightKg) || weightKg < 0) {
    throw new RangeError('El peso debe ser un número mayor o igual que 0');
  }
  if (!Number.isInteger(reps) || reps < 1) {
    throw new RangeError('Las repeticiones deben ser un entero mayor o igual que 1');
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
