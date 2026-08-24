-- External-source starting points for the original Lenovo Legion Go Z1 Extreme.
-- All records remain drafts because the source pages predate current game and
-- driver builds and do not disclose measured 1% lows or repeatable captures.

with editor as (
  select id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
), source_rows as (
  select
    g.id as game_id,
    h.id as handheld_id,
    editor.id as editor_id,
    source.name,
    source.preset_type,
    source.resolution,
    source.tdp,
    source.upscaler,
    source.summary,
    source.source_url
  from (values
    (
      'red-dead-redemption-2',
      'Legion Go Life 800p Performance Baseline',
      'Performance'::public.preset_type,
      '1280 × 800',
      '30W',
      'Integer scaling; FSR 2 Off',
      'Legion Go Life reported an almost-60-FPS experience at 800p and 30W with 6GB VRAM, while noting random stutters. The December 2023 source does not provide a measured average, 1% low, capture route, game build or driver version, so this is a complete settings baseline that requires a current retest before publishing.',
      'https://legiongolife.com/red-dead-redemption-2-legion-go-game-settings/'
    ),
    (
      'ghost-of-tsushima-directors-cut',
      'Legion Go Life 1200p Frame Generation Baseline',
      'Performance'::public.preset_type,
      '1920 × 1200',
      '25W',
      'FSR 3 Balanced + Frame Generation',
      'Legion Go Life targeted 60 FPS at 1200p and 25W with FSR 3 Balanced, frame generation and 6GB VRAM. Its May 2024 report also mentions crashes and does not publish measured average or low-percentile data, so the settings are retained as an external draft pending a current stability and frame-pacing retest.',
      'https://legiongolife.com/ghost-of-tsushima-legion-go-game-settings/'
    ),
    (
      'diablo-iv',
      'Legion Go Life 1200p Quality Baseline',
      'Balanced'::public.preset_type,
      '1920 × 1200',
      '25W',
      'FSR 2 Quality',
      'Legion Go Life reported roughly 50–60+ FPS at 1200p and 25W with 6GB VRAM, while 20W could dip into the 40s. The November 2023 source lacks a measured average, 1% low, capture route and current game or driver version, so this remains a settings-complete draft for modern retesting.',
      'https://legiongolife.com/diablo-4-legion-go-game-settings/'
    )
  ) source(game_slug, name, preset_type, resolution, tdp, upscaler, summary, source_url)
  join public.games g on g.slug = source.game_slug
  join public.handhelds h on h.slug = 'lenovo-legion-go-z1-extreme'
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
  atlas_verified,
  evidence_tier,
  source_name,
  source_url,
  source_checked_at,
  os_version
)
select
  game_id,
  handheld_id,
  name,
  preset_type,
  resolution,
  tdp,
  upscaler,
  summary,
  'draft'::public.content_status,
  editor_id,
  false,
  'external_source',
  'Legion Go Life',
  source_url,
  date '2026-08-24',
  'Windows; exact build not disclosed'
from source_rows
where not exists (
  select 1
  from public.presets existing
  where existing.game_id = source_rows.game_id
    and existing.handheld_id = source_rows.handheld_id
    and existing.name = source_rows.name
);

with desired_groups as (
  select p.id as preset_id, groups.name, groups.sort_order
  from public.presets p
  join public.games g on g.id = p.game_id
  join public.handhelds h on h.id = p.handheld_id
  cross join (values
    ('Device setup', 0),
    ('Display', 1),
    ('Graphics', 2)
  ) groups(name, sort_order)
  where h.slug = 'lenovo-legion-go-z1-extreme'
    and g.slug in (
      'red-dead-redemption-2',
      'ghost-of-tsushima-directors-cut',
      'diablo-iv'
    )
    and p.name like 'Legion Go Life % Baseline'
)
insert into public.preset_setting_groups (preset_id, name, sort_order)
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
    p.id as preset_id,
    settings.group_name,
    settings.label,
    settings.value,
    settings.note,
    settings.sort_order
  from public.presets p
  join public.games g on g.id = p.game_id
  join public.handhelds h on h.id = p.handheld_id
  join (values
    ('red-dead-redemption-2', 'Device setup', 'VRAM', '6GB', 'why: Source requirement intended to avoid memory-related instability.', 0),
    ('red-dead-redemption-2', 'Device setup', 'Integer Scaling', 'Enabled', 'why: Source used integer scaling for the 800p presentation on the 1600p panel.', 1),
    ('red-dead-redemption-2', 'Display', 'Resolution', '1280 × 800', 'default: Source test resolution.', 0),
    ('red-dead-redemption-2', 'Display', 'Refresh Rate', '144 Hz', 'default: Source display setting.', 1),
    ('red-dead-redemption-2', 'Display', 'Screen Type', 'Fullscreen', 'default: Source display mode.', 2),
    ('red-dead-redemption-2', 'Display', 'VSync', 'Off', 'latency: Disabled in the source configuration.', 3),
    ('red-dead-redemption-2', 'Display', 'Triple Buffering', 'Off', 'why: Disabled alongside VSync.', 4),
    ('red-dead-redemption-2', 'Graphics', 'Texture Quality', 'Ultra', 'visual: High texture fidelity retained at 6GB VRAM.', 0),
    ('red-dead-redemption-2', 'Graphics', 'Anisotropic Filtering', '16x', 'visual: Improves oblique texture clarity.', 1),
    ('red-dead-redemption-2', 'Graphics', 'Lighting Quality', 'Medium', 'why: Balanced source setting.', 2),
    ('red-dead-redemption-2', 'Graphics', 'Global Illumination', 'Medium', 'why: Balanced source setting.', 3),
    ('red-dead-redemption-2', 'Graphics', 'Shadow Quality', 'Medium', 'why: Balanced source setting.', 4),
    ('red-dead-redemption-2', 'Graphics', 'Far Shadow Quality', 'Low', 'fps: Reduced distant shadow cost.', 5),
    ('red-dead-redemption-2', 'Graphics', 'Screen Space Ambient Occlusion', 'Medium', 'why: Retains contact shading at moderate cost.', 6),
    ('red-dead-redemption-2', 'Graphics', 'Reflection Quality', 'Low', 'fps: Reduced reflection cost.', 7),
    ('red-dead-redemption-2', 'Graphics', 'Mirror Quality', 'Low', 'fps: Reduced mirror rendering cost.', 8),
    ('red-dead-redemption-2', 'Graphics', 'Water Quality', 'Custom', 'default: Source value; component values are listed separately.', 9),
    ('red-dead-redemption-2', 'Graphics', 'Volumetrics Quality', 'Low', 'fps: Reduced volumetric cost.', 10),
    ('red-dead-redemption-2', 'Graphics', 'Particle Quality', 'Medium', 'why: Balanced source setting.', 11),
    ('red-dead-redemption-2', 'Graphics', 'Tessellation Quality', 'Medium', 'why: Balanced source setting.', 12),
    ('red-dead-redemption-2', 'Graphics', 'AMD FSR 2.0', 'Off', 'visual: Source relied on system integer scaling instead.', 13),
    ('red-dead-redemption-2', 'Graphics', 'TAA', 'High', 'visual: Primary anti-aliasing method in the source configuration.', 14),
    ('red-dead-redemption-2', 'Graphics', 'Graphics API', 'DirectX 12', 'default: Source API.', 15),
    ('red-dead-redemption-2', 'Graphics', 'Near Volumetric Resolution', 'Low', 'fps: Reduced near-volumetric cost.', 16),
    ('red-dead-redemption-2', 'Graphics', 'Far Volumetric Resolution', 'Low', 'fps: Reduced distant-volumetric cost.', 17),
    ('red-dead-redemption-2', 'Graphics', 'Volumetric Lighting Quality', 'Low', 'fps: Reduced lighting cost in fog and clouds.', 18),
    ('red-dead-redemption-2', 'Graphics', 'Unlocked Volumetric Raymarch Resolution', 'Off', 'fps: Disabled in the source configuration.', 19),
    ('red-dead-redemption-2', 'Graphics', 'Particle Lighting Quality', 'Medium', 'why: Balanced source setting.', 20),
    ('red-dead-redemption-2', 'Graphics', 'Soft Shadows', 'Medium', 'why: Balanced source setting.', 21),
    ('red-dead-redemption-2', 'Graphics', 'Grass Shadows', 'Medium', 'why: Balanced source setting.', 22),
    ('red-dead-redemption-2', 'Graphics', 'Long Shadows', 'Off', 'fps: Disabled to reduce distant shadow cost.', 23),
    ('red-dead-redemption-2', 'Graphics', 'Full Resolution Screen Space Ambient Occlusion', 'Off', 'fps: Half-resolution effect retained for performance.', 24),
    ('red-dead-redemption-2', 'Graphics', 'Water Refraction Quality', 'Low', 'fps: Reduced water cost.', 25),
    ('red-dead-redemption-2', 'Graphics', 'Water Reflection Quality', 'Low', 'fps: Reduced water reflection cost.', 26),
    ('red-dead-redemption-2', 'Graphics', 'Water Physics Quality', '2', 'why: Source slider value.', 27),
    ('red-dead-redemption-2', 'Graphics', 'Resolution Scale', 'Off', 'visual: Native 800p render target.', 28),
    ('red-dead-redemption-2', 'Graphics', 'Motion Blur', 'Off', 'visual: Cleaner motion presentation.', 29),
    ('red-dead-redemption-2', 'Graphics', 'Reflection MSAA', 'Off', 'fps: Expensive reflection anti-aliasing disabled.', 30),
    ('red-dead-redemption-2', 'Graphics', 'Geometry Level of Detail', '3', 'default: Source slider value.', 31),
    ('red-dead-redemption-2', 'Graphics', 'Grass Level of Detail', '2', 'fps: Reduced grass distance.', 32),
    ('red-dead-redemption-2', 'Graphics', 'Tree Quality', 'High', 'visual: Retains tree detail.', 33),
    ('red-dead-redemption-2', 'Graphics', 'Parallax Occlusion Mapping', 'Medium', 'why: Balanced source setting.', 34),
    ('red-dead-redemption-2', 'Graphics', 'Decal Quality', 'Low', 'fps: Reduced decal cost.', 35),
    ('red-dead-redemption-2', 'Graphics', 'Fur Quality', 'Medium', 'why: Balanced source setting.', 36),
    ('red-dead-redemption-2', 'Graphics', 'Tree Tessellation', 'Off', 'fps: Expensive tree tessellation disabled.', 37),

    ('ghost-of-tsushima-directors-cut', 'Device setup', 'VRAM', '6GB', 'default: Source allocation.', 0),
    ('ghost-of-tsushima-directors-cut', 'Display', 'Window Mode', 'Fullscreen', 'default: Source display mode.', 0),
    ('ghost-of-tsushima-directors-cut', 'Display', 'Display Resolution', '1920 × 1200', 'default: Source test resolution.', 1),
    ('ghost-of-tsushima-directors-cut', 'Display', 'VSync', 'Off', 'latency: Disabled in the source configuration.', 2),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Upscale Method', 'FSR 3', 'why: Source upscaler used to target a higher presented frame rate.', 0),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Upscale Quality', 'Balanced', 'why: Source quality mode.', 1),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Dynamic Resolution Scaling', 'Off', 'default: Disabled for the 1200p profile.', 2),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Anti-Aliasing', 'Off', 'why: Upscaler provides temporal reconstruction.', 3),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Frame Generation', 'On', 'fps: Source used frame generation for a 60-FPS presentation target; base FPS was not disclosed.', 4),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Texture Quality', 'High', 'visual: High textures retained with 6GB VRAM.', 5),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Texture Filtering', '16x Anisotropic', 'visual: Improves oblique texture clarity.', 6),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Shadow Quality', 'Low', 'fps: Reduced shadow cost.', 7),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Level of Detail', 'Medium', 'why: Balanced source setting.', 8),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Terrain Detail', 'High', 'visual: Retains terrain definition.', 9),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Volumetric Fog', 'Low', 'fps: Reduced fog cost.', 10),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Depth of Field', 'Off', 'visual: Cleaner image in motion.', 11),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Screen Space Reflections', 'High', 'visual: Source prioritised reflection quality.', 12),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Screen Space Shadows', 'Low', 'fps: Reduced contact-shadow cost.', 13),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Ambient Occlusion', 'SSAO Performance', 'fps: Performance-oriented contact shading.', 14),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Bloom', 'Off', 'visual: Source preference.', 15),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Vignette', 'Off', 'visual: Source preference.', 16),
    ('ghost-of-tsushima-directors-cut', 'Graphics', 'Water Caustics', 'On', 'visual: Retains water-lighting detail.', 17),

    ('diablo-iv', 'Device setup', 'VRAM', '6GB', 'why: Source recommends 6GB to reduce crashes.', 0),
    ('diablo-iv', 'Display', 'Display', 'Fullscreen', 'default: Source display mode.', 0),
    ('diablo-iv', 'Display', 'Resolution', '1920 × 1200', 'default: Source test resolution.', 1),
    ('diablo-iv', 'Display', 'Vertical Sync', 'Off', 'latency: Disabled in the source configuration.', 2),
    ('diablo-iv', 'Display', 'Limit Cutscene FPS', 'On', 'why: Source configuration caps cutscenes.', 3),
    ('diablo-iv', 'Graphics', 'Resolution Scaling', 'AMD FSR 2', 'why: Source upscaling method.', 0),
    ('diablo-iv', 'Graphics', 'Quality Mode', 'Quality', 'visual: Higher-fidelity reconstruction mode.', 1),
    ('diablo-iv', 'Graphics', 'Texture Quality', 'High', 'visual: High textures retained with 6GB VRAM.', 2),
    ('diablo-iv', 'Graphics', 'Anisotropic Filtering', '8x', 'visual: Improves angled texture clarity.', 3),
    ('diablo-iv', 'Graphics', 'Shadow Quality', 'Low', 'fps: Reduced shadow cost.', 4),
    ('diablo-iv', 'Graphics', 'Dynamic Shadows', 'On', 'visual: Retains moving shadows.', 5),
    ('diablo-iv', 'Graphics', 'Soft Shadows', 'On', 'visual: Retains softer shadow edges.', 6),
    ('diablo-iv', 'Graphics', 'Shader Quality', 'Low', 'fps: Reduced shader cost.', 7),
    ('diablo-iv', 'Graphics', 'SSAO Quality', 'Off', 'fps: Ambient occlusion disabled for performance.', 8),
    ('diablo-iv', 'Graphics', 'Fog Quality', 'Low', 'fps: Reduced fog cost.', 9),
    ('diablo-iv', 'Graphics', 'Clutter Quality', 'Low', 'fps: Reduced environmental clutter.', 10),
    ('diablo-iv', 'Graphics', 'Fur Quality Level', 'Low', 'fps: Reduced fur rendering cost.', 11),
    ('diablo-iv', 'Graphics', 'Water Simulation Quality', 'Low', 'fps: Reduced water simulation cost.', 12),
    ('diablo-iv', 'Graphics', 'Anti-Aliasing Quality', 'High', 'visual: Source retained high anti-aliasing.', 13),
    ('diablo-iv', 'Graphics', 'Geometric Complexity', 'Medium', 'why: Balanced geometry detail.', 14),
    ('diablo-iv', 'Graphics', 'Terrain Geometry Detail', 'Low', 'fps: Reduced terrain geometry cost.', 15),
    ('diablo-iv', 'Graphics', 'Physics Quality', 'High', 'visual: Source retained high physics quality.', 16),
    ('diablo-iv', 'Graphics', 'Particles Quality', 'Medium', 'why: Balanced particle quality.', 17),
    ('diablo-iv', 'Graphics', 'Reflection Quality', 'Low', 'fps: Reduced reflection cost.', 18),
    ('diablo-iv', 'Graphics', 'Screen Space Reflections', 'Off', 'fps: Expensive reflections disabled.', 19),
    ('diablo-iv', 'Graphics', 'Distortion', 'On', 'visual: Retains heat and spell distortion.', 20),
    ('diablo-iv', 'Graphics', 'Low FX', 'On', 'fps: Uses reduced-complexity effects.', 21)
  ) settings(game_slug, group_name, label, value, note, sort_order)
    on settings.game_slug = g.slug
  where h.slug = 'lenovo-legion-go-z1-extreme'
    and p.name like 'Legion Go Life % Baseline'
)
insert into public.preset_setting_items (group_id, label, value, note, sort_order)
select groups.id, desired.label, desired.value, desired.note, desired.sort_order
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
