// CAPA 1 · Datos — Repositorio de la comunidad (modo local).
//
// El feed, el grafo de seguidores y las cuentas de ejemplo viven en IndexedDB
// de este dispositivo. La interfaz SocialRepository es el contrato para la
// fase nube: una implementación con Supabase (Postgres + RLS + Realtime)
// sustituirá a esta sin tocar la UI. La privacidad se aplica aquí en el
// cliente por conveniencia; en producción la fuerzan las políticas RLS.
import { visiblePosts } from '../../domain/feed';
import { computeProfileStats, EMPTY_STATS, type PublicStats } from '../../domain/profileStats';
import type { Account } from '../authModels';
import { db } from '../db';
import { newId } from '../models';
import type { Post, Visibility } from '../nutritionModels';
import { getAllSessions } from './sessionRepo';

/** Datos de un perfil que se muestran al visitarlo. */
export interface ProfileData {
  id: string;
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  followers: number;
  following: number;
  isFollowing: boolean;
  isMe: boolean;
  stats: PublicStats;
}

export interface NewPost {
  author: string;
  authorId?: string;
  text: string;
  kind: Post['kind'];
  visibility?: Visibility;
  payload?: { title: string; lines: string[] };
  image?: string;
}

export interface SocialRepository {
  getFeed(): Promise<Post[]>;
  publish(input: NewPost): Promise<Post>;
  toggleLike(postId: string): Promise<Post | undefined>;
  addComment(postId: string, author: string, text: string): Promise<void>;
  removeOwnPost(postId: string, authorId: string): Promise<void>;
  // Grafo social
  getFollowing(followerId: string): Promise<string[]>;
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
  follow(followerId: string, followeeId: string): Promise<void>;
  unfollow(followerId: string, followeeId: string): Promise<void>;
  countFollowers(accountId: string): Promise<number>;
  /** Cuentas que siguen a userId. */
  getFollowers(userId: string): Promise<Account[]>;
  /** Cuentas a las que userId sigue. */
  getFollowingAccounts(userId: string): Promise<Account[]>;
  /** Otras cuentas a las que seguir (excluye al propio viewer). */
  discoverAccounts(viewerId: string): Promise<Account[]>;
  /** Busca personas por nombre o @usuario (excluye al viewer). */
  searchAccounts(query: string, viewerId: string): Promise<Account[]>;
  // Perfiles
  getProfile(userId: string, viewerId: string): Promise<ProfileData | null>;
  getUserPosts(userId: string, viewerId: string): Promise<Post[]>;
  /** Publica TU resumen de stats (agregado) para que tu perfil lo muestre. */
  publishStats(userId: string, stats: PublicStats): Promise<void>;
  /** Tiempo real: avisa cuando cambia el feed. Devuelve una función para cancelar.
   *  Opcional (solo en la nube); en local no existe. */
  subscribeFeed?(onChange: () => void): () => void;
}

// Stats publicadas en modo local (en la nube van a la tabla profile_stats).
const STATS_KEY = 'forjafit-profile-stats';
function loadStatsMap(): Record<string, PublicStats> {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? '{}') as Record<string, PublicStats>;
  } catch {
    return {};
  }
}
function saveStatsMap(m: Record<string, PublicStats>): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(m));
}
const DEMO_STATS: Record<string, PublicStats> = {
  'demo-acc-marta': {
    sessions: 42,
    volumeKg: 128000,
    streakWeeks: 6,
    bestLifts: [
      { exerciseId: 'sentadilla', est1RM: 95 },
      { exerciseId: 'peso-muerto', est1RM: 120 },
      { exerciseId: 'hip-thrust', est1RM: 140 },
    ],
  },
  'demo-acc-alex': {
    sessions: 58,
    volumeKg: 164000,
    streakWeeks: 9,
    bestLifts: [
      { exerciseId: 'press-banca', est1RM: 102 },
      { exerciseId: 'sentadilla', est1RM: 130 },
      { exerciseId: 'press-militar', est1RM: 62 },
    ],
  },
};

class LocalSocialRepository implements SocialRepository {
  async getFeed(): Promise<Post[]> {
    await ensureSeeded();
    return this.withAvatars(await db.posts.orderBy('createdAt').reverse().toArray());
  }

  async publish(input: NewPost): Promise<Post> {
    const post: Post = {
      id: newId(),
      author: input.author,
      ...(input.authorId ? { authorId: input.authorId } : {}),
      createdAt: new Date().toISOString(),
      text: input.text,
      kind: input.kind,
      visibility: input.visibility ?? 'publica',
      ...(input.payload ? { payload: input.payload } : {}),
      ...(input.image ? { image: input.image } : {}),
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

  async removeOwnPost(postId: string, authorId: string): Promise<void> {
    const post = await db.posts.get(postId);
    if (!post) return;
    if (post.isDemo || post.authorId !== authorId) {
      throw new Error('Solo puedes eliminar tus propias publicaciones');
    }
    await db.posts.delete(postId);
  }

  async getFollowing(followerId: string): Promise<string[]> {
    const rows = await db.follows.where('followerId').equals(followerId).toArray();
    return rows.map((f) => f.followeeId);
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const row = await db.follows
      .where('[followerId+followeeId]')
      .equals([followerId, followeeId])
      .first();
    return row !== undefined;
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) return;
    if (await this.isFollowing(followerId, followeeId)) return;
    await db.follows.add({
      id: newId(),
      followerId,
      followeeId,
      createdAt: new Date().toISOString(),
    });
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    const row = await db.follows
      .where('[followerId+followeeId]')
      .equals([followerId, followeeId])
      .first();
    if (row) await db.follows.delete(row.id);
  }

  async countFollowers(accountId: string): Promise<number> {
    return db.follows.where('followeeId').equals(accountId).count();
  }

  async getFollowers(userId: string): Promise<Account[]> {
    await ensureSeeded();
    const rows = await db.follows.where('followeeId').equals(userId).toArray();
    const accs = await db.accounts.bulkGet(rows.map((f) => f.followerId));
    return accs.filter((a): a is Account => !!a);
  }

  async getFollowingAccounts(userId: string): Promise<Account[]> {
    await ensureSeeded();
    const rows = await db.follows.where('followerId').equals(userId).toArray();
    const accs = await db.accounts.bulkGet(rows.map((f) => f.followeeId));
    return accs.filter((a): a is Account => !!a);
  }

  async discoverAccounts(viewerId: string): Promise<Account[]> {
    await ensureSeeded();
    const all = await db.accounts.toArray();
    return all.filter((a) => a.id !== viewerId);
  }

  async searchAccounts(query: string, viewerId: string): Promise<Account[]> {
    await ensureSeeded();
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const all = await db.accounts.toArray();
    return all
      .filter(
        (a) =>
          a.id !== viewerId &&
          (a.displayName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }

  private async statsFor(userId: string, viewerId: string): Promise<PublicStats> {
    // Las mías se calculan en vivo de mis sesiones locales; las de otros vienen
    // de lo que publicaron (o un demo en modo local).
    if (userId === viewerId) {
      return computeProfileStats(await getAllSessions(), new Date().toISOString().slice(0, 10));
    }
    return loadStatsMap()[userId] ?? DEMO_STATS[userId] ?? EMPTY_STATS;
  }

  async getProfile(userId: string, viewerId: string): Promise<ProfileData | null> {
    await ensureSeeded();
    const acc = await db.accounts.get(userId);
    if (!acc) return null;
    const [followers, following, isFollowing, stats] = await Promise.all([
      this.countFollowers(userId),
      db.follows.where('followerId').equals(userId).count(),
      this.isFollowing(viewerId, userId),
      this.statsFor(userId, viewerId),
    ]);
    return {
      id: acc.id,
      displayName: acc.displayName,
      username: acc.username,
      ...(acc.bio ? { bio: acc.bio } : {}),
      ...(acc.avatarUrl ? { avatarUrl: acc.avatarUrl } : {}),
      ...(acc.location ? { location: acc.location } : {}),
      followers,
      following,
      isFollowing,
      isMe: userId === viewerId,
      stats,
    };
  }

  /** Añade la foto del autor (authorAvatar) a cada publicación. */
  private async withAvatars(posts: Post[]): Promise<Post[]> {
    const ids = [...new Set(posts.map((p) => p.authorId).filter((x): x is string => !!x))];
    if (ids.length === 0) return posts;
    const accs = await db.accounts.bulkGet(ids);
    const avatar = new Map<string, string>();
    for (const a of accs) if (a?.avatarUrl) avatar.set(a.id, a.avatarUrl);
    return posts.map((p) =>
      p.authorId && avatar.has(p.authorId) ? { ...p, authorAvatar: avatar.get(p.authorId) } : p,
    );
  }

  async getUserPosts(userId: string, viewerId: string): Promise<Post[]> {
    await ensureSeeded();
    const following = new Set(await this.getFollowing(viewerId));
    const all = await db.posts.where('authorId').equals(userId).toArray();
    const visible = visiblePosts(all, viewerId, following).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return this.withAvatars(visible);
  }

  async publishStats(userId: string, stats: PublicStats): Promise<void> {
    const m = loadStatsMap();
    m[userId] = stats;
    saveStatsMap(m);
  }
}

/** Cuentas y publicaciones de ejemplo del modo local (marcadas isDemo).
 *  Idempotente (bulkPut): tolera llamadas concurrentes (StrictMode /
 *  getFeed+getProfile a la vez) sin chocar por claves duplicadas. */
async function ensureSeeded(): Promise<void> {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const demoAccount = (id: string, username: string, displayName: string, bio: string): Account => ({
    id,
    username,
    displayName,
    bio,
    passwordHash: '',
    passwordSalt: '',
    createdAt: hoursAgo(800),
  });

  // Cuentas de ejemplo (seguibles; no se puede iniciar sesión como ellas).
  // Se siembran según su propia presencia, no según si la tabla está vacía:
  // así aparecen aunque el usuario ya se haya registrado antes de abrir el feed.
  const accounts: Account[] = [
    demoAccount('demo-acc-marta', 'marta_r', 'Marta R.', 'Fuerza y paciencia. Pierna los lunes.'),
    demoAccount('demo-acc-alex', 'alex_g', 'Álex G.', 'Empuje, tirón, pierna. A por los 100 en banca.'),
  ];
  const haveDemo = await db.accounts
    .where('id')
    .anyOf(accounts.map((a) => a.id))
    .count();
  if (haveDemo < accounts.length) await db.accounts.bulkPut(accounts);

  if ((await db.posts.count()) > 0) return;

  const demoPosts: Post[] = [
    {
      id: 'demo-bienvenida',
      author: 'Equipo Temple',
      createdAt: hoursAgo(50),
      kind: 'texto',
      visibility: 'publica',
      text: 'Bienvenido a la comunidad 👋 Crea tu cuenta para publicar tus entrenamientos, seguir a otras personas y elegir quién ve cada publicación (pública, solo seguidores o privada). En este modo local todo vive en tu dispositivo; la versión en la nube lo hará compartido de verdad.',
      likes: 21,
      likedByMe: false,
      comments: [],
      isDemo: true,
    },
    {
      id: 'demo-marta',
      author: 'Marta R.',
      authorId: 'demo-acc-marta',
      createdAt: hoursAgo(26),
      kind: 'rutina',
      visibility: 'publica',
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
        { id: 'demo-c1', author: 'Álex G.', text: '¡Ese hip thrust ya pesa más que el mío! 🔥', createdAt: hoursAgo(24) },
        { id: 'demo-c2', author: 'Lucía M.', text: 'Apuntada para el lunes que viene, gracias por compartirla.', createdAt: hoursAgo(20) },
      ],
      isDemo: true,
    },
    {
      id: 'demo-alex',
      author: 'Álex G.',
      authorId: 'demo-acc-alex',
      createdAt: hoursAgo(5),
      kind: 'sesion',
      visibility: 'publica',
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
        { id: 'demo-c3', author: 'Marta R.', text: 'Enhorabuena por el PR, a por los 90 💪', createdAt: hoursAgo(3) },
      ],
      isDemo: true,
    },
  ];

  await db.posts.bulkPut(demoPosts);
}

import { isSupabaseEnabled, supabase } from '../supabase';
import { SupabaseSocialRepository } from './supabaseSocialRepo';

// En la nube (credenciales presentes) usa Supabase; si no, el feed local.
export const socialRepo: SocialRepository =
  isSupabaseEnabled && supabase
    ? new SupabaseSocialRepository(supabase)
    : new LocalSocialRepository();
