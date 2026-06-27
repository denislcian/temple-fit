-- ============================================================================
-- Temple · Migración: sincronización de datos por cuenta (multi-dispositivo)
-- Pégalo en: Supabase → SQL Editor → New query → Run.
-- Una sola tabla genérica guarda TODOS los datos del usuario (entrenos, rutinas,
-- medidas, agua, diario…) como jsonb, identificados por (user_id, kind, item_id).
-- Es PRIVADA: cada cuenta solo ve y edita lo suyo (RLS). Idempotente.
-- ============================================================================

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

-- Datos personales: solo el dueño los ve y los edita.
drop policy if exists user_data_all on public.user_data;
create policy user_data_all on public.user_data for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
