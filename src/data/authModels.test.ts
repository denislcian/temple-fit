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

  it('exige al menos 8 caracteres', () => {
    expect(validatePassword('corta')).toMatch(/al menos 8/);
    expect(validatePassword('a'.repeat(101))).toMatch(/demasiado larga/);
  });

  it('rechaza contraseñas comunes y secuencias triviales', () => {
    expect(validatePassword('password')).toMatch(/común/);
    expect(validatePassword('12345678')).toMatch(/común|secuencias/);
    expect(validatePassword('abcdefgh')).toMatch(/secuencias/);
    expect(validatePassword('aaaaaaaa')).toMatch(/secuencias|repetidos/);
  });

  it('a las cortas (<12) les exige variedad de caracteres', () => {
    expect(validatePassword('sololetras')).toMatch(/Combina|más larga/); // 10, 1 tipo
    expect(validatePassword('Temple7x')).toBeNull(); // 8, 3 tipos: ok
  });

  it('acepta passphrases largas aunque sean solo minúsculas', () => {
    expect(validatePassword('caballo correcto bateria')).toBeNull(); // 24 chars
  });

  it('passwordStrength puntúa de 0 a 4 y marca lo trivial como muy débil', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('12345678').score).toBe(0); // secuencia
    expect(passwordStrength('Temple7x').score).toBeGreaterThanOrEqual(2);
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
