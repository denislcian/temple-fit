import { describe, expect, it } from 'vitest';
import type { Post } from '../data/nutritionModels';
import { visiblePosts } from './feed';

function post(id: string, partial: Partial<Post>): Post {
  return {
    id,
    author: 'X',
    createdAt: '2026-06-01T00:00:00.000Z',
    text: '',
    kind: 'texto',
    likes: 0,
    likedByMe: false,
    comments: [],
    ...partial,
  };
}

const posts: Post[] = [
  post('demo', { isDemo: true, visibility: 'privada' }),
  post('pub', { authorId: 'marta', visibility: 'publica' }),
  post('legacy', { authorId: 'marta' }), // sin visibility = pública
  post('fol', { authorId: 'marta', visibility: 'seguidores' }),
  post('mejores', { authorId: 'marta', visibility: 'mejores' }),
  post('priv', { authorId: 'marta', visibility: 'privada' }),
  post('mio-priv', { authorId: 'yo', visibility: 'privada' }),
];

describe('visiblePosts', () => {
  it('un invitado (sin sesión) solo ve públicas y demos', () => {
    const ids = visiblePosts(posts, null, []).map((p) => p.id);
    expect(ids).toEqual(['demo', 'pub', 'legacy']);
  });

  it('si no sigues al autor, no ves las de "solo seguidores" ni las privadas', () => {
    const ids = visiblePosts(posts, 'yo', []).map((p) => p.id);
    expect(ids).toContain('pub');
    expect(ids).toContain('legacy');
    expect(ids).not.toContain('fol');
    expect(ids).not.toContain('priv');
  });

  it('si sigues al autor, ves sus publicaciones de "solo seguidores"', () => {
    const ids = visiblePosts(posts, 'yo', ['marta']).map((p) => p.id);
    expect(ids).toContain('fol');
    expect(ids).not.toContain('priv'); // privada del otro sigue oculta
  });

  it('siempre ves tus propias publicaciones, incluso privadas', () => {
    const ids = visiblePosts(posts, 'yo', []).map((p) => p.id);
    expect(ids).toContain('mio-priv');
  });

  it('"mejores amigos" solo la ven quienes el AUTOR marcó, aunque le sigan', () => {
    // Sigo a marta pero no estoy en su lista: no la veo.
    const sinMarca = visiblePosts(posts, 'yo', ['marta']).map((p) => p.id);
    expect(sinMarca).not.toContain('mejores');
    // Marta me marcó como mejor amigo: la veo (incluso sin seguirla).
    const conMarca = visiblePosts(posts, 'yo', [], ['marta']).map((p) => p.id);
    expect(conMarca).toContain('mejores');
  });

  it('la lista de mejores amigos del viewer no abre publicaciones del autor', () => {
    // Yo marqué a marta como MI mejor amiga, pero ella a mí no: la dirección
    // que cuenta es la del autor, así que su "mejores" sigue oculta.
    const ids = visiblePosts(posts, 'yo', ['marta'], []).map((p) => p.id);
    expect(ids).not.toContain('mejores');
  });

  it('un invitado nunca ve publicaciones de mejores amigos', () => {
    const ids = visiblePosts(posts, null, [], []).map((p) => p.id);
    expect(ids).not.toContain('mejores');
  });
});
