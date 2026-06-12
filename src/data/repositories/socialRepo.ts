// CAPA 1 · Datos — Repositorio de la comunidad.
//
// MODO LOCAL: el feed vive en IndexedDB de este dispositivo, con
// publicaciones de ejemplo para mostrar la experiencia completa.
//
// La interfaz SocialRepository es el contrato para la fase v2 del roadmap:
// una implementación SupabaseSocialRepository (Postgres + RLS + Realtime)
// sustituirá a esta sin tocar la UI — el mismo patrón repositorio que el
// resto de la app.
import { db } from '../db';
import { newId } from '../models';
import type { Post } from '../nutritionModels';

export interface NewPost {
  author: string;
  text: string;
  kind: Post['kind'];
  payload?: { title: string; lines: string[] };
}

export interface SocialRepository {
  getFeed(): Promise<Post[]>;
  publish(input: NewPost): Promise<Post>;
  toggleLike(postId: string): Promise<Post | undefined>;
  addComment(postId: string, author: string, text: string): Promise<void>;
  removeOwnPost(postId: string, author: string): Promise<void>;
}

class LocalSocialRepository implements SocialRepository {
  async getFeed(): Promise<Post[]> {
    await ensurePostsSeeded();
    return db.posts.orderBy('createdAt').reverse().toArray();
  }

  async publish(input: NewPost): Promise<Post> {
    const post: Post = {
      id: newId(),
      author: input.author,
      createdAt: new Date().toISOString(),
      text: input.text,
      kind: input.kind,
      ...(input.payload ? { payload: input.payload } : {}),
      likes: 0,
      likedByMe: false,
      comments: [],
    };
    await db.posts.add(post);
    return post;
  }

  async toggleLike(postId: string): Promise<Post | undefined> {
    const post = await db.posts.get(postId);
    if (!post) return undefined;
    const likedByMe = !post.likedByMe;
    const likes = Math.max(0, post.likes + (likedByMe ? 1 : -1));
    await db.posts.update(postId, { likedByMe, likes });
    return { ...post, likedByMe, likes };
  }

  async addComment(postId: string, author: string, text: string): Promise<void> {
    const post = await db.posts.get(postId);
    if (!post) return;
    const comments = [
      ...post.comments,
      { id: newId(), author, text, createdAt: new Date().toISOString() },
    ];
    await db.posts.update(postId, { comments });
  }

  async removeOwnPost(postId: string, author: string): Promise<void> {
    const post = await db.posts.get(postId);
    if (!post) return;
    if (post.isDemo || post.author !== author) {
      throw new Error('Solo puedes eliminar tus propias publicaciones');
    }
    await db.posts.delete(postId);
  }
}

/** Publicaciones de ejemplo del modo local (marcadas como demo). */
async function ensurePostsSeeded(): Promise<void> {
  const count = await db.posts.count();
  if (count > 0) return;

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

  const demoPosts: Post[] = [
    {
      id: 'demo-bienvenida',
      author: 'Equipo Temple',
      createdAt: hoursAgo(50),
      kind: 'texto',
      text: 'Bienvenido a la comunidad 👋 Esto es el modo local de demostración: las publicaciones y reacciones se guardan solo en tu dispositivo. Cuando actives la fase en la nube (ver roadmap), compartirás de verdad con otras personas — siempre de forma opcional y privada por defecto.',
      likes: 21,
      likedByMe: false,
      comments: [],
      isDemo: true,
    },
    {
      id: 'demo-marta',
      author: 'Marta R.',
      createdAt: hoursAgo(26),
      kind: 'rutina',
      text: 'Primera semana del bloque de fuerza. La sentadilla empieza a moverse sola 💪',
      payload: {
        title: 'Pierna del lunes',
        lines: [
          'Sentadilla con barra — 4×8',
          'Hip thrust — 4×10',
          'Zancadas — 3×12 por pierna',
          'Curl femoral — 3×12',
          'Plancha — 3×45 s',
        ],
      },
      likes: 12,
      likedByMe: false,
      comments: [
        {
          id: 'demo-c1',
          author: 'Álex G.',
          text: '¡Ese hip thrust ya pesa más que el mío! 🔥',
          createdAt: hoursAgo(24),
        },
        {
          id: 'demo-c2',
          author: 'Lucía M.',
          text: 'Apuntada para el lunes que viene, gracias por compartirla.',
          createdAt: hoursAgo(20),
        },
      ],
      isDemo: true,
    },
    {
      id: 'demo-alex',
      author: 'Álex G.',
      createdAt: hoursAgo(5),
      kind: 'sesion',
      text: 'Día de empuje completado. El press de banca por fin pasa de los 80 kg 🎉',
      payload: {
        title: 'Empuje — sesión de hoy',
        lines: [
          'Press de banca — 5×5 · 82,5 kg (¡PR!)',
          'Press militar — 4×8 · 40 kg',
          'Fondos en paralelas — 3×10',
          'Elevaciones laterales — 3×15 · 10 kg',
        ],
      },
      likes: 8,
      likedByMe: false,
      comments: [
        {
          id: 'demo-c3',
          author: 'Marta R.',
          text: 'Enhorabuena por el PR, a por los 90 💪',
          createdAt: hoursAgo(3),
        },
      ],
      isDemo: true,
    },
  ];

  await db.posts.bulkAdd(demoPosts);
}

export const socialRepo: SocialRepository = new LocalSocialRepository();
