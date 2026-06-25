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
