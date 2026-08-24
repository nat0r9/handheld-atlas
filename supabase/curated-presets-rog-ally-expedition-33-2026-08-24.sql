-- Two published External Source presets for Clair Obscur: Expedition 33 on
-- the original ROG Ally Z1 Extreme. Reviewed 2026-08-24.
--
-- RPG Site identifies the device, 25W Turbo profile, resolution, Low preset,
-- and TSR 50% configuration. Its ROG Ally gallery includes live FPS overlays,
-- while the article reports ranges rather than measured averages. Average FPS
-- and percentile fields therefore remain null and Atlas Verified remains false.

begin;

with editor as (
  select id
  from public.profiles
  where role in ('admin', 'atlas_editor')
  order by case when role = 'admin' then 0 else 1 end, created_at
  limit 1
), source_rows as (
  select
    game.id as game_id,
    handheld.id as handheld_id,
    editor.id as editor_id,
    source.*
  from (values
    (
      'RPG Site 1080p Low TSR 50% 25W',
      'Balanced'::public.preset_type,
      '1920 × 1080',
      'RPG Site launch-era quality baseline for the original ROG Ally Z1 Extreme at 25W Turbo. Low graphics with TSR at 50% keeps the native 1080p interface while the source reports performance above 30 FPS. The author notes visible stuttering and hitching. The linked ROG Ally screenshot shows an instantaneous 36 FPS reading; exact average and low-percentile metrics were not measured and remain blank.',
      'https://images.rpgsite.net/image/da49c9a1/150452/original/clair-obscur-expedition-33_20250423_rog-ally-review-21.jpg',
      'The article identifies the ROG Ally, 25W Turbo mode, 1080p output, Low preset and TSR 50% configuration, and provides a dedicated ROG Ally screenshot gallery with visible FPS overlays. It reports performance as above 30 FPS rather than a measured scalar average and supplies no low-percentile data, so those fields remain blank.'
    ),
    (
      'RPG Site 720p Low TSR 50% 25W',
      'Performance'::public.preset_type,
      '1280 × 720',
      'RPG Site launch-era performance baseline for the original ROG Ally Z1 Extreme at 25W Turbo. At 720p with Low graphics and TSR at 50%, the source reports roughly 40–50 FPS on the demanding world map and often 50–70 FPS inside regular zones. The author still notes stuttering and hitching. The linked ROG Ally screenshot shows an instantaneous 42 FPS reading; exact average and low-percentile metrics were not measured and remain blank.',
      'https://images.rpgsite.net/image/da49c9a1/150433/original/clair-obscur-expedition-33_20250423_rog-ally-review-2.jpg',
      'The article identifies the ROG Ally, 25W Turbo mode, 720p output and the same Low plus TSR 50% configuration as its 1080p recommendation, and provides a dedicated ROG Ally screenshot gallery with visible FPS overlays. It reports location-dependent ranges rather than a measured scalar average and supplies no low-percentile data, so those fields remain blank.'
    )
  ) source(
    preset_name,
    preset_type,
    resolution,
    summary,
    artifact_url,
    exception_reason
  )
  join public.games game
    on game.slug = 'clair-obscur-expedition-33'
  join public.handhelds handheld
    on handheld.slug = 'rog-ally'
  cross join editor
)
insert into public.presets (
  game_id,
  handheld_id,
  name,
  preset_type,
  resolution,
  tdp,
  upscaler,
  summary,
  status,
  created_by,
  published_at,
  atlas_verified,
  evidence_tier,
  source_name,
  source_url,
  source_checked_at,
  game_version,
  driver_version,
  os_version,
  evidence_artifact_type,
  evidence_artifact_url,
  evidence_exception_approved,
  evidence_exception_reason,
  evidence_exception_approved_at,
  evidence_exception_approved_by
)
select
  game_id,
  handheld_id,
  preset_name,
  preset_type,
  resolution,
  '25W',
  'TSR 50%',
  summary,
  'published'::public.content_status,
  editor_id,
  timestamptz '2026-08-24 21:10:00+02',
  false,
  'external_source',
  'RPG Site',
  'https://www.rpgsite.net/feature/17274-clair-obscur-expedition-33-steam-deck-recommended-settings-thank-you-update-performance-impressions',
  date '2026-08-24',
  'Launch/day-one ROG Ally test section; exact build not disclosed',
  'Not disclosed by source',
  'Windows 11; exact build not disclosed',
  'performance_screenshot',
  artifact_url,
  true,
  exception_reason,
  timestamptz '2026-08-24 21:10:00+02',
  editor_id
from source_rows
where not exists (
  select 1
  from public.presets existing
  where existing.game_id = source_rows.game_id
    and existing.handheld_id = source_rows.handheld_id
    and existing.name = source_rows.preset_name
);

with desired_groups as (
  select
    preset.id as preset_id,
    groups.name,
    groups.sort_order
  from public.presets preset
  join public.games game on game.id = preset.game_id
  join public.handhelds handheld on handheld.id = preset.handheld_id
  cross join (values
    ('Device setup', 0),
    ('Display', 1),
    ('Graphics', 2)
  ) groups(name, sort_order)
  where game.slug = 'clair-obscur-expedition-33'
    and handheld.slug = 'rog-ally'
    and preset.name in (
      'RPG Site 1080p Low TSR 50% 25W',
      'RPG Site 720p Low TSR 50% 25W'
    )
)
insert into public.preset_setting_groups (
  preset_id,
  name,
  sort_order
)
select preset_id, name, sort_order
from desired_groups
where not exists (
  select 1
  from public.preset_setting_groups existing
  where existing.preset_id = desired_groups.preset_id
    and existing.name = desired_groups.name
);

with desired_settings as (
  select
    preset.id as preset_id,
    settings.group_name,
    settings.label,
    settings.value,
    settings.note,
    settings.sort_order
  from public.presets preset
  join public.games game on game.id = preset.game_id
  join public.handhelds handheld on handheld.id = preset.handheld_id
  join (values
    ('RPG Site 1080p Low TSR 50% 25W', 'Device setup', 'Operating Mode', 'Turbo (25W)', 'default: Source power profile.', 0),
    ('RPG Site 1080p Low TSR 50% 25W', 'Display', 'Resolution', '1920 × 1080', 'visual: Native panel output preserves the crisp interface.', 0),
    ('RPG Site 1080p Low TSR 50% 25W', 'Graphics', 'Overall Preset', 'Low', 'fps: Source quality baseline.', 0),
    ('RPG Site 1080p Low TSR 50% 25W', 'Graphics', 'Upscaling', 'TSR at 50%', 'why: Source reconstruction setting.', 1),

    ('RPG Site 720p Low TSR 50% 25W', 'Device setup', 'Operating Mode', 'Turbo (25W)', 'default: Source power profile.', 0),
    ('RPG Site 720p Low TSR 50% 25W', 'Display', 'Resolution', '1280 × 720', 'fps: Lower output resolution used for the faster profile.', 0),
    ('RPG Site 720p Low TSR 50% 25W', 'Graphics', 'Overall Preset', 'Low', 'fps: Source quality baseline.', 0),
    ('RPG Site 720p Low TSR 50% 25W', 'Graphics', 'Upscaling', 'TSR at 50%', 'why: Source reconstruction setting.', 1)
  ) settings(
    preset_name,
    group_name,
    label,
    value,
    note,
    sort_order
  ) on settings.preset_name = preset.name
  where game.slug = 'clair-obscur-expedition-33'
    and handheld.slug = 'rog-ally'
)
insert into public.preset_setting_items (
  group_id,
  label,
  value,
  note,
  sort_order
)
select
  groups.id,
  desired.label,
  desired.value,
  desired.note,
  desired.sort_order
from desired_settings desired
join public.preset_setting_groups groups
  on groups.preset_id = desired.preset_id
 and groups.name = desired.group_name
where not exists (
  select 1
  from public.preset_setting_items existing
  where existing.group_id = groups.id
    and existing.label = desired.label
);

do $$
declare
  published_count integer;
  setting_count integer;
begin
  select count(*)
    into published_count
    from public.presets preset
    join public.games game on game.id = preset.game_id
    join public.handhelds handheld on handheld.id = preset.handheld_id
    where game.slug = 'clair-obscur-expedition-33'
      and handheld.slug = 'rog-ally'
      and preset.name in (
        'RPG Site 1080p Low TSR 50% 25W',
        'RPG Site 720p Low TSR 50% 25W'
      )
      and preset.status = 'published'
      and preset.evidence_tier = 'external_source'
      and preset.atlas_verified = false
      and preset.evidence_exception_approved = true
      and preset.evidence_artifact_type = 'performance_screenshot'
      and preset.fps_average is null
      and preset.one_percent_low is null;

  if published_count <> 2 then
    raise exception 'Expected two published ROG Ally Expedition 33 presets';
  end if;

  select count(*)
    into setting_count
    from public.preset_setting_items item
    join public.preset_setting_groups groups on groups.id = item.group_id
    join public.presets preset on preset.id = groups.preset_id
    join public.games game on game.id = preset.game_id
    join public.handhelds handheld on handheld.id = preset.handheld_id
    where game.slug = 'clair-obscur-expedition-33'
      and handheld.slug = 'rog-ally'
      and preset.name in (
        'RPG Site 1080p Low TSR 50% 25W',
        'RPG Site 720p Low TSR 50% 25W'
      );

  if setting_count <> 8 then
    raise exception 'Expected eight source-backed setting rows';
  end if;
end
$$;

commit;
