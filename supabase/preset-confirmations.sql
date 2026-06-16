-- HandheldAtlas preset community confirmations
-- Run this once in the Supabase SQL Editor before deploying Phase 2.

create table if not exists public.preset_confirmations (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.presets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint preset_confirmations_preset_user_unique unique (preset_id, user_id)
);

create index if not exists preset_confirmations_preset_id_idx
on public.preset_confirmations(preset_id);

create index if not exists preset_confirmations_user_id_idx
on public.preset_confirmations(user_id);

alter table public.preset_confirmations enable row level security;

grant select on public.preset_confirmations to anon, authenticated;
grant insert, delete on public.preset_confirmations to authenticated;

drop policy if exists "Anyone can read preset confirmations"
on public.preset_confirmations;

create policy "Anyone can read preset confirmations"
on public.preset_confirmations
for select
to anon, authenticated
using (true);

drop policy if exists "Users can confirm published presets"
on public.preset_confirmations;

create policy "Users can confirm published presets"
on public.preset_confirmations
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.presets
    where presets.id = preset_confirmations.preset_id
      and presets.status = 'published'
  )
);

drop policy if exists "Users can remove their preset confirmations"
on public.preset_confirmations;

create policy "Users can remove their preset confirmations"
on public.preset_confirmations
for delete
to authenticated
using (user_id = auth.uid());
