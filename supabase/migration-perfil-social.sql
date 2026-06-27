-- ============================================================================
-- Temple · Migración: perfil social (avatar, ubicación) + fotos públicas
-- Supabase → SQL Editor → New query → Run. Idempotente.
-- ============================================================================

-- Campos nuevos del perfil (todos opcionales).
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists location text;        -- ciudad/zona (texto)
alter table public.profiles add column if not exists lat double precision; -- aproximada (sugerencias cercanas)
alter table public.profiles add column if not exists lng double precision;

-- El bucket de fotos pasa a PÚBLICO de lectura: los avatares y las fotos de las
-- publicaciones están pensados para verse en el feed. Subir/borrar sigue
-- restringido a tu propia carpeta (políticas fotos_insert/fotos_delete).
update storage.buckets set public = true where id = 'fotos';
