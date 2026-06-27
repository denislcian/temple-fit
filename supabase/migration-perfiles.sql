-- ============================================================================
-- Temple · Migración: stats públicas del perfil
-- Pégalo en: Supabase → SQL Editor → New query → Run.
-- Resumen agregado (no las sesiones crudas) que tu perfil muestra a los demás.
-- Lectura pública; cada cuenta solo escribe la suya. Idempotente.
-- ============================================================================

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
