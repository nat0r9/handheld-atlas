-- HandheldAtlas feedback roadmap — Phase 3
-- Atlas Verified, confidence moderation and confirmation audit trail.
-- Run this in Supabase SQL Editor before deploying the Phase 3 code.

alter table public.presets
add column if not exists atlas_verified boolean
not null
default false;

alter table public.presets
add column if not exists verified_at timestamptz;

alter table public.presets
add column if not exists verified_by uuid
references public.profiles(id)
on delete set null;

create index if not exists presets_atlas_verified_idx
on public.presets(atlas_verified)
where atlas_verified = true;

-- The database protects the editorial signal as well as the UI. A tester
-- cannot mark a preset verified through a direct API request.
create or replace function public.enforce_preset_verification_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_verification_changed boolean;
begin
  v_verification_changed :=
    new.atlas_verified is distinct from
      case
        when tg_op = 'INSERT' then false
        else old.atlas_verified
      end
    or new.verified_at is distinct from
      case
        when tg_op = 'INSERT' then null
        else old.verified_at
      end
    or new.verified_by is distinct from
      case
        when tg_op = 'INSERT' then null
        else old.verified_by
      end;

  if v_verification_changed then
    select profiles.role
    into v_role
    from public.profiles
    where profiles.id = v_actor;

    if v_role is null or v_role not in (
      'atlas_editor',
      'admin'
    ) then
      raise exception 'Only Atlas Editors and Administrators can change Atlas Verified';
    end if;
  end if;

  if new.atlas_verified then
    if
      tg_op = 'INSERT'
      or old.atlas_verified = false
    then
      new.verified_at := now();
      new.verified_by := v_actor;
    else
      new.verified_at := old.verified_at;
      new.verified_by := old.verified_by;
    end if;
  else
    new.verified_at := null;
    new.verified_by := null;
  end if;

  return new;
end;
$$;

drop trigger if exists presets_verification_guard
on public.presets;

create trigger presets_verification_guard
before insert or update
on public.presets
for each row
execute function public.enforce_preset_verification_permissions();

-- Staff can remove a confirmation that is fraudulent, duplicated through an
-- account-abuse edge case or clearly does not match the published test target.
drop policy if exists "Staff can remove invalid preset confirmations"
on public.preset_confirmations;

create policy "Staff can remove invalid preset confirmations"
on public.preset_confirmations
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'moderator',
        'atlas_editor',
        'admin'
      )
  )
);

create table if not exists public.preset_confirmation_moderation_log (
  id uuid primary key default gen_random_uuid(),
  confirmation_id uuid,
  preset_id uuid not null references public.presets(id) on delete cascade,
  confirmed_user_id uuid not null,
  removed_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  removed_at timestamptz not null default now()
);

create index if not exists preset_confirmation_moderation_log_preset_idx
on public.preset_confirmation_moderation_log(preset_id);

create index if not exists preset_confirmation_moderation_log_removed_at_idx
on public.preset_confirmation_moderation_log(removed_at desc);

alter table public.preset_confirmation_moderation_log
enable row level security;

grant select, insert
on public.preset_confirmation_moderation_log
to authenticated;

drop policy if exists "Staff can read preset confirmation moderation log"
on public.preset_confirmation_moderation_log;

create policy "Staff can read preset confirmation moderation log"
on public.preset_confirmation_moderation_log
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'moderator',
        'atlas_editor',
        'admin'
      )
  )
);

drop policy if exists "Staff can create preset confirmation moderation log"
on public.preset_confirmation_moderation_log;

create policy "Staff can create preset confirmation moderation log"
on public.preset_confirmation_moderation_log
for insert
to authenticated
with check (
  removed_by = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in (
        'moderator',
        'atlas_editor',
        'admin'
      )
  )
);

-- Transaction-safe moderation. The log insert and confirmation removal either
-- both succeed or both roll back.
create or replace function public.moderate_preset_confirmation(
  p_confirmation_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_confirmation public.preset_confirmations%rowtype;
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select profiles.role
  into v_role
  from public.profiles
  where profiles.id = auth.uid();

  if v_role is null or v_role not in (
    'moderator',
    'atlas_editor',
    'admin'
  ) then
    raise exception 'Insufficient moderation role';
  end if;

  if length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A clear moderation reason is required';
  end if;

  select *
  into v_confirmation
  from public.preset_confirmations
  where id = p_confirmation_id
  for update;

  if not found then
    raise exception 'Confirmation not found';
  end if;

  insert into public.preset_confirmation_moderation_log (
    confirmation_id,
    preset_id,
    confirmed_user_id,
    removed_by,
    reason
  ) values (
    v_confirmation.id,
    v_confirmation.preset_id,
    v_confirmation.user_id,
    auth.uid(),
    trim(p_reason)
  );

  delete from public.preset_confirmations
  where id = v_confirmation.id;

  return v_confirmation.preset_id;
end;
$$;

revoke all
on function public.moderate_preset_confirmation(uuid, text)
from public;

grant execute
on function public.moderate_preset_confirmation(uuid, text)
to authenticated;
