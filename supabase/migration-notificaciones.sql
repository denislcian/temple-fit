-- ============================================================================
-- Temple · Migración: notificaciones (te siguen / like / comentario)
-- Supabase → SQL Editor → New query → Run. Idempotente.
-- Lees y gestionas SOLO las tuyas; al crear una, te marcas como actor (RLS).
-- ============================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,   -- destinatario
  actor uuid not null references auth.users on delete cascade,     -- quién la provoca
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
