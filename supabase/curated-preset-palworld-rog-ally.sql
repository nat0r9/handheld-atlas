-- Official ASUS starting point for Palworld on the ROG Ally Z1 Extreme.
-- Kept as a draft because the source predates Palworld 1.0 and does not
-- disclose average FPS, 1% low or a repeatable capture method.

with source_rows as (
  select
    g.id as game_id,
    h.id as handheld_id,
    p.id as editor_id
  from public.games g
  join public.handhelds h on h.slug = 'rog-ally'
  cross join lateral (
    select id
    from public.profiles
    where role = 'admin'
    order by created_at
    limit 1
  ) p
  where g.slug = 'palworld'
), inserted_preset as (
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
    atlas_verified,
    evidence_tier,
    source_name,
    source_url,
    source_checked_at,
    game_version
  )
  select
    game_id,
    handheld_id,
    'ASUS 1080p Quality Baseline',
    'Balanced'::public.preset_type,
    '1920 × 1080',
    '25W Turbo',
    'TSR',
    'Official ASUS baseline targeting stronger image quality at 1080p. The source reports roughly 50–60 FPS at the lowest preset, but does not publish an average or 1% low for this custom configuration. Retest on the current Palworld 1.0 build before publishing.',
    'draft'::public.content_status,
    editor_id,
    false,
    'external_source',
    'ASUS ROG',
    'https://rog.asus.com/articles/rog-ally/palworld-on-the-rog-ally-performance-guide--best-settings/',
    date '2026-08-24',
    'Early Access source; current 1.0 retest required'
  from source_rows
  where not exists (
    select 1
    from public.presets existing
    where existing.game_id = source_rows.game_id
      and existing.handheld_id = source_rows.handheld_id
      and existing.name = 'ASUS 1080p Quality Baseline'
  )
  returning id
), inserted_groups as (
  insert into public.preset_setting_groups (preset_id, name, sort_order)
  select id, group_name, sort_order
  from inserted_preset
  cross join (values
    ('Display', 0),
    ('Graphics quality', 1),
    ('Camera', 2)
  ) groups(group_name, sort_order)
  returning id, name
)
insert into public.preset_setting_items (
  group_id,
  label,
  value,
  note,
  sort_order
)
select groups.id, settings.label, settings.value, settings.note, settings.sort_order
from inserted_groups groups
join (values
  ('Display', 'Resolution', '1920 × 1080', 'default: Native ROG Ally panel resolution.', 0),
  ('Display', 'Max FPS', '120', 'why: Leaves the game uncapped; use a lower external cap only after measuring current frame pacing.', 1),
  ('Display', 'Motion Blur', 'Off', 'visual: Personal preference; ASUS tested with motion blur disabled.', 2),
  ('Graphics quality', 'Anti-Aliasing', 'TSR', 'why: Better edge stability than Off or FXAA at a performance cost.', 0),
  ('Graphics quality', 'View Distance', 'High', 'fps: ASUS reports a relatively small GPU cost on the tested build.', 1),
  ('Graphics quality', 'Grass Details', 'Medium', 'visual: Restores three-dimensional foliage without using the highest setting.', 2),
  ('Graphics quality', 'Shadows', 'Medium', 'why: Balances scene depth with handheld performance.', 3),
  ('Graphics quality', 'Effects Quality', 'Low', 'fps: Lower priority visual setting used to recover performance.', 4),
  ('Graphics quality', 'Texture Quality', 'High', 'why: Primarily VRAM-sensitive; verify allocation on the target system.', 5),
  ('Camera', 'Field of View', '75', 'default: Source test value; wider values can reduce performance.', 0),
  ('Camera', 'Ride Camera Distance', '1', 'default: Source test value.', 1)
) settings(group_name, label, value, note, sort_order)
  on settings.group_name = groups.name;
