-- ============================================================================
-- Temple · Migración: tiempo real (feed + notificaciones en vivo)
-- Supabase → SQL Editor → New query → Run. Idempotente.
-- Añade las tablas a la publicación de Realtime (Postgres replication). El RLS
-- sigue aplicándose: cada cliente solo recibe los eventos de filas que puede ver.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
