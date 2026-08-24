-- Published external-source presets for the original Lenovo Legion Go Z1 Extreme.
-- Reviewed 2026-08-24. Each preset has a matching gameplay performance capture,
-- exact device/power/resolution context and a complete source settings table.
-- FPS ranges and instantaneous overlay readings stay in prose; scalar average and
-- 1% low columns remain null because the sources do not provide measured values.

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
      'kingdom-come-deliverance-ii',
      'Legion Go Life 1200p Balanced 30W',
      'Balanced'::public.preset_type,
      '1920 × 1200',
      '30W',
      'FSR Balanced',
      'Legion Go Life 1200p baseline for the original Legion Go Z1 Extreme at 30W with 8GB VRAM and FSR Balanced. The source reports a 30–60 FPS operating range across 25–30W gameplay. The linked 30W capture provides visible performance proof; exact average and low-percentile metrics were not measured, so those fields remain blank.',
      'https://legiongolife.com/kingdom-come-deliverance-2-legion-go/',
      'https://legiongolife.com/wp-content/uploads/2025/02/Kingdom-Come-Deliverance-2-Legion-Go-3.png',
      'The source provides a complete 1200p settings table and a matching gameplay capture with a visible 30W overlay. It reports a 30–60 FPS range across 25–30W rather than an exact scalar average and does not provide low-percentile metrics, so those numeric fields remain blank.',
      'Launch-era source; exact build not disclosed',
      'Not disclosed by source'
    ),
    (
      'hades-ii',
      'Legion Go Life Native 1600p 13W',
      'Battery'::public.preset_type,
      '2560 × 1600',
      '13W',
      'None (native)',
      'Legion Go Life native-1600p baseline for the original Legion Go Z1 Extreme at 13W with 6GB VRAM and the High preset. The source reports performance above 60 FPS, and the linked capture visibly shows the 13W profile and live performance overlay. Exact average and low-percentile metrics were not measured and remain blank.',
      'https://legiongolife.com/hades-2-legion-go-game-settings/',
      'https://legiongolife.com/wp-content/uploads/2024/05/Hades-2-Legion-Go-2.png',
      'The source provides the complete native-1600p configuration and a gameplay capture showing the 13W profile, Early Access v0.90279 and a live 74 FPS overlay. That overlay is an instantaneous reading rather than a measured average, and no low-percentile metrics are supplied, so those fields remain blank.',
      'Early Access v0.90279 (visible in capture)',
      'Not disclosed by source'
    ),
    (
      'cyberpunk-2077',
      'Legion Go Life 800p Integer Scaling 30W',
      'Performance'::public.preset_type,
      '1280 × 800',
      '30W',
      'Integer Scaling; in-game scaling Off',
      'Legion Go Life 800p baseline for the original Legion Go Z1 Extreme at 30W with 6GB VRAM and system integer scaling. The source reports a 45–60 FPS range. The linked 30W gameplay capture supplies visible performance proof; no exact scalar average or low-percentile metrics were measured, so those fields remain blank.',
      'https://legiongolife.com/cyberpunk-2077-legion-go-game-settings/',
      'https://legiongolife.com/wp-content/uploads/2023/12/Cyberpunk-2077-Legion-Go-1.png',
      'The source provides a complete 800p settings table and matching gameplay captures with visible 30W overlays. It reports a 45–60 FPS range rather than a single measured average and does not provide low-percentile metrics, so those numeric fields remain blank.',
      'Exact build not disclosed; source published 2023-12-24',
      'Not disclosed by source'
    )
  ) source(
    game_slug,
    preset_name,
    preset_type,
    resolution,
    tdp,
    upscaler,
    summary,
    source_url,
    artifact_url,
    exception_reason,
    game_version,
    driver_version
  )
  join public.games game on game.slug = source.game_slug
  join public.handhelds handheld on handheld.slug = 'lenovo-legion-go-z1-extreme'
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
  tdp,
  upscaler,
  summary,
  'published'::public.content_status,
  editor_id,
  timestamptz '2026-08-24 19:05:00+02',
  false,
  'external_source',
  'Legion Go Life',
  source_url,
  date '2026-08-24',
  game_version,
  driver_version,
  'Windows; exact build not disclosed',
  'performance_screenshot',
  artifact_url,
  true,
  exception_reason,
  timestamptz '2026-08-24 19:05:00+02',
  editor_id
from source_rows
where not exists (
  select 1
  from public.presets existing
  where existing.game_id = source_rows.game_id
    and existing.handheld_id = source_rows.handheld_id
    and existing.name = source_rows.preset_name
);

-- Reconcile an interrupted earlier run without creating duplicate records.
with editor as (
  select id
  from public.profiles
  where role in ('admin', 'atlas_editor')
  order by case when role = 'admin' then 0 else 1 end, created_at
  limit 1
), reviewed as (
  select *
  from (values
    (
      'kingdom-come-deliverance-ii',
      'Legion Go Life 1200p Balanced 30W',
      'https://legiongolife.com/kingdom-come-deliverance-2-legion-go/',
      'https://legiongolife.com/wp-content/uploads/2025/02/Kingdom-Come-Deliverance-2-Legion-Go-3.png',
      'The source provides a complete 1200p settings table and a matching gameplay capture with a visible 30W overlay. It reports a 30–60 FPS range across 25–30W rather than an exact scalar average and does not provide low-percentile metrics, so those numeric fields remain blank.',
      'Launch-era source; exact build not disclosed'
    ),
    (
      'hades-ii',
      'Legion Go Life Native 1600p 13W',
      'https://legiongolife.com/hades-2-legion-go-game-settings/',
      'https://legiongolife.com/wp-content/uploads/2024/05/Hades-2-Legion-Go-2.png',
      'The source provides the complete native-1600p configuration and a gameplay capture showing the 13W profile, Early Access v0.90279 and a live 74 FPS overlay. That overlay is an instantaneous reading rather than a measured average, and no low-percentile metrics are supplied, so those fields remain blank.',
      'Early Access v0.90279 (visible in capture)'
    ),
    (
      'cyberpunk-2077',
      'Legion Go Life 800p Integer Scaling 30W',
      'https://legiongolife.com/cyberpunk-2077-legion-go-game-settings/',
      'https://legiongolife.com/wp-content/uploads/2023/12/Cyberpunk-2077-Legion-Go-1.png',
      'The source provides a complete 800p settings table and matching gameplay captures with visible 30W overlays. It reports a 45–60 FPS range rather than a single measured average and does not provide low-percentile metrics, so those numeric fields remain blank.',
      'Exact build not disclosed; source published 2023-12-24'
    )
  ) values_table(game_slug, preset_name, source_url, artifact_url, exception_reason, game_version)
)
update public.presets preset
set
  status = 'published'::public.content_status,
  published_at = coalesce(preset.published_at, timestamptz '2026-08-24 19:05:00+02'),
  atlas_verified = false,
  evidence_tier = 'external_source',
  source_name = 'Legion Go Life',
  source_url = reviewed.source_url,
  source_checked_at = date '2026-08-24',
  game_version = reviewed.game_version,
  driver_version = 'Not disclosed by source',
  os_version = 'Windows; exact build not disclosed',
  evidence_artifact_type = 'performance_screenshot',
  evidence_artifact_url = reviewed.artifact_url,
  evidence_exception_approved = true,
  evidence_exception_reason = reviewed.exception_reason,
  evidence_exception_approved_at = timestamptz '2026-08-24 19:05:00+02',
  evidence_exception_approved_by = editor.id,
  updated_at = now()
from reviewed
join public.games game on game.slug = reviewed.game_slug
join public.handhelds handheld on handheld.slug = 'lenovo-legion-go-z1-extreme'
cross join editor
where preset.game_id = game.id
  and preset.handheld_id = handheld.id
  and preset.name = reviewed.preset_name;

with desired_groups as (
  select preset.id as preset_id, groups.name, groups.sort_order
  from public.presets preset
  join public.games game on game.id = preset.game_id
  join public.handhelds handheld on handheld.id = preset.handheld_id
  join (values
    ('kingdom-come-deliverance-ii', 'Device setup', 0),
    ('kingdom-come-deliverance-ii', 'Display', 1),
    ('kingdom-come-deliverance-ii', 'Graphics', 2),
    ('hades-ii', 'Device setup', 0),
    ('hades-ii', 'Display', 1),
    ('hades-ii', 'Graphics', 2),
    ('cyberpunk-2077', 'Device setup', 0),
    ('cyberpunk-2077', 'Display', 1),
    ('cyberpunk-2077', 'Graphics', 2)
  ) groups(game_slug, name, sort_order) on groups.game_slug = game.slug
  where handheld.slug = 'lenovo-legion-go-z1-extreme'
    and preset.name in (
      'Legion Go Life 1200p Balanced 30W',
      'Legion Go Life Native 1600p 13W',
      'Legion Go Life 800p Integer Scaling 30W'
    )
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
    ('kingdom-come-deliverance-ii', 'Device setup', 'VRAM', '8GB', 'default: Source allocation.', 0),
    ('kingdom-come-deliverance-ii', 'Display', 'Resolution', '1920 × 1200', 'default: Source test resolution.', 0),
    ('kingdom-come-deliverance-ii', 'Display', 'Window Mode', 'Fullscreen', 'default: Source display mode.', 1),
    ('kingdom-come-deliverance-ii', 'Display', 'VSync', 'On', 'default: Source configuration.', 2),
    ('kingdom-come-deliverance-ii', 'Display', 'Framerate Limit', '144 FPS', 'default: Source cap.', 3),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Technology', 'FSR', 'fps: Source upscaling method.', 0),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Mode', 'Balanced', 'why: Source reconstruction mode.', 1),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Motion Blur', 'Camera', 'default: Source motion-blur mode.', 2),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Near DOF', 'On', 'visual: Retains near depth of field.', 3),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Antialiasing', 'Disabled', 'why: Temporal reconstruction is handled by FSR.', 4),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Object Quality', 'Medium', 'why: Balanced source setting.', 5),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Particles', 'Medium', 'why: Balanced source setting.', 6),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Lighting', 'Medium', 'why: Balanced source setting.', 7),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Global Illumination', 'Medium', 'why: Balanced source setting.', 8),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Postprocess Quality', 'High', 'visual: Source retains higher post-processing quality.', 9),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Shader Quality', 'High', 'visual: Source retains higher shader quality.', 10),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Shadows', 'Low', 'fps: Reduced shadow cost.', 11),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Textures', 'High', 'visual: High textures retained with 8GB VRAM.', 12),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Volumetric Effects Detail', 'Medium', 'why: Balanced source setting.', 13),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Vegetation Detail', 'Medium', 'why: Balanced source setting.', 14),
    ('kingdom-come-deliverance-ii', 'Graphics', 'Character Detail', 'High', 'visual: Source prioritises character detail.', 15),

    ('hades-ii', 'Device setup', 'VRAM', '6GB', 'default: Source allocation.', 0),
    ('hades-ii', 'Display', 'Resolution', '2560 × 1600', 'default: Native panel resolution used by the source.', 0),
    ('hades-ii', 'Display', 'Fullscreen', 'On', 'default: Source display mode.', 1),
    ('hades-ii', 'Display', 'VSync', 'Off', 'latency: Disabled in the source configuration.', 2),
    ('hades-ii', 'Graphics', 'Quality', 'High', 'visual: Source quality preset.', 0),

    ('cyberpunk-2077', 'Device setup', 'VRAM', '6GB', 'default: Source allocation.', 0),
    ('cyberpunk-2077', 'Device setup', 'Integer Scaling', 'Enabled', 'visual: Source uses system integer scaling for 800p output on the 1600p panel.', 1),
    ('cyberpunk-2077', 'Display', 'VSync', 'Off', 'latency: Disabled in the source configuration.', 0),
    ('cyberpunk-2077', 'Display', 'Maximum FPS', 'On', 'default: Source cap is enabled.', 1),
    ('cyberpunk-2077', 'Display', 'Maximum FPS Value', '144', 'default: Source cap value.', 2),
    ('cyberpunk-2077', 'Display', 'Windowed Mode', 'Fullscreen', 'default: Source display mode.', 3),
    ('cyberpunk-2077', 'Display', 'Resolution', '1280 × 800', 'default: Source render resolution.', 4),
    ('cyberpunk-2077', 'Display', 'HDR Mode', 'None', 'default: HDR disabled in the source configuration.', 5),
    ('cyberpunk-2077', 'Graphics', 'Resolution Scaling', 'Off', 'visual: Native 800p render target before system integer scaling.', 0),
    ('cyberpunk-2077', 'Graphics', 'Texture Quality', 'High', 'visual: High textures retained with 6GB VRAM.', 1),
    ('cyberpunk-2077', 'Graphics', 'Ray Tracing', 'Off', 'fps: Ray tracing disabled for handheld performance.', 2),
    ('cyberpunk-2077', 'Graphics', 'Crowd Density', 'Low', 'fps: Reduced CPU load in dense areas.', 3),
    ('cyberpunk-2077', 'Graphics', 'Film Grain', 'Off', 'visual: Cleaner presentation.', 4),
    ('cyberpunk-2077', 'Graphics', 'Chromatic Aberration', 'Off', 'visual: Cleaner presentation.', 5),
    ('cyberpunk-2077', 'Graphics', 'Depth of Field', 'Off', 'visual: Cleaner presentation.', 6),
    ('cyberpunk-2077', 'Graphics', 'Lens Flare', 'Off', 'visual: Source preference.', 7),
    ('cyberpunk-2077', 'Graphics', 'Motion Blur', 'Off', 'visual: Cleaner motion presentation.', 8),
    ('cyberpunk-2077', 'Graphics', 'Contact Shadows', 'On', 'visual: Retains local contact shading.', 9),
    ('cyberpunk-2077', 'Graphics', 'Improved Facial Lighting', 'On', 'visual: Retains improved face lighting.', 10),
    ('cyberpunk-2077', 'Graphics', 'Anisotropy', '8', 'visual: Improves oblique texture clarity.', 11),
    ('cyberpunk-2077', 'Graphics', 'Local Shadow Mesh', 'High', 'visual: Retains local shadow geometry.', 12),
    ('cyberpunk-2077', 'Graphics', 'Local Shadow Quality', 'Low', 'fps: Reduced local shadow cost.', 13),
    ('cyberpunk-2077', 'Graphics', 'Cascaded Shadows Range', 'Low', 'fps: Reduced distant shadow range.', 14),
    ('cyberpunk-2077', 'Graphics', 'Cascaded Shadows Resolution', 'Medium', 'why: Balanced source setting.', 15),
    ('cyberpunk-2077', 'Graphics', 'Distant Shadows Resolution', 'High', 'visual: Source retains distant shadow definition.', 16),
    ('cyberpunk-2077', 'Graphics', 'Volumetric Fog Resolution', 'Low', 'fps: Reduced volumetric fog cost.', 17),
    ('cyberpunk-2077', 'Graphics', 'Volumetric Cloud Quality', 'Off', 'fps: Volumetric clouds disabled.', 18),
    ('cyberpunk-2077', 'Graphics', 'Max Dynamic Decals', 'Ultra', 'visual: Source retains decal density.', 19),
    ('cyberpunk-2077', 'Graphics', 'Screen Space Reflections Quality', 'Low', 'fps: Reduced reflection cost.', 20),
    ('cyberpunk-2077', 'Graphics', 'Subsurface Scattering Quality', 'Medium', 'why: Balanced source setting.', 21),
    ('cyberpunk-2077', 'Graphics', 'Ambient Occlusion', 'Medium', 'why: Balanced source setting.', 22),
    ('cyberpunk-2077', 'Graphics', 'Color Precision', 'Medium', 'why: Balanced source setting.', 23),
    ('cyberpunk-2077', 'Graphics', 'Mirror Quality', 'Low', 'fps: Reduced mirror rendering cost.', 24),
    ('cyberpunk-2077', 'Graphics', 'Level Of Detail (LOD)', 'High', 'visual: Source retains object detail.', 25)
  ) settings(game_slug, group_name, label, value, note, sort_order)
    on settings.game_slug = game.slug
  where handheld.slug = 'lenovo-legion-go-z1-extreme'
    and preset.name in (
      'Legion Go Life 1200p Balanced 30W',
      'Legion Go Life Native 1600p 13W',
      'Legion Go Life 800p Integer Scaling 30W'
    )
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

do $$
begin
  if (
    select count(*)
    from public.presets preset
    join public.games game on game.id = preset.game_id
    join public.handhelds handheld on handheld.id = preset.handheld_id
    where handheld.slug = 'lenovo-legion-go-z1-extreme'
      and game.slug in ('kingdom-come-deliverance-ii', 'hades-ii', 'cyberpunk-2077')
      and preset.name in (
        'Legion Go Life 1200p Balanced 30W',
        'Legion Go Life Native 1600p 13W',
        'Legion Go Life 800p Integer Scaling 30W'
      )
      and preset.status = 'published'
      and preset.evidence_tier = 'external_source'
      and preset.atlas_verified = false
      and preset.evidence_exception_approved = true
      and preset.evidence_artifact_type = 'performance_screenshot'
  ) <> 3 then
    raise exception 'Expected all three reviewed Legion Go presets to be published with screenshot evidence';
  end if;
end
$$;

commit;
