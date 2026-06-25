-- ============================================================================
-- Temple · Migración: retos de la comunidad (opt-in)
-- Pégalo en: Supabase → SQL Editor → New query → Run.
-- Crea las tablas de retos y participantes con RLS. Idempotente.
-- El progreso lo calcula el cliente con las sesiones LOCALES; aquí solo vive el
-- número resultante de quien decide apuntarse.
-- ============================================================================

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

-- Retos: cualquiera autenticado los ve; solo el creador crea/edita/borra.
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges for select using (true);
drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges for insert with check (creator = auth.uid());
drop policy if exists challenges_update on public.challenges;
create policy challenges_update on public.challenges for update using (creator = auth.uid()) with check (creator = auth.uid());
drop policy if exists challenges_delete on public.challenges;
create policy challenges_delete on public.challenges for delete using (creator = auth.uid());

-- Participantes: todos ven la tabla; cada uno gestiona SOLO su propia fila.
drop policy if exists members_select on public.challenge_members;
create policy members_select on public.challenge_members for select using (true);
drop policy if exists members_insert on public.challenge_members;
create policy members_insert on public.challenge_members for insert with check (user_id = auth.uid());
drop policy if exists members_update on public.challenge_members;
create policy members_update on public.challenge_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists members_delete on public.challenge_members;
create policy members_delete on public.challenge_members for delete using (user_id = auth.uid());
