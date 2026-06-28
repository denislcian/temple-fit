// CAPA 1 · Datos — Comunidad sobre Supabase (Postgres + RLS + Storage).
// Implementa el MISMO contrato SocialRepository que la versión local: la UI no
// cambia. La privacidad la impone Postgres (RLS), no este cliente.
import type { SupabaseClient } from '@supabase/supabase-js';
import { EMPTY_STATS, type BestLift, type PublicStats } from '../../domain/profileStats';
import type { Account } from '../authModels';
import type { Post } from '../nutritionModels';
import type { NewPost, ProfileData, SocialRepository } from './socialRepo';

const BUCKET = 'fotos';
const POST_COLS = 'id, author, created_at, text, kind, visibility, payload, image_path';
// '*' para no depender de que la migración de perfil social (avatar/ubicación)
// esté aplicada: trae las columnas que existan; rowToAccount toma lo que haya.
const ACCOUNT_COLS = '*';

interface PostRow {
  id: string;
  author: string;
  created_at: string;
  text: string;
  kind: Post['kind'];
  visibility: Post['visibility'];
  payload: { title: string; lines: string[] } | null;
  image_path: string | null;
}

interface AccountRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  private_profile: boolean;
  created_at: string;
  avatar_url: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
}

function rowToAccount(p: AccountRow): Account {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    ...(p.bio ? { bio: p.bio } : {}),
    passwordHash: '',
    passwordSalt: '',
    createdAt: p.created_at,
    privateProfile: p.private_profile,
    ...(p.avatar_url ? { avatarUrl: p.avatar_url } : {}),
    ...(p.location ? { location: p.location } : {}),
    ...(p.lat != null ? { lat: p.lat } : {}),
    ...(p.lng != null ? { lng: p.lng } : {}),
  };
}

/** dataURL (base64) → Blob, para subir a Storage. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(head ?? '')?.[1] ?? 'image/jpeg';
  const bin = atob(body ?? '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export class SupabaseSocialRepository implements SocialRepository {
  constructor(private sb: SupabaseClient) {}

  private async uid(): Promise<string | null> {
    const { data } = await this.sb.auth.getUser();
    return data.user?.id ?? null;
  }

  async getFeed(): Promise<Post[]> {
    const { data, error } = await this.sb
      .from('posts')
      .select(POST_COLS)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return this.enrich(data as PostRow[]);
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const { data, error } = await this.sb
      .from('posts')
      .select(POST_COLS)
      .eq('author', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return this.enrich(data as PostRow[]);
  }

  /** Enriquece filas de posts con nombre de autor, likes y comentarios. */
  private async enrich(rows: PostRow[]): Promise<Post[]> {
    if (rows.length === 0) return [];
    const me = await this.uid();
    const ids = rows.map((p) => p.id);
    const authors = [...new Set(rows.map((p) => p.author))];

    const [profilesRes, likesRes, commentsRes] = await Promise.all([
      this.sb.from('profiles').select('*').in('id', authors),
      this.sb.from('post_likes').select('post_id, user_id').in('post_id', ids),
      this.sb
        .from('post_comments')
        .select('id, post_id, author_name, text, created_at')
        .in('post_id', ids)
        .order('created_at', { ascending: true }),
    ]);

    const profiles =
      (profilesRes.data as { id: string; display_name: string; avatar_url: string | null }[] | null) ??
      [];
    const nameById = new Map(profiles.map((p) => [p.id, p.display_name]));
    const avatarById = new Map(profiles.filter((p) => p.avatar_url).map((p) => [p.id, p.avatar_url!]));
    const likes = (likesRes.data as { post_id: string; user_id: string }[] | null) ?? [];
    const comments =
      (commentsRes.data as
        | { id: string; post_id: string; author_name: string; text: string; created_at: string }[]
        | null) ?? [];

    return rows.map((p) => {
      const postLikes = likes.filter((l) => l.post_id === p.id);
      return {
        id: p.id,
        author: nameById.get(p.author) ?? 'Atleta',
        authorId: p.author,
        ...(avatarById.get(p.author) ? { authorAvatar: avatarById.get(p.author) } : {}),
        createdAt: p.created_at,
        text: p.text,
        kind: p.kind,
        visibility: p.visibility,
        ...(p.payload ? { payload: p.payload } : {}),
        ...(p.image_path
          ? { image: this.sb.storage.from(BUCKET).getPublicUrl(p.image_path).data.publicUrl }
          : {}),
        likes: postLikes.length,
        likedByMe: me ? postLikes.some((l) => l.user_id === me) : false,
        comments: comments
          .filter((c) => c.post_id === p.id)
          .map((c) => ({ id: c.id, author: c.author_name, text: c.text, createdAt: c.created_at })),
      };
    });
  }

  async publish(input: NewPost): Promise<Post> {
    const me = await this.uid();
    if (!me) throw new Error('Inicia sesión para publicar');

    let imagePath: string | undefined;
    if (input.image) {
      const blob = dataUrlToBlob(input.image);
      imagePath = `${me}/${crypto.randomUUID()}.jpg`;
      const up = await this.sb.storage.from(BUCKET).upload(imagePath, blob, {
        contentType: blob.type,
        upsert: false,
      });
      if (up.error) throw new Error('No se pudo subir la foto');
    }

    const { data, error } = await this.sb
      .from('posts')
      .insert({
        author: me,
        text: input.text,
        kind: input.kind,
        visibility: input.visibility ?? 'publica',
        payload: input.payload ?? null,
        image_path: imagePath ?? null,
      })
      .select('id, author, created_at, text, kind, visibility, payload, image_path')
      .single();
    if (error || !data) throw new Error('No se pudo publicar');
    const p = data as PostRow;
    return {
      id: p.id,
      author: input.author,
      authorId: p.author,
      createdAt: p.created_at,
      text: p.text,
      kind: p.kind,
      visibility: p.visibility,
      ...(p.payload ? { payload: p.payload } : {}),
      ...(imagePath
        ? { image: this.sb.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl }
        : {}),
      likes: 0,
      likedByMe: false,
      comments: [],
    };
  }

  async toggleLike(postId: string): Promise<Post | undefined> {
    const me = await this.uid();
    if (!me) return undefined;
    const { data: existing } = await this.sb
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', me)
      .maybeSingle();
    if (existing) {
      await this.sb.from('post_likes').delete().eq('post_id', postId).eq('user_id', me);
    } else {
      await this.sb.from('post_likes').insert({ post_id: postId, user_id: me });
    }
    const { count } = await this.sb
      .from('post_likes')
      .select('post_id', { count: 'exact', head: true })
      .eq('post_id', postId);
    // El feed se recarga tras esto; devolvemos lo mínimo para el anuncio.
    return { likedByMe: !existing, likes: count ?? 0 } as unknown as Post;
  }

  async addComment(postId: string, author: string, text: string): Promise<void> {
    const me = await this.uid();
    if (!me) return;
    await this.sb
      .from('post_comments')
      .insert({ post_id: postId, author: me, author_name: author, text });
  }

  async removeOwnPost(postId: string): Promise<void> {
    const { data } = await this.sb.from('posts').select('image_path').eq('id', postId).maybeSingle();
    const path = (data as { image_path: string | null } | null)?.image_path;
    if (path) await this.sb.storage.from(BUCKET).remove([path]);
    await this.sb.from('posts').delete().eq('id', postId);
  }

  async getFollowing(followerId: string): Promise<string[]> {
    const { data } = await this.sb.from('follows').select('followee').eq('follower', followerId);
    return ((data as { followee: string }[] | null) ?? []).map((f) => f.followee);
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const { data } = await this.sb
      .from('follows')
      .select('follower')
      .eq('follower', followerId)
      .eq('followee', followeeId)
      .maybeSingle();
    return data !== null;
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) return;
    await this.sb.from('follows').insert({ follower: followerId, followee: followeeId });
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    await this.sb.from('follows').delete().eq('follower', followerId).eq('followee', followeeId);
  }

  async countFollowers(accountId: string): Promise<number> {
    const { count } = await this.sb
      .from('follows')
      .select('followee', { count: 'exact', head: true })
      .eq('followee', accountId);
    return count ?? 0;
  }

  async discoverAccounts(viewerId: string): Promise<Account[]> {
    const { data } = await this.sb.from('profiles').select(ACCOUNT_COLS).neq('id', viewerId).limit(20);
    return ((data as AccountRow[] | null) ?? []).map(rowToAccount);
  }

  async searchAccounts(query: string, viewerId: string): Promise<Account[]> {
    // Se limpian caracteres que romperían el filtro .or de PostgREST.
    const q = query.trim().replace(/[,%()*]/g, '');
    if (!q) return [];
    const { data } = await this.sb
      .from('profiles')
      .select(ACCOUNT_COLS)
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq('id', viewerId)
      .limit(20);
    return ((data as AccountRow[] | null) ?? []).map(rowToAccount);
  }

  /** Cuentas (perfiles) a partir de una lista de ids, preservando el orden. */
  private async accountsByIds(ids: string[]): Promise<Account[]> {
    if (ids.length === 0) return [];
    const { data } = await this.sb.from('profiles').select(ACCOUNT_COLS).in('id', ids);
    const byId = new Map(((data as AccountRow[] | null) ?? []).map((r) => [r.id, rowToAccount(r)]));
    return ids.map((id) => byId.get(id)).filter((a): a is Account => !!a);
  }

  async getFollowers(userId: string): Promise<Account[]> {
    const { data } = await this.sb.from('follows').select('follower').eq('followee', userId).limit(200);
    return this.accountsByIds(((data as { follower: string }[] | null) ?? []).map((f) => f.follower));
  }

  async getFollowingAccounts(userId: string): Promise<Account[]> {
    const { data } = await this.sb.from('follows').select('followee').eq('follower', userId).limit(200);
    return this.accountsByIds(((data as { followee: string }[] | null) ?? []).map((f) => f.followee));
  }

  async getProfile(userId: string, viewerId: string): Promise<ProfileData | null> {
    const [profRes, followers, followingRes, isFollowing, statsRes, me] = await Promise.all([
      this.sb.from('profiles').select('*').eq('id', userId).maybeSingle(),
      this.countFollowers(userId),
      this.sb.from('follows').select('follower', { count: 'exact', head: true }).eq('follower', userId),
      this.isFollowing(viewerId, userId),
      this.sb
        .from('profile_stats')
        .select('sessions, volume_kg, streak_weeks, best_lifts')
        .eq('user_id', userId)
        .maybeSingle(),
      this.uid(),
    ]);
    const p = profRes.data as
      | {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
        }
      | null;
    if (!p) return null;
    const s = statsRes.data as
      | { sessions: number; volume_kg: number; streak_weeks: number; best_lifts: BestLift[] | null }
      | null;
    return {
      id: p.id,
      displayName: p.display_name,
      username: p.username,
      ...(p.bio ? { bio: p.bio } : {}),
      ...(p.avatar_url ? { avatarUrl: p.avatar_url } : {}),
      ...(p.location ? { location: p.location } : {}),
      followers,
      following: followingRes.count ?? 0,
      isFollowing,
      isMe: me === userId,
      stats: s
        ? {
            sessions: s.sessions,
            volumeKg: s.volume_kg,
            streakWeeks: s.streak_weeks,
            bestLifts: s.best_lifts ?? [],
          }
        : EMPTY_STATS,
    };
  }

  subscribeFeed(onChange: () => void): () => void {
    const channel = this.sb
      .channel('feed-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => onChange())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, () => onChange())
      .subscribe();
    return () => {
      void this.sb.removeChannel(channel);
    };
  }

  async publishStats(_userId: string, stats: PublicStats): Promise<void> {
    const me = await this.uid();
    if (!me) return;
    await this.sb.from('profile_stats').upsert(
      {
        user_id: me,
        sessions: stats.sessions,
        volume_kg: stats.volumeKg,
        streak_weeks: stats.streakWeeks,
        best_lifts: stats.bestLifts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  }
}
