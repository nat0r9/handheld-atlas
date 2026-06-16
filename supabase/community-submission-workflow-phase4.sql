-- HandheldAtlas feedback roadmap — Phase 4
-- Transaction-safe community preset submissions, revision history,
-- withdrawal support and a direct link to the published preset.
-- Run this in Supabase SQL Editor before deploying the Phase 4 code.

begin;

alter table public.preset_submissions
add column if not exists published_preset_id uuid
references public.presets(id)
on delete set null;

alter table public.preset_submissions
add column if not exists revision_number integer
not null
default 1;

alter table public.preset_submissions
add column if not exists settings_draft jsonb
not null
default '[]'::jsonb;

alter table public.preset_submissions
drop constraint if exists preset_submissions_revision_number_check;

alter table public.preset_submissions
add constraint preset_submissions_revision_number_check
check (revision_number >= 1);

create unique index if not exists preset_submissions_published_preset_id_uidx
on public.preset_submissions(published_preset_id)
where published_preset_id is not null;

create table if not exists public.preset_submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.preset_submissions(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  revision_number integer not null default 1,
  created_at timestamptz not null default now(),
  constraint preset_submission_events_type_check check (
    event_type in (
      'created',
      'submitted',
      'resubmitted',
      'withdrawn',
      'changes_requested',
      'rejected',
      'approved',
      'imported'
    )
  ),
  constraint preset_submission_events_revision_check check (
    revision_number >= 1
  )
);

create index if not exists preset_submission_events_submission_idx
on public.preset_submission_events(submission_id, created_at desc);

alter table public.preset_submission_events enable row level security;

grant select on public.preset_submission_events to authenticated;

drop policy if exists "Owners and staff can read preset submission events"
on public.preset_submission_events;

create policy "Owners and staff can read preset submission events"
on public.preset_submission_events
for select
to authenticated
using (
  exists (
    select 1
    from public.preset_submissions
    where preset_submissions.id = preset_submission_events.submission_id
      and preset_submissions.user_id = auth.uid()
  )
  or exists (
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

create or replace function public.log_preset_submission_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_event_type text;
  v_note text;
begin
  if v_actor is not null and not exists (
    select 1
    from public.profiles
    where profiles.id = v_actor
  ) then
    v_actor := null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.preset_submission_events (
      submission_id,
      actor_id,
      event_type,
      from_status,
      to_status,
      note,
      revision_number
    ) values (
      new.id,
      v_actor,
      'created',
      null,
      'draft',
      null,
      new.revision_number
    );

    if new.status = 'pending' then
      insert into public.preset_submission_events (
        submission_id,
        actor_id,
        event_type,
        from_status,
        to_status,
        note,
        revision_number
      ) values (
        new.id,
        v_actor,
        'submitted',
        'draft',
        'pending',
        null,
        new.revision_number
      );
    end if;

    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  v_event_type := case
    when new.status = 'pending' and old.status in ('changes_requested', 'rejected')
      then 'resubmitted'
    when new.status = 'pending'
      then 'submitted'
    when old.status = 'pending' and new.status = 'draft'
      then 'withdrawn'
    when new.status = 'changes_requested'
      then 'changes_requested'
    when new.status = 'rejected'
      then 'rejected'
    when new.status = 'approved'
      then 'approved'
    else null
  end;

  if v_event_type is null then
    return new;
  end if;

  v_note := case
    when v_event_type in ('changes_requested', 'rejected', 'approved')
      then nullif(trim(new.moderator_note), '')
    when v_event_type = 'withdrawn'
      then 'The author withdrew this revision from moderation.'
    else null
  end;

  insert into public.preset_submission_events (
    submission_id,
    actor_id,
    event_type,
    from_status,
    to_status,
    note,
    revision_number
  ) values (
    new.id,
    v_actor,
    v_event_type,
    old.status::text,
    new.status::text,
    v_note,
    new.revision_number
  );

  return new;
end;
$$;

drop trigger if exists preset_submission_event_log
on public.preset_submissions;

create trigger preset_submission_event_log
after insert or update of status
on public.preset_submissions
for each row
execute function public.log_preset_submission_event();

insert into public.preset_submission_events (
  submission_id,
  actor_id,
  event_type,
  from_status,
  to_status,
  note,
  revision_number,
  created_at
)
select
  submissions.id,
  case
    when exists (
      select 1
      from public.profiles
      where profiles.id = submissions.user_id
    ) then submissions.user_id
    else null
  end,
  'imported',
  null,
  submissions.status::text,
  'Existing submission imported into the Phase 4 workflow history.',
  submissions.revision_number,
  coalesce(submissions.updated_at, now())
from public.preset_submissions as submissions
where not exists (
  select 1
  from public.preset_submission_events as events
  where events.submission_id = submissions.id
);

create or replace function public.save_preset_submission(
  p_submission_id uuid,
  p_game_id uuid,
  p_handheld_id uuid,
  p_name text,
  p_preset_type text,
  p_resolution text,
  p_tdp text,
  p_fps_average numeric,
  p_one_percent_low numeric,
  p_upscaler text,
  p_battery_life text,
  p_summary text,
  p_settings jsonb,
  p_submit boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_submission public.preset_submissions%rowtype;
  v_submission_id uuid;
  v_revision integer := 1;
  v_group jsonb;
  v_item jsonb;
  v_group_id uuid;
  v_group_index integer;
  v_item_index integer;
  v_complete_settings integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  if p_game_id is null or p_handheld_id is null then
    raise exception 'Game and handheld are required';
  end if;

  if length(trim(coalesce(p_name, ''))) < 4 then
    raise exception 'Preset name must contain at least 4 characters';
  end if;

  if p_preset_type not in (
    'Performance',
    'Balanced',
    'Battery',
    'Docked',
    'Custom'
  ) then
    raise exception 'Invalid preset type';
  end if;

  if not exists (
    select 1
    from public.games
    where games.id = p_game_id
      and games.status = 'published'
  ) then
    raise exception 'Selected game is not available';
  end if;

  if not exists (
    select 1
    from public.handhelds
    where handhelds.id = p_handheld_id
      and handhelds.status = 'published'
  ) then
    raise exception 'Selected handheld is not available';
  end if;

  select count(*)::integer
  into v_complete_settings
  from jsonb_array_elements(coalesce(p_settings, '[]'::jsonb)) as groups(value)
  cross join lateral jsonb_array_elements(
    coalesce(groups.value -> 'items', '[]'::jsonb)
  ) as items(value)
  where length(trim(coalesce(groups.value ->> 'name', ''))) > 0
    and length(trim(coalesce(items.value ->> 'label', ''))) > 0
    and length(trim(coalesce(items.value ->> 'value', ''))) > 0;

  if p_submit then
    if length(trim(coalesce(p_resolution, ''))) = 0
      or length(trim(coalesce(p_tdp, ''))) = 0 then
      raise exception 'Resolution and TDP are required before review';
    end if;

    if p_fps_average is null
      and p_one_percent_low is null
      and length(trim(coalesce(p_battery_life, ''))) < 3 then
      raise exception 'Add average FPS, 1%% low or a battery-life result before review';
    end if;

    if length(trim(coalesce(p_summary, ''))) < 50 then
      raise exception 'Summary must contain at least 50 characters before review';
    end if;

    if v_complete_settings < 3 then
      raise exception 'Add at least three complete settings before review';
    end if;
  end if;

  if p_submission_id is null then
    insert into public.preset_submissions (
      user_id,
      game_id,
      handheld_id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      one_percent_low,
      upscaler,
      battery_life,
      summary,
      status,
      submitted_at,
      revision_number,
      settings_draft,
      updated_at
    ) values (
      v_user,
      p_game_id,
      p_handheld_id,
      trim(p_name),
      p_preset_type,
      nullif(trim(coalesce(p_resolution, '')), ''),
      nullif(trim(coalesce(p_tdp, '')), ''),
      p_fps_average,
      p_one_percent_low,
      nullif(trim(coalesce(p_upscaler, '')), ''),
      nullif(trim(coalesce(p_battery_life, '')), ''),
      nullif(trim(coalesce(p_summary, '')), ''),
      case
        when p_submit then 'pending'::public.submission_status
        else 'draft'::public.submission_status
      end,
      case when p_submit then now() else null end,
      1,
      coalesce(p_settings, '[]'::jsonb),
      now()
    )
    returning id into v_submission_id;
  else
    select *
    into v_submission
    from public.preset_submissions
    where id = p_submission_id
      and user_id = v_user
    for update;

    if not found then
      raise exception 'Submission not found';
    end if;

    if v_submission.status not in (
      'draft',
      'changes_requested',
      'rejected'
    ) then
      raise exception 'This submission is locked for review';
    end if;

    v_revision := v_submission.revision_number;

    if p_submit and v_submission.status in (
      'changes_requested',
      'rejected'
    ) then
      v_revision := v_revision + 1;
    end if;

    update public.preset_submissions
    set
      game_id = p_game_id,
      handheld_id = p_handheld_id,
      name = trim(p_name),
      preset_type = p_preset_type,
      resolution = nullif(trim(coalesce(p_resolution, '')), ''),
      tdp = nullif(trim(coalesce(p_tdp, '')), ''),
      fps_average = p_fps_average,
      one_percent_low = p_one_percent_low,
      upscaler = nullif(trim(coalesce(p_upscaler, '')), ''),
      battery_life = nullif(trim(coalesce(p_battery_life, '')), ''),
      summary = nullif(trim(coalesce(p_summary, '')), ''),
      status = case
        when p_submit then 'pending'::public.submission_status
        else 'draft'::public.submission_status
      end,
      submitted_at = case when p_submit then now() else submitted_at end,
      revision_number = v_revision,
      settings_draft = coalesce(p_settings, '[]'::jsonb),
      moderator_note = case when p_submit then null else moderator_note end,
      reviewed_at = case when p_submit then null else reviewed_at end,
      reviewed_by = case when p_submit then null else reviewed_by end,
      updated_at = now()
    where id = v_submission.id;

    v_submission_id := v_submission.id;

    delete from public.preset_submission_groups
    where submission_id = v_submission_id;
  end if;

  v_group_index := 0;

  for v_group in
    select value
    from jsonb_array_elements(coalesce(p_settings, '[]'::jsonb))
  loop
    if length(trim(coalesce(v_group ->> 'name', ''))) = 0 then
      continue;
    end if;

    if not exists (
      select 1
      from jsonb_array_elements(coalesce(v_group -> 'items', '[]'::jsonb)) as group_items(value)
      where length(trim(coalesce(group_items.value ->> 'label', ''))) > 0
        and length(trim(coalesce(group_items.value ->> 'value', ''))) > 0
    ) then
      continue;
    end if;

    insert into public.preset_submission_groups (
      submission_id,
      name,
      sort_order
    ) values (
      v_submission_id,
      trim(v_group ->> 'name'),
      v_group_index
    )
    returning id into v_group_id;

    v_item_index := 0;

    for v_item in
      select value
      from jsonb_array_elements(coalesce(v_group -> 'items', '[]'::jsonb))
    loop
      if length(trim(coalesce(v_item ->> 'label', ''))) = 0
        or length(trim(coalesce(v_item ->> 'value', ''))) = 0 then
        continue;
      end if;

      insert into public.preset_submission_items (
        group_id,
        label,
        value,
        note,
        sort_order
      ) values (
        v_group_id,
        trim(v_item ->> 'label'),
        trim(v_item ->> 'value'),
        nullif(trim(coalesce(v_item ->> 'note', '')), ''),
        v_item_index
      );

      v_item_index := v_item_index + 1;
    end loop;

    v_group_index := v_group_index + 1;
  end loop;

  return v_submission_id;
end;
$$;

revoke all
on function public.save_preset_submission(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  text,
  text,
  jsonb,
  boolean
)
from public;

grant execute
on function public.save_preset_submission(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  text,
  text,
  jsonb,
  boolean
)
to authenticated;

create or replace function public.withdraw_preset_submission(
  p_submission_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  update public.preset_submissions
  set
    status = 'draft',
    submitted_at = null,
    updated_at = now()
  where id = p_submission_id
    and user_id = v_user
    and status = 'pending';

  if not found then
    raise exception 'Only your pending submission can be withdrawn';
  end if;

  return p_submission_id;
end;
$$;

revoke all
on function public.withdraw_preset_submission(uuid)
from public;

grant execute
on function public.withdraw_preset_submission(uuid)
to authenticated;

create or replace function public.review_preset_submission(
  p_submission_id uuid,
  p_decision text,
  p_moderator_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select profiles.role
  into v_role
  from public.profiles
  where profiles.id = v_user;

  if v_role is null or v_role not in (
    'moderator',
    'atlas_editor',
    'admin'
  ) then
    raise exception 'Insufficient moderation role';
  end if;

  if p_decision not in ('changes_requested', 'rejected') then
    raise exception 'Invalid moderation decision';
  end if;

  if length(trim(coalesce(p_moderator_note, ''))) < 5 then
    raise exception 'A clear moderator note is required';
  end if;

  update public.preset_submissions
  set
    status = p_decision::public.submission_status,
    moderator_note = trim(p_moderator_note),
    reviewed_at = now(),
    reviewed_by = v_user,
    updated_at = now()
  where id = p_submission_id
    and status = 'pending';

  if not found then
    raise exception 'Only pending submissions can be moderated';
  end if;

  return p_submission_id;
end;
$$;

revoke all
on function public.review_preset_submission(uuid, text, text)
from public;

grant execute
on function public.review_preset_submission(uuid, text, text)
to authenticated;

create or replace function public.publish_preset_submission(
  p_submission_id uuid,
  p_moderator_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_submission public.preset_submissions%rowtype;
  v_preset_id uuid;
  v_source_group record;
  v_source_item record;
  v_new_group_id uuid;
  v_complete_settings integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select profiles.role
  into v_role
  from public.profiles
  where profiles.id = v_user;

  if v_role is null or v_role not in (
    'moderator',
    'atlas_editor',
    'admin'
  ) then
    raise exception 'Insufficient moderation role';
  end if;

  select *
  into v_submission
  from public.preset_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_submission.status <> 'pending' then
    raise exception 'Only pending submissions can be approved';
  end if;

  if v_submission.published_preset_id is not null then
    raise exception 'This submission already has a published preset';
  end if;

  select count(*)::integer
  into v_complete_settings
  from public.preset_submission_groups as submission_groups
  join public.preset_submission_items as submission_items
    on submission_items.group_id = submission_groups.id
  where submission_groups.submission_id = v_submission.id
    and length(trim(submission_groups.name)) > 0
    and length(trim(submission_items.label)) > 0
    and length(trim(submission_items.value)) > 0;

  if length(trim(coalesce(v_submission.resolution, ''))) = 0
    or length(trim(coalesce(v_submission.tdp, ''))) = 0 then
    raise exception 'Resolution and TDP are required before publication';
  end if;

  if v_submission.fps_average is null
    and v_submission.one_percent_low is null
    and length(trim(coalesce(v_submission.battery_life, ''))) < 3 then
    raise exception 'A measured FPS or battery-life result is required before publication';
  end if;

  if length(trim(coalesce(v_submission.summary, ''))) < 50 then
    raise exception 'Summary must contain at least 50 characters before publication';
  end if;

  if v_complete_settings < 3 then
    raise exception 'At least three complete settings are required before publication';
  end if;

  insert into public.presets (
    game_id,
    handheld_id,
    name,
    preset_type,
    resolution,
    tdp,
    fps_average,
    one_percent_low,
    upscaler,
    battery_life,
    community_rating,
    summary,
    status,
    created_by,
    published_at
  ) values (
    v_submission.game_id,
    v_submission.handheld_id,
    v_submission.name,
    v_submission.preset_type,
    v_submission.resolution,
    v_submission.tdp,
    v_submission.fps_average,
    v_submission.one_percent_low,
    v_submission.upscaler,
    v_submission.battery_life,
    null,
    v_submission.summary,
    'published',
    v_submission.user_id,
    now()
  )
  returning id into v_preset_id;

  for v_source_group in
    select id, name, sort_order
    from public.preset_submission_groups
    where submission_id = v_submission.id
    order by sort_order, id
  loop
    insert into public.preset_setting_groups (
      preset_id,
      name,
      sort_order
    ) values (
      v_preset_id,
      v_source_group.name,
      v_source_group.sort_order
    )
    returning id into v_new_group_id;

    for v_source_item in
      select label, value, note, sort_order
      from public.preset_submission_items
      where group_id = v_source_group.id
      order by sort_order, id
    loop
      insert into public.preset_setting_items (
        group_id,
        label,
        value,
        note,
        sort_order
      ) values (
        v_new_group_id,
        v_source_item.label,
        v_source_item.value,
        v_source_item.note,
        v_source_item.sort_order
      );
    end loop;
  end loop;

  update public.preset_submissions
  set
    status = 'approved',
    moderator_note = nullif(trim(coalesce(p_moderator_note, '')), ''),
    reviewed_at = now(),
    reviewed_by = v_user,
    published_preset_id = v_preset_id,
    updated_at = now()
  where id = v_submission.id;

  return v_preset_id;
end;
$$;

revoke all
on function public.publish_preset_submission(uuid, text)
from public;

grant execute
on function public.publish_preset_submission(uuid, text)
to authenticated;

commit;
