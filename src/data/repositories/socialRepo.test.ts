import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/dbTestUtils';
import { db } from '../db';
import { socialRepo } from './socialRepo';

describe('socialRepo (modo local)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('siembra publicaciones de ejemplo ordenadas de más reciente a más antigua', async () => {
    const feed = await socialRepo.getFeed();
    expect(feed.length).toBeGreaterThanOrEqual(3);
    expect(feed.every((p) => p.isDemo)).toBe(true);
    const dates = feed.map((p) => p.createdAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('siembra las cuentas de ejemplo aunque el usuario ya se haya registrado antes', async () => {
    // Regresión: registrarse antes de abrir el feed dejaba la tabla de cuentas
    // no vacía, y las cuentas de ejemplo (seguibles) no llegaban a sembrarse.
    await db.accounts.add({
      id: 'acc-real',
      username: 'denis_lift',
      displayName: 'Denis Lucian',
      passwordHash: 'x',
      passwordSalt: 'y',
      createdAt: new Date().toISOString(),
    });
    await socialRepo.getFeed(); // dispara la siembra con una cuenta real ya presente
    const discover = await socialRepo.discoverAccounts('acc-real');
    const usernames = discover.map((a) => a.username).sort();
    expect(usernames).toEqual(['alex_g', 'marta_r']);
  });

  it('publica con rutina adjunta y aparece la primera del feed', async () => {
    await socialRepo.getFeed(); // siembra
    await socialRepo.publish({
      author: 'Dani',
      authorId: 'acc-dani',
      text: 'Semana 1 completada',
      kind: 'rutina',
      payload: { title: 'Empuje', lines: ['Press banca 4×8', 'Press militar 3×10'] },
    });
    const feed = await socialRepo.getFeed();
    expect(feed[0]?.author).toBe('Dani');
    expect(feed[0]?.visibility).toBe('publica');
    expect(feed[0]?.payload?.lines).toHaveLength(2);
    expect(feed[0]?.likes).toBe(0);
  });

  it('el me gusta es un toggle que actualiza el contador', async () => {
    const feed = await socialRepo.getFeed();
    const post = feed[0]!;
    const liked = await socialRepo.toggleLike(post.id);
    expect(liked?.likedByMe).toBe(true);
    expect(liked?.likes).toBe(post.likes + 1);
    const unliked = await socialRepo.toggleLike(post.id);
    expect(unliked?.likedByMe).toBe(false);
    expect(unliked?.likes).toBe(post.likes);
  });

  it('añade comentarios al final de la conversación', async () => {
    const feed = await socialRepo.getFeed();
    const post = feed.find((p) => p.id === 'demo-marta')!;
    await socialRepo.addComment(post.id, 'Dani', '¡Gran rutina!');
    const updated = (await socialRepo.getFeed()).find((p) => p.id === post.id)!;
    expect(updated.comments.length).toBe(post.comments.length + 1);
    expect(updated.comments.at(-1)?.author).toBe('Dani');
  });

  it('solo deja eliminar publicaciones propias (las demo están protegidas)', async () => {
    await socialRepo.getFeed();
    const own = await socialRepo.publish({
      author: 'Dani',
      authorId: 'acc-dani',
      text: 'Borrar luego',
      kind: 'texto',
    });
    await expect(socialRepo.removeOwnPost('demo-marta', 'acc-dani')).rejects.toThrow(/propias/);
    await expect(socialRepo.removeOwnPost(own.id, 'acc-otra')).rejects.toThrow(/propias/);
    await socialRepo.removeOwnPost(own.id, 'acc-dani');
    const feed = await socialRepo.getFeed();
    expect(feed.some((p) => p.id === own.id)).toBe(false);
  });
});
