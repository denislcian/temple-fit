-- Migración: plan premium (freemium).
-- profiles.premium_until en el futuro = usuario premium (cuota IA ampliada en
-- la Edge Function coach-advice). La escribirá la pasarela de pago (webhook)
-- cuando exista; mientras tanto puede activarse a mano desde el SQL Editor:
--   update public.profiles set premium_until = now() + interval '1 month'
--   where user_id = '<uuid>';
--
-- Ejecutar en el SQL Editor de Supabase.

alter table public.profiles
  add column if not exists premium_until timestamptz;

-- BLINDAJE: las políticas RLS de profiles permiten a cada usuario actualizar su
-- propia fila, y RLS es por FILA, no por columna — sin esto, cualquiera podría
-- auto-concederse premium desde la API. Este trigger hace premium_until de solo
-- lectura salvo para el service role (la Edge Function / el webhook de pago).
create or replace function public.protect_premium_until()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.premium_until is distinct from old.premium_until
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'premium_until solo lo modifica el servidor';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_premium_until on public.profiles;
create trigger protect_premium_until
  before update on public.profiles
  for each row
  execute function public.protect_premium_until();
