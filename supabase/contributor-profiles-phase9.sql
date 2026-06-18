-- HandheldAtlas Phase 9 — Contributor profiles, attribution and reputation

alter table public.profiles
  add column if not exists public_slug text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists public_profile boolean not null default true,
  add column if not exists owned_devices text[] not null default '{}',
  add column if not exists contributor_level text not null default 'new_contributor',
  add column if not exists contribution_score integer not null default 0;

update public.profiles
set public_slug = lower(regexp_replace(coalesce(nullif(display_name, ''), split_part(coalesce(email, id::text), '@', 1)), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(id::text, 6)
where public_slug is null or btrim(public_slug) = '';

create unique index if not exists profiles_public_slug_unique_idx
on public.profiles(public_slug)
where public_slug is not null;

alter table public.profiles drop constraint if exists profiles_contributor_level_check;
alter table public.profiles add constraint profiles_contributor_level_check
check (contributor_level in ('new_contributor','contributor','skilled_contributor','expert_contributor','master_contributor'));

create table if not exists public.contributor_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null default '★',
  badge_type text not null default 'automatic' check (badge_type in ('automatic','manual')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_contributor_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.contributor_badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references public.profiles(id) on delete set null,
  source text not null default 'automatic',
  primary key (user_id, badge_id)
);

insert into public.contributor_badges (slug, name, description, icon, badge_type)
values
  ('preset-creator','Preset Creator','Published at least 5 approved presets.','🎛️','automatic'),
  ('benchmark-tester','Benchmark Tester','Published at least 5 benchmark results.','📊','automatic'),
  ('performance-tuner','Performance Tuner','Published at least 5 performance-focused presets.','⚡','automatic'),
  ('battery-optimizer','Battery Optimizer','Published at least 3 battery-focused presets.','🔋','automatic'),
  ('quality-hunter','Quality Hunter','Published at least 5 quality or docked presets.','✨','automatic'),
  ('rog-ally-specialist','ROG Ally Specialist','Published at least 8 contributions for ROG Ally hardware.','🟥','automatic'),
  ('steam-deck-specialist','Steam Deck Specialist','Published at least 8 contributions for Steam Deck hardware.','🟦','automatic'),
  ('legion-go-specialist','Legion Go Specialist','Published at least 8 contributions for Legion Go hardware.','🟩','automatic'),
  ('atlas-verified-tester','Atlas Verified Tester','Trusted tester badge awarded by the HandheldAtlas team.','🛡️','manual'),
  ('founding-contributor','Founding Contributor','Helped build the community during its earliest stage.','🧭','manual'),
  ('community-pioneer','Community Pioneer','Made an exceptional early contribution to the Atlas.','🚀','manual')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  badge_type = excluded.badge_type;

create or replace function public.recalculate_contributor_reputation(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_presets integer := 0;
  v_benchmarks integer := 0;
  v_verified integer := 0;
  v_confirmations integer := 0;
  v_performance integer := 0;
  v_battery integer := 0;
  v_quality integer := 0;
  v_rog integer := 0;
  v_deck integer := 0;
  v_legion integer := 0;
  v_score integer := 0;
  v_level text := 'new_contributor';
begin
  select count(*), count(*) filter (where atlas_verified),
         count(*) filter (where lower(preset_type) = 'performance'),
         count(*) filter (where lower(preset_type) = 'battery'),
         count(*) filter (where lower(preset_type) in ('docked','quality'))
  into v_presets, v_verified, v_performance, v_battery, v_quality
  from public.presets
  where created_by = p_user_id and status = 'published';

  select count(*) into v_benchmarks
  from public.benchmarks
  where created_by = p_user_id and status = 'published';

  select count(*) into v_confirmations
  from public.preset_confirmations pc
  join public.presets p on p.id = pc.preset_id
  where p.created_by = p_user_id;

  select
    count(*) filter (where lower(h.name) like '%rog ally%'),
    count(*) filter (where lower(h.name) like '%steam deck%'),
    count(*) filter (where lower(h.name) like '%legion go%')
  into v_rog, v_deck, v_legion
  from (
    select handheld_id from public.presets where created_by = p_user_id and status = 'published'
    union all
    select handheld_id from public.benchmarks where created_by = p_user_id and status = 'published'
  ) c
  join public.handhelds h on h.id = c.handheld_id;

  v_score := (v_presets * 10) + (v_benchmarks * 12) + (v_verified * 8) + least(v_confirmations, 100);

  if v_presets + v_benchmarks >= 50 and v_score >= 700 then v_level := 'master_contributor';
  elsif v_presets + v_benchmarks >= 25 and v_score >= 350 then v_level := 'expert_contributor';
  elsif v_presets + v_benchmarks >= 10 and v_confirmations >= 5 then v_level := 'skilled_contributor';
  elsif v_presets + v_benchmarks >= 3 then v_level := 'contributor';
  else v_level := 'new_contributor'; end if;

  update public.profiles set contributor_level = v_level, contribution_score = v_score, updated_at = now() where id = p_user_id;

  delete from public.user_contributor_badges ucb
  using public.contributor_badges cb
  where ucb.badge_id = cb.id and ucb.user_id = p_user_id and cb.badge_type = 'automatic';

  insert into public.user_contributor_badges(user_id, badge_id, source)
  select p_user_id, id, 'automatic' from public.contributor_badges
  where badge_type = 'automatic' and (
    (slug = 'preset-creator' and v_presets >= 5) or
    (slug = 'benchmark-tester' and v_benchmarks >= 5) or
    (slug = 'performance-tuner' and v_performance >= 5) or
    (slug = 'battery-optimizer' and v_battery >= 3) or
    (slug = 'quality-hunter' and v_quality >= 5) or
    (slug = 'rog-ally-specialist' and v_rog >= 8) or
    (slug = 'steam-deck-specialist' and v_deck >= 8) or
    (slug = 'legion-go-specialist' and v_legion >= 8)
  ) on conflict do nothing;
end;
$$;

create or replace function public.refresh_all_contributor_reputation()
returns void language plpgsql security definer set search_path = public as $$
declare r record; begin
  for r in select id from public.profiles loop perform public.recalculate_contributor_reputation(r.id); end loop;
end; $$;

select public.refresh_all_contributor_reputation();

alter table public.contributor_badges enable row level security;
alter table public.user_contributor_badges enable row level security;

drop policy if exists "Public can read contributor badges" on public.contributor_badges;
create policy "Public can read contributor badges" on public.contributor_badges for select using (true);
drop policy if exists "Public can read awarded badges" on public.user_contributor_badges;
create policy "Public can read awarded badges" on public.user_contributor_badges for select using (true);

drop policy if exists "Public can read public contributor profiles" on public.profiles;
create policy "Public can read public contributor profiles" on public.profiles for select using (public_profile = true or id = auth.uid());

create or replace function public.refresh_contributor_from_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.created_by is not null then perform public.recalculate_contributor_reputation(old.created_by); end if;
    return old;
  end if;
  if new.created_by is not null then perform public.recalculate_contributor_reputation(new.created_by); end if;
  if tg_op = 'UPDATE' and old.created_by is distinct from new.created_by and old.created_by is not null then
    perform public.recalculate_contributor_reputation(old.created_by);
  end if;
  return new;
end;
$$;

drop trigger if exists contributor_reputation_from_presets on public.presets;
create trigger contributor_reputation_from_presets
after insert or update of status, created_by, atlas_verified or delete on public.presets
for each row execute function public.refresh_contributor_from_content();

drop trigger if exists contributor_reputation_from_benchmarks on public.benchmarks;
create trigger contributor_reputation_from_benchmarks
after insert or update of status, created_by or delete on public.benchmarks
for each row execute function public.refresh_contributor_from_content();

create or replace function public.refresh_contributor_from_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid;
begin
  select created_by into v_owner from public.presets where id = coalesce(new.preset_id, old.preset_id);
  if v_owner is not null then perform public.recalculate_contributor_reputation(v_owner); end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists contributor_reputation_from_confirmations on public.preset_confirmations;
create trigger contributor_reputation_from_confirmations
after insert or delete on public.preset_confirmations
for each row execute function public.refresh_contributor_from_confirmation();
