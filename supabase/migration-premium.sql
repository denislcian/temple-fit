-- Migración: plan premium (freemium) + enlace con Stripe.
-- Idempotente: se puede re-pegar entera en el SQL Editor de Supabase.
--
-- profiles.premium_until en el futuro = usuario premium (cuota IA ampliada y
-- rutinas ilimitadas). La escribe el webhook de Stripe (stripe-webhook) o el
-- dueño a mano:
--   update public.profiles set premium_until = now() + interval '1 month'
--   where user_id = '<uuid>';

alter table public.profiles
  add column if not exists premium_until timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- BLINDAJE: las políticas RLS de profiles permiten a cada usuario actualizar su
-- propia fila, y RLS es por FILA, no por columna. Sin esto, cualquiera podría
-- auto-concederse premium, o peor: poner el stripe_subscription_id de OTRO
-- usuario y heredar sus renovaciones. Estas tres columnas solo las toca el
-- service role (Edge Functions / SQL Editor).
create or replace function public.protect_premium_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.premium_until is distinct from old.premium_until
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id)
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'las columnas premium/stripe solo las modifica el servidor';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_premium_until on public.profiles;
drop trigger if exists protect_premium_columns on public.profiles;
create trigger protect_premium_columns
  before update on public.profiles
  for each row
  execute function public.protect_premium_columns();
