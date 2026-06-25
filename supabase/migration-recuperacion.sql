-- ============================================================================
-- Temple · Migración: posts de recuperación (sueño + meditación)
-- Pégalo en: Supabase → SQL Editor → New query → Run.
-- Amplía el check del campo `kind` para permitir compartir descanso/respiración.
-- Es idempotente y no toca los datos existentes.
-- ============================================================================

alter table public.posts drop constraint if exists posts_kind_check;

alter table public.posts
  add constraint posts_kind_check
  check (kind in ('texto','rutina','sesion','receta','foto','sueno','meditacion'));
