-- ============================================================================
-- Temple · Esquema de la Comunidad en Supabase (Postgres + RLS)
-- Pégalo entero en: Supabase → SQL Editor → New query → Run.
-- La autorización la impone Postgres con Row Level Security; el cliente no
-- decide qué puede ver. Por defecto, sin política que lo permita: DENEGAR.
-- ============================================================================

-- ── Perfiles (1:1 con auth.users) ──────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  private_profile boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Publicaciones ──────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  text text not null default '',
  kind text not null default 'texto'
    check (kind in ('texto','rutina','sesion','receta','foto','sueno','meditacion')),
  visibility text not null default 'publica'
    check (visibility in ('publica','seguidores','privada')),
  payload jsonb,
  -- Ruta del objeto en Storage (bucket "fotos"); la URL se firma/transforma en cliente.
  image_path text
);
create index if not exists posts_created_idx on public.posts (created_at desc);

-- ── Seguidores ─────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower uuid not null references auth.users on delete cascade,
  followee uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee)
);

-- ── Me gusta (una fila por usuario y post) ─────────────────────────────────
create table if not exists public.post_likes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── Comentarios ────────────────────────────────────────────────────────────
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  author uuid not null references auth.users on delete cascade,
  author_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.post_comments (post_id);

-- ── Crear el perfil automáticamente al registrarse ─────────────────────────
-- Se ejecuta en el servidor al insertarse el usuario en auth.users, así el
-- perfil existe aunque la cuenta aún no haya confirmado el email (no hay sesión
-- de cliente todavía). El username/nombre llegan en el metadata del signUp.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  uname text;
begin
  -- username: el del registro por email; en OAuth (Google) se deriva del email.
  base_username := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  uname := base_username;
  if exists (select 1 from public.profiles where username = uname) then
    uname := base_username || '_' || substr(new.id::text, 1, 4);
  end if;
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    uname,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name', -- Google
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Funciones de ayuda (SECURITY DEFINER para evitar recursión de RLS) ──────
create or replace function public.is_following(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.follows where follower = auth.uid() and followee = target);
$$;

create or replace function public.can_see_post(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts po
    where po.id = p
      and (
        po.author = auth.uid()
        or po.visibility = 'publica'
        or (po.visibility = 'seguidores' and public.is_following(po.author))
      )
  );
$$;

-- ── Activar RLS ─────────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.posts         enable row level security;
alter table public.follows       enable row level security;
alter table public.post_likes    enable row level security;
alter table public.post_comments enable row level security;

-- ── Políticas: profiles ─────────────────────────────────────────────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete using (id = auth.uid());

-- ── Políticas: posts (la privacidad por publicación vive aquí) ──────────────
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select using (
  author = auth.uid()
  or visibility = 'publica'
  or (visibility = 'seguidores' and public.is_following(author))
);
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert with check (author = auth.uid());
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update using (author = auth.uid()) with check (author = auth.uid());
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete using (author = auth.uid());

-- ── Políticas: follows ──────────────────────────────────────────────────────
drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows for select using (true);
drop policy if exists follows_insert on public.follows;
create policy follows_insert on public.follows for insert with check (follower = auth.uid());
drop policy if exists follows_delete on public.follows;
create policy follows_delete on public.follows for delete using (follower = auth.uid());

-- ── Políticas: post_likes (solo de posts que puedo ver) ─────────────────────
drop policy if exists likes_select on public.post_likes;
create policy likes_select on public.post_likes for select using (public.can_see_post(post_id));
drop policy if exists likes_insert on public.post_likes;
create policy likes_insert on public.post_likes for insert with check (user_id = auth.uid() and public.can_see_post(post_id));
drop policy if exists likes_delete on public.post_likes;
create policy likes_delete on public.post_likes for delete using (user_id = auth.uid());

-- ── Políticas: post_comments (leer/insertar en posts visibles) ──────────────
drop policy if exists comments_select on public.post_comments;
create policy comments_select on public.post_comments for select using (public.can_see_post(post_id));
drop policy if exists comments_insert on public.post_comments;
create policy comments_insert on public.post_comments for insert with check (author = auth.uid() and public.can_see_post(post_id));
drop policy if exists comments_delete on public.post_comments;
create policy comments_delete on public.post_comments for delete using (author = auth.uid());

-- ── Storage: bucket de fotos (privado; se accede por URL firmada) ───────────
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

-- Subir solo en tu propia carpeta (prefijo = tu uid); leer cualquiera autenticado.
drop policy if exists fotos_insert on storage.objects;
create policy fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_select on storage.objects;
create policy fotos_select on storage.objects for select to authenticated
  using (bucket_id = 'fotos');
drop policy if exists fotos_delete on storage.objects;
create policy fotos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Retos de la comunidad (opt-in) ─────────────────────────────────────────
-- El progreso lo calcula el cliente con las sesiones locales; aquí solo vive el
-- número de quien se apunta. (También en supabase/migration-retos.sql.)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  goal_days int not null check (goal_days between 1 and 31),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  creator uuid not null references auth.users on delete cascade,
  creator_name text not null,
  created_at timestamptz not null default now()
);
create index if not exists challenges_ends_idx on public.challenges (ends_at desc);

create table if not exists public.challenge_members (
  challenge_id uuid not null references public.challenges on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  progress int not null default 0 check (progress >= 0),
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table public.challenges        enable row level security;
alter table public.challenge_members enable row level security;

drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges for select using (true);
drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges for insert with check (creator = auth.uid());
drop policy if exists challenges_update on public.challenges;
create policy challenges_update on public.challenges for update using (creator = auth.uid()) with check (creator = auth.uid());
drop policy if exists challenges_delete on public.challenges;
create policy challenges_delete on public.challenges for delete using (creator = auth.uid());

drop policy if exists members_select on public.challenge_members;
create policy members_select on public.challenge_members for select using (true);
drop policy if exists members_insert on public.challenge_members;
create policy members_insert on public.challenge_members for insert with check (user_id = auth.uid());
drop policy if exists members_update on public.challenge_members;
create policy members_update on public.challenge_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists members_delete on public.challenge_members;
create policy members_delete on public.challenge_members for delete using (user_id = auth.uid());

-- ── Datos por cuenta (sync multi-dispositivo, privado) ──────────────────────
-- También en supabase/migration-sync.sql.
create table if not exists public.user_data (
  user_id uuid not null references auth.users on delete cascade,
  kind text not null,
  item_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);
create index if not exists user_data_user_kind_idx on public.user_data (user_id, kind);
alter table public.user_data enable row level security;
drop policy if exists user_data_all on public.user_data;
create policy user_data_all on public.user_data for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Stats públicas del perfil ───────────────────────────────────────────────
-- También en supabase/migration-perfiles.sql.
create table if not exists public.profile_stats (
  user_id uuid primary key references auth.users on delete cascade,
  sessions int not null default 0,
  volume_kg bigint not null default 0,
  streak_weeks int not null default 0,
  best_lifts jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.profile_stats enable row level security;
drop policy if exists profile_stats_select on public.profile_stats;
create policy profile_stats_select on public.profile_stats for select using (true);
drop policy if exists profile_stats_insert on public.profile_stats;
create policy profile_stats_insert on public.profile_stats for insert with check (user_id = auth.uid());
drop policy if exists profile_stats_update on public.profile_stats;
create policy profile_stats_update on public.profile_stats for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Notificaciones (te siguen / like / comentario) ──────────────────────────
-- También en supabase/migration-notificaciones.sql.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  actor uuid not null references auth.users on delete cascade,
  actor_name text not null,
  kind text not null check (kind in ('follow','like','comment')),
  post_id uuid references public.posts on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select using (user_id = auth.uid());
drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications for insert with check (actor = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notif_delete on public.notifications;
create policy notif_delete on public.notifications for delete using (user_id = auth.uid());
