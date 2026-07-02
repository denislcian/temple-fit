-- Migración: cuota diaria del consejo del coach redactado por IA.
-- La consume SOLO la Edge Function coach-advice (con service role):
-- RLS activado sin políticas = ningún cliente puede leer ni escribir.
--
-- Ejecutar en el SQL Editor de Supabase (o supabase db push).

create table if not exists public.coach_ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (current_date),
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.coach_ai_usage enable row level security;
-- Sin políticas a propósito: solo el service role (Edge Function) accede.

-- Incrementa y devuelve el contador del día para un usuario (atómico).
create or replace function public.coach_ai_increment(p_user_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.coach_ai_usage as u (user_id, day, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, day)
  do update set count = u.count + 1
  returning count;
$$;

-- Solo la service role puede ejecutarla (la Edge Function).
revoke all on function public.coach_ai_increment(uuid) from public, anon, authenticated;

-- Limpieza opcional de días viejos (ejecutar de vez en cuando o con pg_cron):
--   delete from public.coach_ai_usage where day < current_date - interval '30 days';
