-- ============================================================================
-- Temple · SETUP COMPLETO de la red social (pegar TODO de una vez)
-- Supabase → SQL Editor → New query → pega esto entero → Run.
-- Reúne las 4 migraciones: recuperación, sync multi-dispositivo, stats de
-- perfil y retos. Es idempotente y no toca datos existentes. Requiere que el
-- esquema base (schema.sql: profiles, posts, follows…) ya esté aplicado.
-- ============================================================================

-- 1) Posts de recuperación (sueño + meditación) ─────────────────────────────
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts
  add constraint posts_kind_check
  check (kind in ('texto','rutina','sesion','receta','foto','sueno','meditacion'));

-- 2) Sincronización de datos por cuenta (multi-dispositivo, privado) ─────────
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

-- 3) Stats públicas del perfil ──────────────────────────────────────────────
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

-- 4) Retos de la comunidad (opt-in) ─────────────────────────────────────────
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

-- 5) Notificaciones ─────────────────────────────────────────────────────────
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
