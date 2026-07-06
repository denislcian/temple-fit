-- ============================================================================
-- Migración · Mejores amigos + visibilidad 'mejores'
-- Pégalo entero en: Supabase → SQL Editor → New query → Run.
--
-- Lista PRIVADA de mejores amigos (tabla propia, no una columna en follows:
-- el grafo de seguidores es público y las marcas no deben serlo) y una nueva
-- visibilidad de publicaciones 'mejores' que Postgres impone con RLS.
-- ============================================================================

-- ── Tabla: close_friends (owner marcó a friend) ─────────────────────────────
create table if not exists public.close_friends (
  owner uuid not null references auth.users on delete cascade,
  friend uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner, friend),
  check (owner <> friend)
);
create index if not exists close_friends_friend_idx on public.close_friends (friend);

alter table public.close_friends enable row level security;

-- Leer: solo el dueño de la lista y la persona marcada (que necesita saberlo
-- para que su cliente muestre las publicaciones 'mejores' de ese autor).
drop policy if exists close_friends_select on public.close_friends;
create policy close_friends_select on public.close_friends for select
  using (owner = auth.uid() or friend = auth.uid());
-- Insertar: solo el dueño de la lista. Borrar: el dueño o la persona marcada
-- (derecho a salir de la lista de otro; también lo usa el borrado de cuenta).
-- No hay política UPDATE a propósito: una marca se crea o se borra, no se edita.
drop policy if exists close_friends_insert on public.close_friends;
create policy close_friends_insert on public.close_friends for insert
  with check (owner = auth.uid());
drop policy if exists close_friends_delete on public.close_friends;
create policy close_friends_delete on public.close_friends for delete
  using (owner = auth.uid() or friend = auth.uid());

-- ── Visibilidad nueva en posts ──────────────────────────────────────────────
alter table public.posts drop constraint if exists posts_visibility_check;
alter table public.posts add constraint posts_visibility_check
  check (visibility in ('publica','seguidores','mejores','privada'));

-- ── Funciones de ayuda (SECURITY DEFINER para evitar recursión de RLS) ──────
create or replace function public.is_close_friend_of(author uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.close_friends where owner = author and friend = auth.uid()
  );
$$;

-- can_see_post gana el caso 'mejores' (post_likes y post_comments lo heredan).
create or replace function public.can_see_post(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts po
    where po.id = p
      and (
        po.author = auth.uid()
        or po.visibility = 'publica'
        or (po.visibility = 'seguidores' and public.is_following(po.author))
        or (po.visibility = 'mejores' and public.is_close_friend_of(po.author))
      )
  );
$$;

-- ── Política de lectura de posts con el caso nuevo ──────────────────────────
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select using (
  author = auth.uid()
  or visibility = 'publica'
  or (visibility = 'seguidores' and public.is_following(author))
  or (visibility = 'mejores' and public.is_close_friend_of(author))
);
