import { describe, expect, it } from 'vitest';
import {
  avatarHue,
  computeAge,
  initials,
  normalizeUsername,
  passwordStrength,
  validateBirthdate,
  validateDisplayName,
  validateHeightCm,
  validatePassword,
  validateUsername,
  validateWeightKg,
} from './authModels';

describe('authModels — validación', () => {
  it('normaliza el usuario a minúsculas sin espacios', () => {
    expect(normalizeUsername('  Dani_Lift ')).toBe('dani_lift');
  });

  it('valida el formato del usuario', () => {
    expect(validateUsername('ab')).toMatch(/al menos 3/);
    expect(validateUsername('a'.repeat(21))).toMatch(/20 caracteres/);
    expect(validateUsername('con espacio')).toMatch(/sin espacios/);
    expect(validateUsername('dani.lift_99')).toBeNull();
  });

  it('valida el nombre para mostrar', () => {
    expect(validateDisplayName('   ')).toMatch(/Escribe un nombre/);
    expect(validateDisplayName('x'.repeat(41))).toMatch(/40/);
    expect(validateDisplayName('Dani')).toBeNull();
  });

  it('exige al menos 12 caracteres', () => {
    expect(validatePassword('Aa1!aaaa')).toMatch(/12 caracteres/); // 8
    expect(validatePassword('A'.repeat(101))).toMatch(/demasiado larga/);
  });

  it('exige minúscula, mayúscula, número y símbolo (alta seguridad)', () => {
    expect(validatePassword('alllowercase12!@')).toMatch(/mayúscula/);
    expect(validatePassword('ALLUPPERCASE12!@')).toMatch(/minúscula/);
    expect(validatePassword('NoNumbersHere!!@')).toMatch(/número/);
    expect(validatePassword('NoSymbolsHere123')).toMatch(/símbolo/);
    expect(validatePassword('Temple7x!Run_42')).toBeNull(); // 15, los 4 tipos
  });

  it('passwordStrength: 0-4, y como mucho "Débil" mientras no cumpla la política', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('12345678').score).toBe(0); // secuencia
    expect(passwordStrength('Temple7x').score).toBeLessThanOrEqual(1); // no cumple (8 chars)
    expect(passwordStrength('Temple7x!Run_42').score).toBeGreaterThanOrEqual(3); // cumple
    expect(passwordStrength('Caballo-Correcto-7-Bateria!').score).toBe(4);
  });
});

describe('authModels — avatar', () => {
  it('avatarHue es determinista y está en rango', () => {
    const h = avatarHue('abc');
    expect(h).toBe(avatarHue('abc'));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });

  it('initials toma 1 o 2 iniciales', () => {
    expect(initials('Dani')).toBe('DA');
    expect(initials('Marta Ruiz')).toBe('MR');
    expect(initials('  ')).toBe('?');
  });
});

describe('authModels — datos físicos (registro)', () => {
  const today = '2026-06-28';

  it('computeAge calcula la edad respecto a hoy', () => {
    expect(computeAge('1996-06-28', today)).toBe(30);
    expect(computeAge('1996-06-29', today)).toBe(29); // aún no cumple
    expect(computeAge(undefined, today)).toBeNull();
    expect(computeAge('no-fecha', today)).toBeNull();
  });

  it('validateBirthdate: opcional, rango 13-120 y sin futuro', () => {
    expect(validateBirthdate('', today)).toBeNull(); // opcional
    expect(validateBirthdate('2030-01-01', today)).toMatch(/futura/);
    expect(validateBirthdate('2020-01-01', today)).toMatch(/13 años/);
    expect(validateBirthdate('1850-01-01', today)).toMatch(/Revisa/);
    expect(validateBirthdate('1995-03-10', today)).toBeNull();
  });

  it('validateHeightCm: opcional, 100-250', () => {
    expect(validateHeightCm(undefined)).toBeNull();
    expect(validateHeightCm(50)).toMatch(/100 y 250/);
    expect(validateHeightCm(260)).toMatch(/100 y 250/);
    expect(validateHeightCm(178)).toBeNull();
  });

  it('validateWeightKg: opcional, 30-300', () => {
    expect(validateWeightKg(undefined)).toBeNull();
    expect(validateWeightKg(10)).toMatch(/30 y 300/);
    expect(validateWeightKg(400)).toMatch(/30 y 300/);
    expect(validateWeightKg(74.5)).toBeNull();
  });
});
