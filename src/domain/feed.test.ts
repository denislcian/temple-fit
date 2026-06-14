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
});
