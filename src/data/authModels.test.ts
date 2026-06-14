import { describe, expect, it } from 'vitest';
import {
  avatarHue,
  initials,
  normalizeUsername,
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

  it('exige contraseñas de al menos 8 caracteres', () => {
    expect(validatePassword('corta')).toMatch(/al menos 8/);
    expect(validatePassword('unaclavebuena')).toBeNull();
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
