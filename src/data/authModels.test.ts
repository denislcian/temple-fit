import { describe, expect, it } from 'vitest';
import {
  avatarHue,
  initials,
  normalizeUsername,
  passwordStrength,
  validateDisplayName,
  validatePassword,
  validateUsername,
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
