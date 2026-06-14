// CAPA 2 · Dominio — Visibilidad del feed (privacidad por publicación).
//
// Pura y testeable. En la nube esta MISMA lógica se aplica en el servidor
// mediante políticas Row Level Security (ver docs/SECURITY.md): aquí en el
// cliente es por conveniencia del modo local; nunca debe ser la única
// barrera en producción (cualquiera podría saltarse el filtro del cliente).
import type { Post } from '../data/nutritionModels';

/**
 * Filtra las publicaciones que `viewerId` tiene permitido ver.
 * @param posts todas las publicaciones
 * @param viewerId cuenta que mira (null si no ha iniciado sesión)
 * @param followeeIds ids de las cuentas a las que sigue el viewer
 */
export function visiblePosts(
  posts: Post[],
  viewerId: string | null,
  followeeIds: Iterable<string>,
): Post[] {
  const following = new Set(followeeIds);
  return posts.filter((post) => {
    // Las publicaciones de ejemplo del modo local siempre se ven.
    if (post.isDemo) return true;
    // Lo tuyo siempre lo ves, sea cual sea su visibilidad.
    if (viewerId && post.authorId === viewerId) return true;

    switch (post.visibility ?? 'publica') {
      case 'publica':
        return true;
      case 'seguidores':
        return post.authorId !== undefined && following.has(post.authorId);
      case 'privada':
        return false;
    }
  });
}
