import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './crypto';

describe('crypto — hash de contraseña', () => {
  it('verifica la contraseña correcta y rechaza la incorrecta', async () => {
    const stored = await hashPassword('miClaveSegura123');
    expect(await verifyPassword('miClaveSegura123', stored)).toBe(true);
    expect(await verifyPassword('otraClave', stored)).toBe(false);
  });

  it('genera un salt distinto cada vez (mismo password, hash distinto)', async () => {
    const a = await hashPassword('repetida');
    const b = await hashPassword('repetida');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    // pero ambos verifican
    expect(await verifyPassword('repetida', a)).toBe(true);
    expect(await verifyPassword('repetida', b)).toBe(true);
  });
});
