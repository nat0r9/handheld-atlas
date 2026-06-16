-- HandheldAtlas Phase 8 expansion — comprehensive settings vocabulary
-- Run after supabase/settings-impact-phase8.sql.
-- Idempotent: new rows are inserted only when their slug is missing.

-- Taxonomy references used to define the cross-game vocabulary:
-- Epic Games Unreal Engine scalability, anti-aliasing, Lumen, Nanite and shadow documentation.
-- Unity HDRP feature, frame-settings, AO and reflection documentation.
-- NVIDIA DLSS and Reflex developer documentation.
-- AMD GPUOpen FSR and Variable Rate Shading documentation.
--
-- The 0-5 impact values below remain HandheldAtlas editorial estimates.
-- They are not presented as measured results for a specific game. Game-specific
-- evidence belongs in public.game_setting_impacts with a reproducible source.


alter table public.setting_impact_entries
add column if not exists commonness text not null default 'common';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'setting_impact_entries_commonness_check'
      and conrelid = 'public.setting_impact_entries'::regclass
  ) then
    alter table public.setting_impact_entries
      add constraint setting_impact_entries_commonness_check
      check (commonness in ('common', 'advanced', 'specialized'));
  end if;
end;
$$;

create index if not exists setting_impact_entries_commonness_idx
on public.setting_impact_entries(commonness, status, name);

update public.setting_impact_entries
set commonness = case slug
  when 'resolution' then 'common'
  when 'render-scale' then 'common'
  when 'upscaling-mode' then 'common'
  when 'frame-generation' then 'common'
  when 'texture-quality' then 'common'
  when 'texture-streaming-budget' then 'advanced'
  when 'anisotropic-filtering' then 'common'
  when 'shadow-quality' then 'common'
  when 'contact-shadows' then 'advanced'
  when 'ambient-occlusion' then 'common'
  when 'global-illumination' then 'advanced'
  when 'volumetric-quality' then 'common'
  when 'screen-space-reflections' then 'common'
  when 'reflection-quality' then 'common'
  when 'view-distance' then 'common'
  when 'crowd-density' then 'common'
  when 'foliage-quality' then 'common'
  when 'geometry-quality' then 'common'
  when 'effects-quality' then 'common'
  when 'particle-quality' then 'common'
  when 'hair-quality' then 'advanced'
  when 'anti-aliasing' then 'common'
  when 'post-processing-quality' then 'common'
  when 'motion-blur' then 'common'
  when 'depth-of-field' then 'common'
  when 'bloom' then 'common'
  when 'ray-tracing' then 'common'
  when 'ray-traced-reflections' then 'advanced'
  when 'ray-traced-lighting' then 'advanced'
  when 'v-sync' then 'common'
  when 'frame-rate-limit' then 'common'
  when 'chromatic-aberration' then 'common'
  when 'film-grain' then 'common'
  else commonness
end
where slug in ('resolution', 'render-scale', 'upscaling-mode', 'frame-generation', 'texture-quality', 'texture-streaming-budget', 'anisotropic-filtering', 'shadow-quality', 'contact-shadows', 'ambient-occlusion', 'global-illumination', 'volumetric-quality', 'screen-space-reflections', 'reflection-quality', 'view-distance', 'crowd-density', 'foliage-quality', 'geometry-quality', 'effects-quality', 'particle-quality', 'hair-quality', 'anti-aliasing', 'post-processing-quality', 'motion-blur', 'depth-of-field', 'bloom', 'ray-tracing', 'ray-traced-reflections', 'ray-traced-lighting', 'v-sync', 'frame-rate-limit', 'chromatic-aberration', 'film-grain');

insert into public.setting_impact_entries (
  slug, name, category, commonness, summary, description,
  performance_impact, visual_impact, vram_impact, cpu_impact, latency_impact,
  restart_required, when_to_lower, when_to_keep_high, handheld_advice, caveat,
  confidence, atlas_verified, status
) values
  ('dynamic-resolution', 'Dynamic Resolution', 'Display', 'common', 'Automatically changes internal resolution to protect a target frame rate.', 'Automatically changes internal resolution to protect a target frame rate. It reacts to load instead of using one fixed render scale.', 4, 3, 1, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'It reacts to load instead of using one fixed render scale. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('display-mode', 'Display Mode', 'Display', 'common', 'Chooses fullscreen, borderless or windowed presentation.', 'Chooses fullscreen, borderless or windowed presentation. Exclusive fullscreen can behave differently from borderless depending on the game and Windows version.', 1, 0, 0, 1, 1, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Exclusive fullscreen can behave differently from borderless depending on the game and Windows version. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('refresh-rate', 'Refresh Rate', 'Display', 'common', 'Sets how many times the display can update each second.', 'Sets how many times the display can update each second. A higher refresh rate only helps when the panel and frame delivery can use it.', 0, 0, 0, 0, 2, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'A higher refresh rate only helps when the panel and frame delivery can use it. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('aspect-ratio', 'Aspect Ratio', 'Display', 'advanced', 'Controls the width-to-height shape of the rendered image.', 'Controls the width-to-height shape of the rendered image. Non-native ratios may crop, stretch or add black bars.', 1, 4, 1, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Non-native ratios may crop, stretch or add black bars. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('field-of-view', 'Field of View', 'Display', 'common', 'Changes how much of the world is visible around the camera.', 'Changes how much of the world is visible around the camera. A wider view can render more objects and reduce perceived zoom.', 2, 4, 1, 2, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'A wider view can render more objects and reduce perceived zoom. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('hdr-output', 'HDR Output', 'Display', 'advanced', 'Enables high-dynamic-range output for brighter highlights and wider color.', 'Enables high-dynamic-range output for brighter highlights and wider color. HDR quality depends heavily on the display, calibration and the game implementation.', 1, 4, 1, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'HDR quality depends heavily on the display, calibration and the game implementation. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('brightness-gamma', 'Brightness / Gamma', 'Display', 'common', 'Adjusts image brightness or mid-tone response without meaningfully changing performance.', 'Adjusts image brightness or mid-tone response without meaningfully changing performance. This is a visibility and calibration control, not an FPS setting.', 0, 3, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'This is a visibility and calibration control, not an FPS setting. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('variable-refresh-rate', 'Variable Refresh Rate', 'Frame pacing', 'common', 'Lets the display follow the game frame rate within its supported range.', 'Lets the display follow the game frame rate within its supported range. It reduces tearing and judder but does not create extra rendered frames.', 0, 1, 0, 0, 3, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It reduces tearing and judder but does not create extra rendered frames. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('triple-buffering', 'Triple Buffering', 'Frame pacing', 'advanced', 'Adds another presentation buffer to smooth some V-Sync drops at the cost of memory and latency.', 'Adds another presentation buffer to smooth some V-Sync drops at the cost of memory and latency. Its behavior differs between APIs and engines.', 0, 0, 1, 0, 3, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Its behavior differs between APIs and engines. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('low-latency-mode', 'Low Latency Mode', 'Frame pacing', 'common', 'Reduces queued rendering work to improve control response.', 'Reduces queued rendering work to improve control response. It mainly changes latency and CPU/GPU queue behavior rather than raw image quality.', 0, 0, 0, 1, 5, false, 'Change or disable it when controls feel delayed, frame pacing is unstable, or responsiveness matters more than presentation.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'On handhelds with VRR, compare responsiveness and frame pacing at a stable cap instead of chasing the largest FPS counter.', 'It mainly changes latency and CPU/GPU queue behavior rather than raw image quality. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('reduced-buffering', 'Reduced Buffering', 'Frame pacing', 'advanced', 'Limits render-ahead buffering to improve responsiveness.', 'Limits render-ahead buffering to improve responsiveness. Aggressive buffering limits can expose stutter in unstable workloads.', 0, 0, 0, 1, 4, false, 'Change or disable it when controls feel delayed, frame pacing is unstable, or responsiveness matters more than presentation.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'On handhelds with VRR, compare responsiveness and frame pacing at a stable cap instead of chasing the largest FPS counter.', 'Aggressive buffering limits can expose stutter in unstable workloads. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('graphics-api', 'Graphics API', 'Other', 'advanced', 'Selects a renderer such as DirectX 11, DirectX 12 or Vulkan.', 'Selects a renderer such as DirectX 11, DirectX 12 or Vulkan. The best option depends on drivers, shader compilation and engine support.', 2, 0, 1, 2, 1, true, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'The best option depends on drivers, shader compilation and engine support. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('upscaling-sharpness', 'Upscaling Sharpness', 'Upscaling', 'common', 'Controls the sharpening applied after an upscaler reconstructs the image.', 'Controls the sharpening applied after an upscaler reconstructs the image. Too much sharpness can create halos, shimmer and exaggerated grain.', 0, 3, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Too much sharpness can create halos, shimmer and exaggerated grain. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('multi-frame-generation', 'Multi Frame Generation', 'Upscaling', 'specialized', 'Generates multiple displayed frames between traditionally rendered frames.', 'Generates multiple displayed frames between traditionally rendered frames. Displayed FPS can rise sharply while base-frame latency and simulation rate remain tied to rendered frames.', 5, 2, 2, 1, 5, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Displayed FPS can rise sharply while base-frame latency and simulation rate remain tied to rendered frames. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('ray-reconstruction', 'Ray Reconstruction', 'Ray tracing', 'specialized', 'Uses a reconstruction model to replace or improve ray-tracing denoisers.', 'Uses a reconstruction model to replace or improve ray-tracing denoisers. It can improve traced detail and stability, but support and cost vary by game.', 2, 4, 2, 1, 1, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It can improve traced detail and stability, but support and cost vary by game. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('taa-quality', 'Temporal Anti-Aliasing Quality', 'Anti-aliasing', 'advanced', 'Changes the quality of temporal anti-aliasing and its history reconstruction.', 'Changes the quality of temporal anti-aliasing and its history reconstruction. Higher quality can reduce shimmer but may add blur or ghosting.', 2, 4, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Higher quality can reduce shimmer but may add blur or ghosting. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('fxaa', 'FXAA', 'Anti-aliasing', 'advanced', 'Uses a fast post-process pass to smooth visible edges.', 'Uses a fast post-process pass to smooth visible edges. It is cheap but can soften fine texture detail.', 1, 2, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It is cheap but can soften fine texture detail. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('smaa', 'SMAA', 'Anti-aliasing', 'advanced', 'Uses morphological edge detection for cleaner edges with a modest cost.', 'Uses morphological edge detection for cleaner edges with a modest cost. Quality depends on whether the game uses basic SMAA or a temporal variant.', 1, 3, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Quality depends on whether the game uses basic SMAA or a temporal variant. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('msaa', 'MSAA', 'Anti-aliasing', 'advanced', 'Samples polygon edges multiple times and can be expensive at high sample counts.', 'Samples polygon edges multiple times and can be expensive at high sample counts. It works best in forward-rendered games and may not clean shader aliasing.', 4, 4, 3, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'It works best in forward-rendered games and may not clean shader aliasing. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('supersampling', 'Supersampling', 'Anti-aliasing', 'specialized', 'Renders above output resolution and downsamples for very high image quality.', 'Renders above output resolution and downsamples for very high image quality. It is one of the heaviest ways to improve image quality.', 5, 5, 4, 1, 0, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On shared-memory handhelds, judge this by stutter and texture streaming as well as average FPS.', 'It is one of the heaviest ways to improve image quality. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('dlaa-native-aa', 'Native-Resolution AI Anti-Aliasing', 'Anti-aliasing', 'advanced', 'Uses an upscaler''s reconstruction model at native resolution instead of increasing FPS.', 'Uses an upscaler''s reconstruction model at native resolution instead of increasing FPS. It prioritizes image quality and usually costs more than quality-mode upscaling.', 2, 5, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It prioritizes image quality and usually costs more than quality-mode upscaling. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('temporal-upscaling', 'Temporal Upscaling Quality', 'Upscaling', 'advanced', 'Controls temporal reconstruction quality beyond the basic quality-mode selector.', 'Controls temporal reconstruction quality beyond the basic quality-mode selector. Higher modes spend more GPU time improving stability and detail.', 3, 4, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Higher modes spend more GPU time improving stability and detail. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('image-sharpening', 'Image Sharpening', 'Post-processing', 'common', 'Adds edge contrast after rendering or upscaling to restore perceived detail.', 'Adds edge contrast after rendering or upscaling to restore perceived detail. Sharpening cannot recover real detail and can amplify noise.', 1, 3, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Sharpening cannot recover real detail and can amplify noise. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('variable-rate-shading', 'Variable Rate Shading', 'Other', 'specialized', 'Reduces shading work in less noticeable regions of the image.', 'Reduces shading work in less noticeable regions of the image. Image impact depends on how aggressively the game groups pixels.', 2, 2, 0, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Image impact depends on how aggressively the game groups pixels. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('foveated-rendering', 'Foveated Rendering', 'Other', 'specialized', 'Reduces detail away from the focus region, most often in VR or handheld-specific modes.', 'Reduces detail away from the focus region, most often in VR or handheld-specific modes. Visible peripheral softness depends on the display and tracking method.', 3, 3, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Visible peripheral softness depends on the display and tracking method. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('texture-filtering-quality', 'Texture Filtering Quality', 'Textures', 'advanced', 'Changes filtering precision and optimization for sampled textures.', 'Changes filtering precision and optimization for sampled textures. Driver and game-level filtering controls can overlap.', 1, 2, 1, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Driver and game-level filtering controls can overlap. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('material-quality', 'Material Quality', 'Materials', 'advanced', 'Controls the complexity and precision of surface materials and shaders.', 'Controls the complexity and precision of surface materials and shaders. It may bundle reflections, subsurface effects and shader features.', 3, 4, 2, 1, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It may bundle reflections, subsurface effects and shader features. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('shader-quality', 'Shader Quality', 'Materials', 'advanced', 'Changes the complexity or precision of lighting and material shader programs.', 'Changes the complexity or precision of lighting and material shader programs. A restart or shader recompilation may be required in some games.', 3, 4, 1, 1, 0, true, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'A restart or shader recompilation may be required in some games. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('parallax-occlusion-mapping', 'Parallax Occlusion Mapping', 'Materials', 'specialized', 'Creates apparent surface depth without adding real geometry.', 'Creates apparent surface depth without adding real geometry. It is most noticeable on brick, stone and terrain surfaces.', 3, 4, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It is most noticeable on brick, stone and terrain surfaces. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('tessellation', 'Tessellation', 'Materials', 'advanced', 'Subdivides surfaces so displacement and curvature can use more geometry.', 'Subdivides surfaces so displacement and curvature can use more geometry. Cost rises with scene coverage and subdivision level.', 4, 4, 2, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Cost rises with scene coverage and subdivision level. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('displacement-quality', 'Displacement Quality', 'Materials', 'specialized', 'Moves surface geometry to create real depth and silhouette changes.', 'Moves surface geometry to create real depth and silhouette changes. Some engines combine it with tessellation or virtualized geometry.', 4, 5, 2, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Some engines combine it with tessellation or virtualized geometry. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('decal-quality', 'Decal Quality', 'Effects', 'common', 'Controls bullet marks, dirt, blood, scorch marks and projected surface details.', 'Controls bullet marks, dirt, blood, scorch marks and projected surface details. High counts can increase memory use and cost in busy scenes.', 2, 3, 2, 1, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'High counts can increase memory use and cost in busy scenes. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('terrain-texture-quality', 'Terrain Texture Quality', 'Textures', 'advanced', 'Controls the sharpness and streaming quality of large landscape textures.', 'Controls the sharpness and streaming quality of large landscape textures. Open-world traversal can expose streaming limits more than static benchmarks.', 2, 4, 4, 1, 0, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On shared-memory handhelds, judge this by stutter and texture streaming as well as average FPS.', 'Open-world traversal can expose streaming limits more than static benchmarks. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('subsurface-scattering', 'Subsurface Scattering', 'Materials', 'advanced', 'Simulates light passing through skin, wax and other translucent materials.', 'Simulates light passing through skin, wax and other translucent materials. It is most visible on faces and close-up materials.', 3, 4, 2, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It is most visible on faces and close-up materials. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('skin-shading-quality', 'Skin Shading Quality', 'Materials', 'advanced', 'Controls character skin lighting, pores and shading detail.', 'Controls character skin lighting, pores and shading detail. It often overlaps with subsurface scattering and character quality.', 2, 4, 2, 1, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It often overlaps with subsurface scattering and character quality. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('translucency-quality', 'Translucency Quality', 'Materials', 'advanced', 'Controls transparent and semi-transparent surfaces such as glass, smoke and particles.', 'Controls transparent and semi-transparent surfaces such as glass, smoke and particles. Overdraw can make this expensive when many layers overlap.', 3, 4, 2, 1, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Overdraw can make this expensive when many layers overlap. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('refraction-quality', 'Refraction Quality', 'Materials', 'advanced', 'Controls how glass, water and heat distortion bend the background.', 'Controls how glass, water and heat distortion bend the background. Screen-space implementations may miss off-screen objects.', 2, 3, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Screen-space implementations may miss off-screen objects. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('shadow-resolution', 'Shadow Resolution', 'Shadows', 'advanced', 'Sets the pixel detail of shadow maps.', 'Sets the pixel detail of shadow maps. Higher values reduce blocky edges but use more memory and bandwidth.', 3, 4, 3, 1, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Higher values reduce blocky edges but use more memory and bandwidth. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('shadow-distance', 'Shadow Distance', 'Shadows', 'common', 'Controls how far detailed dynamic shadows remain visible.', 'Controls how far detailed dynamic shadows remain visible. Long distances can stress both CPU scene submission and GPU shadow rendering.', 4, 3, 2, 3, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Long distances can stress both CPU scene submission and GPU shadow rendering. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('shadow-filtering', 'Shadow Filtering', 'Shadows', 'advanced', 'Changes edge softness and the quality of shadow sampling.', 'Changes edge softness and the quality of shadow sampling. Softness and sample counts can differ greatly between engines.', 2, 3, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Softness and sample counts can differ greatly between engines. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('virtual-shadow-maps', 'Virtual Shadow Maps', 'Shadows', 'specialized', 'Uses virtualized high-resolution shadow pages for detailed large scenes.', 'Uses virtualized high-resolution shadow pages for detailed large scenes. It can look excellent but may create cache and memory pressure in complex scenes.', 4, 5, 4, 2, 0, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On shared-memory handhelds, judge this by stutter and texture streaming as well as average FPS.', 'It can look excellent but may create cache and memory pressure in complex scenes. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('cascaded-shadows', 'Cascaded Shadow Maps', 'Shadows', 'advanced', 'Splits directional-light shadows into distance ranges around the camera.', 'Splits directional-light shadows into distance ranges around the camera. More cascades improve distant detail but add rendering work.', 3, 4, 2, 2, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'More cascades improve distant detail but add rendering work. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('local-light-shadows', 'Local Light Shadows', 'Shadows', 'advanced', 'Controls shadows cast by lamps, torches and other local lights.', 'Controls shadows cast by lamps, torches and other local lights. Many shadow-casting lights can crush frame times in dense scenes.', 4, 4, 2, 3, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Many shadow-casting lights can crush frame times in dense scenes. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('lighting-quality', 'Lighting Quality', 'Lighting', 'common', 'Bundles the quality of direct lights, lightmaps and lighting calculations.', 'Bundles the quality of direct lights, lightmaps and lighting calculations. The option can control very different features in different engines.', 4, 5, 2, 2, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'The option can control very different features in different engines. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('dynamic-light-count', 'Dynamic Light Count', 'Lighting', 'advanced', 'Limits how many dynamic lights affect the scene at once.', 'Limits how many dynamic lights affect the scene at once. Busy interiors and effects-heavy fights reveal the cost most clearly.', 4, 4, 1, 3, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Busy interiors and effects-heavy fights reveal the cost most clearly. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('indirect-lighting-quality', 'Indirect Lighting Quality', 'Lighting', 'advanced', 'Controls the quality of bounced light and indirect illumination.', 'Controls the quality of bounced light and indirect illumination. It may refer to baked lightmaps, probes or real-time GI depending on the game.', 4, 5, 2, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'It may refer to baked lightmaps, probes or real-time GI depending on the game. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('lumen-global-illumination', 'Lumen Global Illumination', 'Lighting', 'specialized', 'Uses Unreal Engine''s dynamic global-illumination system for bounced light.', 'Uses Unreal Engine''s dynamic global-illumination system for bounced light. Software and hardware Lumen have different costs and quality.', 5, 5, 4, 2, 0, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On shared-memory handhelds, judge this by stutter and texture streaming as well as average FPS.', 'Software and hardware Lumen have different costs and quality. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('volumetric-lighting', 'Volumetric Lighting', 'Lighting', 'common', 'Adds light scattering through fog, dust and air.', 'Adds light scattering through fog, dust and air. Resolution and sample count strongly affect the cost.', 4, 4, 2, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Resolution and sample count strongly affect the cost. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('volumetric-fog', 'Volumetric Fog', 'Lighting', 'common', 'Simulates depth-aware fog that receives lighting and shadows.', 'Simulates depth-aware fog that receives lighting and shadows. It can be much heavier than simple distance fog.', 4, 4, 2, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'It can be much heavier than simple distance fog. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('volumetric-clouds', 'Volumetric Clouds', 'Lighting', 'advanced', 'Renders three-dimensional clouds with lighting and weather response.', 'Renders three-dimensional clouds with lighting and weather response. Sky-heavy scenes can make this one of the largest GPU costs.', 4, 5, 3, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Sky-heavy scenes can make this one of the largest GPU costs. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('light-shafts', 'Light Shafts', 'Lighting', 'common', 'Adds visible rays or shafts around strong light sources.', 'Adds visible rays or shafts around strong light sources. Some games implement it as a cheap screen-space effect; others use volumetrics.', 2, 3, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Some games implement it as a cheap screen-space effect; others use volumetrics. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('planar-reflections', 'Planar Reflections', 'Reflections', 'specialized', 'Renders a mirrored view for flat reflective surfaces.', 'Renders a mirrored view for flat reflective surfaces. It can effectively render much of the scene a second time.', 5, 5, 4, 2, 0, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On shared-memory handhelds, judge this by stutter and texture streaming as well as average FPS.', 'It can effectively render much of the scene a second time. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('reflection-probes', 'Reflection Probes', 'Reflections', 'advanced', 'Controls precomputed or periodically updated cubemap reflections.', 'Controls precomputed or periodically updated cubemap reflections. Update frequency matters more than static probe resolution in some games.', 2, 3, 3, 1, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Update frequency matters more than static probe resolution in some games. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('water-reflections', 'Water Reflections', 'Reflections', 'common', 'Controls reflections rendered on rivers, lakes and oceans.', 'Controls reflections rendered on rivers, lakes and oceans. Planar, screen-space and probe methods have very different costs.', 4, 4, 3, 1, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Planar, screen-space and probe methods have very different costs. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('ray-traced-shadows', 'Ray-Traced Shadows', 'Ray tracing', 'advanced', 'Uses ray tracing for more accurate shadowing and contact detail.', 'Uses ray tracing for more accurate shadowing and contact detail. The cost rises with light count, ray count and denoising quality.', 4, 4, 3, 1, 1, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'The cost rises with light count, ray count and denoising quality. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('ray-traced-global-illumination', 'Ray-Traced Global Illumination', 'Ray tracing', 'specialized', 'Uses traced rays for bounced diffuse lighting.', 'Uses traced rays for bounced diffuse lighting. It is usually one of the heaviest ray-tracing features.', 5, 5, 4, 2, 1, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On shared-memory handhelds, judge this by stutter and texture streaming as well as average FPS.', 'It is usually one of the heaviest ray-tracing features. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('ray-traced-ambient-occlusion', 'Ray-Traced Ambient Occlusion', 'Ray tracing', 'specialized', 'Uses ray tracing for contact and crevice shading beyond screen-space limits.', 'Uses ray tracing for contact and crevice shading beyond screen-space limits. It improves off-screen consistency but is expensive for a subtle effect.', 4, 4, 3, 1, 1, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'It improves off-screen consistency but is expensive for a subtle effect. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('path-tracing', 'Path Tracing', 'Ray tracing', 'specialized', 'Uses many traced light paths for near-offline lighting quality.', 'Uses many traced light paths for near-offline lighting quality. This is generally a showcase mode rather than a practical handheld target.', 5, 5, 5, 3, 2, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On shared-memory handhelds, judge this by stutter and texture streaming as well as average FPS.', 'This is generally a showcase mode rather than a practical handheld target. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('lod-quality', 'Level of Detail Quality', 'World detail', 'common', 'Controls how quickly models switch to simpler versions with distance.', 'Controls how quickly models switch to simpler versions with distance. Aggressive reductions can create visible pop-in.', 3, 4, 2, 3, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Aggressive reductions can create visible pop-in. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('object-density', 'Object Density', 'World detail', 'advanced', 'Controls the number of decorative props and small world objects.', 'Controls the number of decorative props and small world objects. It can improve CPU-limited 1% lows in dense environments.', 3, 3, 2, 4, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'It can improve CPU-limited 1% lows in dense environments. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('terrain-quality', 'Terrain Quality', 'World detail', 'common', 'Controls landscape geometry, blending and distant terrain detail.', 'Controls landscape geometry, blending and distant terrain detail. Open worlds can combine terrain geometry, textures and shadows under one slider.', 3, 4, 3, 2, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Open worlds can combine terrain geometry, textures and shadows under one slider. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('grass-density', 'Grass Density', 'World detail', 'common', 'Changes how much grass and small vegetation is rendered.', 'Changes how much grass and small vegetation is rendered. Dense grass can tax draw calls, overdraw and shadow rendering.', 4, 3, 2, 4, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Dense grass can tax draw calls, overdraw and shadow rendering. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('tree-quality', 'Tree Quality', 'World detail', 'advanced', 'Controls tree geometry, distance, animation and shading.', 'Controls tree geometry, distance, animation and shading. Forested scenes can shift the bottleneck between CPU and GPU.', 3, 4, 3, 3, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Forested scenes can shift the bottleneck between CPU and GPU. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('traffic-density', 'Traffic Density', 'Simulation', 'common', 'Changes how many vehicles and traffic agents are simulated.', 'Changes how many vehicles and traffic agents are simulated. It is mainly a CPU and simulation setting.', 2, 2, 1, 5, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'It is mainly a CPU and simulation setting. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('animation-quality', 'Animation Quality', 'Simulation', 'advanced', 'Controls animation update rate, interpolation and distant-character fidelity.', 'Controls animation update rate, interpolation and distant-character fidelity. Large crowds can make animation updates expensive on the CPU.', 2, 3, 1, 4, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Large crowds can make animation updates expensive on the CPU. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('physics-quality', 'Physics Quality', 'Simulation', 'common', 'Controls simulation accuracy, update rate or the number of physical objects.', 'Controls simulation accuracy, update rate or the number of physical objects. It can hurt 1% lows during destruction and object-heavy scenes.', 2, 3, 1, 5, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'It can hurt 1% lows during destruction and object-heavy scenes. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('ragdoll-quality', 'Ragdoll Quality', 'Simulation', 'advanced', 'Controls the number, lifetime or complexity of simulated ragdolls.', 'Controls the number, lifetime or complexity of simulated ragdolls. Lower values can stabilize combat scenes on CPU-limited devices.', 2, 2, 1, 4, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Lower values can stabilize combat scenes on CPU-limited devices. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('destruction-quality', 'Destruction Quality', 'Simulation', 'advanced', 'Controls breakable geometry, debris and destruction simulation.', 'Controls breakable geometry, debris and destruction simulation. Large destruction events can load CPU, GPU and memory at the same time.', 4, 4, 3, 5, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Large destruction events can load CPU, GPU and memory at the same time. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('cloth-simulation', 'Cloth Simulation', 'Simulation', 'advanced', 'Simulates clothing, banners and fabric movement.', 'Simulates clothing, banners and fabric movement. Character-heavy scenes can multiply the CPU cost.', 2, 3, 1, 4, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Character-heavy scenes can multiply the CPU cost. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('water-quality', 'Water Quality', 'Effects', 'common', 'Bundles water shading, waves, reflections and refraction.', 'Bundles water shading, waves, reflections and refraction. Because it is a bundle, the real cost varies enormously between games.', 4, 5, 3, 2, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Because it is a bundle, the real cost varies enormously between games. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('ocean-simulation', 'Ocean Simulation', 'Simulation', 'advanced', 'Controls wave simulation, ocean geometry and interaction detail.', 'Controls wave simulation, ocean geometry and interaction detail. Large bodies of water can combine compute, geometry and reflection costs.', 3, 4, 2, 4, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Large bodies of water can combine compute, geometry and reflection costs. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('weather-quality', 'Weather Quality', 'Effects', 'common', 'Controls rain, snow, storms, wetness and related particles.', 'Controls rain, snow, storms, wetness and related particles. Weather can add particles, reflections, wet materials and simulation together.', 3, 4, 2, 3, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Weather can add particles, reflections, wet materials and simulation together. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('world-streaming-distance', 'World Streaming Distance', 'World detail', 'advanced', 'Controls how far world cells, textures and objects are loaded around the player.', 'Controls how far world cells, textures and objects are loaded around the player. Higher values can reduce pop-in but increase memory and CPU pressure.', 2, 3, 5, 4, 0, false, 'Lower it when memory use is near the device limit, traversal stutters, or assets stream late.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Higher values can reduce pop-in but increase memory and CPU pressure. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('nanite-geometry', 'Nanite Geometry', 'World detail', 'specialized', 'Controls or enables Unreal Engine virtualized geometry detail.', 'Controls or enables Unreal Engine virtualized geometry detail. The effect depends on scene composition, shadowing and fallback meshes.', 3, 5, 3, 2, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'The effect depends on scene composition, shadowing and fallback meshes. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('vegetation-animation', 'Vegetation Animation', 'World detail', 'advanced', 'Controls wind and movement simulation for grass, trees and foliage.', 'Controls wind and movement simulation for grass, trees and foliage. Large vegetation fields can add vertex and CPU animation cost.', 2, 3, 1, 3, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Large vegetation fields can add vertex and CPU animation cost. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('particle-lighting', 'Particle Lighting', 'Effects', 'advanced', 'Allows smoke, sparks and particles to receive or cast more detailed lighting.', 'Allows smoke, sparks and particles to receive or cast more detailed lighting. The cost grows quickly with dense transparent effects.', 3, 4, 1, 1, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'The cost grows quickly with dense transparent effects. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('gpu-particles', 'GPU Particles', 'Effects', 'specialized', 'Uses GPU simulation for large particle systems.', 'Uses GPU simulation for large particle systems. It can shift heavy effects from CPU to GPU rather than making them free.', 3, 4, 2, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It can shift heavy effects from CPU to GPU rather than making them free. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('smoke-quality', 'Smoke Quality', 'Effects', 'common', 'Controls smoke resolution, density, lighting and simulation.', 'Controls smoke resolution, density, lighting and simulation. Transparent overdraw and volumetrics can make smoke especially expensive.', 4, 4, 2, 2, 0, false, 'Lower it when the GPU is near full load and the game cannot hold the target frame rate.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'On handhelds, reduce this one step at a time and retest at the same TDP, resolution and upscaling mode.', 'Transparent overdraw and volumetrics can make smoke especially expensive. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('fire-quality', 'Fire Quality', 'Effects', 'common', 'Controls flame particles, lighting, distortion and simulation.', 'Controls flame particles, lighting, distortion and simulation. Many fire sources can combine particles, lights and heat distortion.', 3, 4, 2, 2, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Many fire sources can combine particles, lights and heat distortion. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('explosion-quality', 'Explosion Quality', 'Effects', 'common', 'Controls explosion particles, lighting, smoke and debris.', 'Controls explosion particles, lighting, smoke and debris. Short spikes may affect 1% lows more than average FPS.', 3, 4, 2, 3, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Short spikes may affect 1% lows more than average FPS. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('debris-amount', 'Debris Amount', 'Effects', 'advanced', 'Changes the number and lifetime of small fragments and scene particles.', 'Changes the number and lifetime of small fragments and scene particles. Lower it when large fights or destruction scenes stutter.', 2, 2, 2, 4, 0, false, 'Lower it when busy scenes hurt 1% lows, CPU frame time is high, or the GPU is not fully used.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'On handhelds, test this in the busiest area rather than an empty scene; CPU-heavy options often show up in 1% lows before average FPS.', 'Lower it when large fights or destruction scenes stutter. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('screen-space-effects', 'Screen-Space Effects Quality', 'Effects', 'advanced', 'Bundles effects calculated from the current screen buffers.', 'Bundles effects calculated from the current screen buffers. The bundle may include reflections, shadows, AO or contact effects.', 3, 4, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'The bundle may include reflections, shadows, AO or contact effects. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('lens-flare', 'Lens Flare', 'Post-processing', 'common', 'Adds flare artifacts around bright lights.', 'Adds flare artifacts around bright lights. It is usually a taste setting with a small cost.', 1, 2, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It is usually a taste setting with a small cost. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('vignette', 'Vignette', 'Post-processing', 'common', 'Darkens image edges for a cinematic frame.', 'Darkens image edges for a cinematic frame. Disable it for cleaner peripheral visibility; do not expect an FPS gain.', 0, 1, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it only when you prefer its presentation or it solves a specific compatibility or pacing issue.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Disable it for cleaner peripheral visibility; do not expect an FPS gain. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('lens-distortion', 'Lens Distortion', 'Post-processing', 'advanced', 'Warps the image to imitate camera lenses or optics.', 'Warps the image to imitate camera lenses or optics. It can slightly reduce clarity near the edges.', 1, 2, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It can slightly reduce clarity near the edges. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('color-grading', 'Color Grading', 'Post-processing', 'advanced', 'Applies artistic color transforms to the final image.', 'Applies artistic color transforms to the final image. It is usually cheap but strongly affects the intended look.', 0, 4, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It is usually cheap but strongly affects the intended look. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('tone-mapping', 'Tone Mapping', 'Post-processing', 'advanced', 'Maps scene brightness into the display''s visible range.', 'Maps scene brightness into the display''s visible range. It affects contrast and highlights more than raw performance.', 1, 4, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it high when the visual difference is obvious and the target frame time already has enough headroom.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It affects contrast and highlights more than raw performance. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('exposure-quality', 'Exposure / Eye Adaptation', 'Post-processing', 'advanced', 'Adjusts scene exposure as lighting conditions change.', 'Adjusts scene exposure as lighting conditions change. Disable only when the adaptation itself is distracting or broken.', 1, 3, 0, 0, 0, false, 'Change it mainly for preference, clarity, compatibility, or frame-pacing behavior rather than raw FPS.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Disable only when the adaptation itself is distracting or broken. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('distortion-effects', 'Distortion Effects', 'Post-processing', 'advanced', 'Warps the background for heat haze, shockwaves and similar effects.', 'Warps the background for heat haze, shockwaves and similar effects. It is most costly when many transparent distortion layers overlap.', 2, 3, 1, 0, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'It is most costly when many transparent distortion layers overlap. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('ambient-particles', 'Ambient Particles', 'Effects', 'advanced', 'Controls decorative dust, insects, leaves and environmental particles.', 'Controls decorative dust, insects, leaves and environmental particles. Lower values can clean up busy scenes as well as save performance.', 2, 2, 1, 2, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Lower values can clean up busy scenes as well as save performance. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published'),
  ('weather-particles', 'Weather Particles', 'Effects', 'advanced', 'Controls the density and quality of rain, snow and ash particles.', 'Controls the density and quality of rain, snow and ash particles. Heavy weather can also trigger wet surfaces and reflection costs.', 3, 3, 2, 2, 0, false, 'Lower it after the biggest settings are tuned and you still need a little more headroom.', 'Keep it higher when the effect supports the art direction and performance remains stable.', 'Treat this as a secondary handheld tweak after resolution, upscaling, shadows and heavy lighting are under control.', 'Heavy weather can also trigger wet surfaces and reflection costs. This score is an editorial cross-game estimate, not a measured result for every engine.', 2, false, 'published')
on conflict (slug) do nothing;

-- A few broad Phase 8 aliases now have a more precise canonical page.
delete from public.setting_impact_aliases aliases
using public.setting_impact_entries entries
where aliases.setting_impact_id = entries.id
  and (
    (entries.slug = 'anti-aliasing' and aliases.normalized_alias = 'smaa')
    or (entries.slug = 'anti-aliasing' and aliases.normalized_alias = 'msaa')
    or (entries.slug = 'shadow-quality' and aliases.normalized_alias = 'shadowresolution')
    or (entries.slug = 'global-illumination' and aliases.normalized_alias = 'indirectlighting')
    or (entries.slug = 'volumetric-quality' and aliases.normalized_alias = 'volumetricfog')
    or (entries.slug = 'volumetric-quality' and aliases.normalized_alias = 'fogquality')
    or (entries.slug = 'volumetric-quality' and aliases.normalized_alias = 'cloudquality')
    or (entries.slug = 'ray-traced-lighting' and aliases.normalized_alias = 'pathtracing')
    or (entries.slug = 'foliage-quality' and aliases.normalized_alias = 'grassquality')
    or (entries.slug = 'crowd-density' and aliases.normalized_alias = 'trafficdensity')
  );

with alias_seed(slug, alias) as (
  values
  ('dynamic-resolution', 'Dynamic Resolution'),
  ('dynamic-resolution', 'Dynamic Resolution Scaling'),
  ('dynamic-resolution', 'DRS'),
  ('dynamic-resolution', 'Adaptive Resolution'),
  ('display-mode', 'Display Mode'),
  ('display-mode', 'Fullscreen Mode'),
  ('display-mode', 'Window Mode'),
  ('display-mode', 'Screen Mode'),
  ('refresh-rate', 'Refresh Rate'),
  ('refresh-rate', 'Screen Refresh Rate'),
  ('refresh-rate', 'Hz'),
  ('refresh-rate', 'Display Frequency'),
  ('aspect-ratio', 'Aspect Ratio'),
  ('aspect-ratio', 'Screen Aspect Ratio'),
  ('aspect-ratio', 'Display Aspect Ratio'),
  ('field-of-view', 'Field of View'),
  ('field-of-view', 'FOV'),
  ('field-of-view', 'Camera Field of View'),
  ('field-of-view', 'Field of Vision'),
  ('hdr-output', 'HDR Output'),
  ('hdr-output', 'HDR'),
  ('hdr-output', 'High Dynamic Range'),
  ('hdr-output', 'HDR10'),
  ('brightness-gamma', 'Brightness / Gamma'),
  ('brightness-gamma', 'Brightness'),
  ('brightness-gamma', 'Gamma'),
  ('brightness-gamma', 'Black Level'),
  ('variable-refresh-rate', 'Variable Refresh Rate'),
  ('variable-refresh-rate', 'VRR'),
  ('variable-refresh-rate', 'Adaptive Sync'),
  ('variable-refresh-rate', 'FreeSync'),
  ('variable-refresh-rate', 'G-SYNC'),
  ('triple-buffering', 'Triple Buffering'),
  ('triple-buffering', 'Triple Buffer'),
  ('triple-buffering', 'Triple-Buffered V-Sync'),
  ('low-latency-mode', 'Low Latency Mode'),
  ('low-latency-mode', 'NVIDIA Reflex'),
  ('low-latency-mode', 'Reflex Low Latency'),
  ('low-latency-mode', 'AMD Anti-Lag'),
  ('low-latency-mode', 'Anti-Lag 2'),
  ('low-latency-mode', 'Low Latency'),
  ('reduced-buffering', 'Reduced Buffering'),
  ('reduced-buffering', 'Reduce Buffering'),
  ('reduced-buffering', 'Render Ahead Limit'),
  ('reduced-buffering', 'Maximum Pre-Rendered Frames'),
  ('graphics-api', 'Graphics API'),
  ('graphics-api', 'Rendering API'),
  ('graphics-api', 'DirectX Version'),
  ('graphics-api', 'DX11'),
  ('graphics-api', 'DX12'),
  ('graphics-api', 'Vulkan'),
  ('upscaling-sharpness', 'Upscaling Sharpness'),
  ('upscaling-sharpness', 'Sharpening Strength'),
  ('upscaling-sharpness', 'FSR Sharpness'),
  ('upscaling-sharpness', 'DLSS Sharpness'),
  ('upscaling-sharpness', 'XeSS Sharpness'),
  ('multi-frame-generation', 'Multi Frame Generation'),
  ('multi-frame-generation', 'MFG'),
  ('multi-frame-generation', 'DLSS Multi Frame Generation'),
  ('multi-frame-generation', '2X Frame Generation'),
  ('multi-frame-generation', '3X Frame Generation'),
  ('multi-frame-generation', '4X Frame Generation'),
  ('ray-reconstruction', 'Ray Reconstruction'),
  ('ray-reconstruction', 'DLSS Ray Reconstruction'),
  ('ray-reconstruction', 'RR'),
  ('ray-reconstruction', 'Ray Denoiser'),
  ('taa-quality', 'Temporal Anti-Aliasing Quality'),
  ('taa-quality', 'TAA Quality'),
  ('taa-quality', 'Temporal AA Quality'),
  ('taa-quality', 'Temporal Anti Aliasing'),
  ('fxaa', 'FXAA'),
  ('fxaa', 'Fast Approximate Anti-Aliasing'),
  ('smaa', 'SMAA'),
  ('smaa', 'Subpixel Morphological Anti-Aliasing'),
  ('msaa', 'MSAA'),
  ('msaa', 'Multisample Anti-Aliasing'),
  ('msaa', '2x MSAA'),
  ('msaa', '4x MSAA'),
  ('msaa', '8x MSAA'),
  ('supersampling', 'Supersampling'),
  ('supersampling', 'SSAA'),
  ('supersampling', 'Super Sampling'),
  ('supersampling', 'Resolution Scale Above 100%'),
  ('supersampling', 'Downsampling'),
  ('dlaa-native-aa', 'Native-Resolution AI Anti-Aliasing'),
  ('dlaa-native-aa', 'DLAA'),
  ('dlaa-native-aa', 'FSR Native AA'),
  ('dlaa-native-aa', 'XeSS Native AA'),
  ('dlaa-native-aa', 'Native Anti-Aliasing'),
  ('temporal-upscaling', 'Temporal Upscaling Quality'),
  ('temporal-upscaling', 'TSR Quality'),
  ('temporal-upscaling', 'TAAU Quality'),
  ('temporal-upscaling', 'Temporal Super Resolution Quality'),
  ('image-sharpening', 'Image Sharpening'),
  ('image-sharpening', 'CAS'),
  ('image-sharpening', 'FidelityFX CAS'),
  ('image-sharpening', 'Radeon Image Sharpening'),
  ('image-sharpening', 'Sharpen Filter'),
  ('variable-rate-shading', 'Variable Rate Shading'),
  ('variable-rate-shading', 'VRS'),
  ('variable-rate-shading', 'Variable Shading Rate'),
  ('variable-rate-shading', 'Shading Rate'),
  ('foveated-rendering', 'Foveated Rendering'),
  ('foveated-rendering', 'Fixed Foveated Rendering'),
  ('foveated-rendering', 'FFR'),
  ('foveated-rendering', 'Dynamic Foveated Rendering'),
  ('texture-filtering-quality', 'Texture Filtering Quality'),
  ('texture-filtering-quality', 'Texture Filtering Quality'),
  ('texture-filtering-quality', 'Filtering Quality'),
  ('texture-filtering-quality', 'Texture Filter Quality'),
  ('material-quality', 'Material Quality'),
  ('material-quality', 'Materials'),
  ('material-quality', 'Material Detail'),
  ('material-quality', 'Material Complexity'),
  ('shader-quality', 'Shader Quality'),
  ('shader-quality', 'Shader Detail'),
  ('shader-quality', 'Shading Quality'),
  ('shader-quality', 'Shader Complexity'),
  ('parallax-occlusion-mapping', 'Parallax Occlusion Mapping'),
  ('parallax-occlusion-mapping', 'POM'),
  ('parallax-occlusion-mapping', 'Parallax Mapping'),
  ('parallax-occlusion-mapping', 'Relief Mapping'),
  ('tessellation', 'Tessellation'),
  ('tessellation', 'Tessellation Quality'),
  ('tessellation', 'Hardware Tessellation'),
  ('displacement-quality', 'Displacement Quality'),
  ('displacement-quality', 'Displacement'),
  ('displacement-quality', 'Height Mapping Quality'),
  ('displacement-quality', 'Micro Displacement'),
  ('decal-quality', 'Decal Quality'),
  ('decal-quality', 'Decals'),
  ('decal-quality', 'Decal Detail'),
  ('decal-quality', 'Impact Decals'),
  ('decal-quality', 'Bullet Decals'),
  ('terrain-texture-quality', 'Terrain Texture Quality'),
  ('terrain-texture-quality', 'Landscape Texture Quality'),
  ('terrain-texture-quality', 'Ground Texture Quality'),
  ('subsurface-scattering', 'Subsurface Scattering'),
  ('subsurface-scattering', 'SSS'),
  ('subsurface-scattering', 'Subsurface Quality'),
  ('subsurface-scattering', 'Skin Scattering'),
  ('skin-shading-quality', 'Skin Shading Quality'),
  ('skin-shading-quality', 'Skin Quality'),
  ('skin-shading-quality', 'Character Skin Quality'),
  ('skin-shading-quality', 'Skin Rendering'),
  ('translucency-quality', 'Translucency Quality'),
  ('translucency-quality', 'Transparency Quality'),
  ('translucency-quality', 'Transparent Effects'),
  ('translucency-quality', 'Translucent Quality'),
  ('refraction-quality', 'Refraction Quality'),
  ('refraction-quality', 'Refraction'),
  ('refraction-quality', 'Refractive Effects'),
  ('refraction-quality', 'Glass Refraction'),
  ('shadow-resolution', 'Shadow Resolution'),
  ('shadow-resolution', 'Shadow Map Resolution'),
  ('shadow-resolution', 'Shadow Texture Resolution'),
  ('shadow-distance', 'Shadow Distance'),
  ('shadow-distance', 'Shadow Draw Distance'),
  ('shadow-distance', 'Shadow View Distance'),
  ('shadow-distance', 'Shadow Range'),
  ('shadow-filtering', 'Shadow Filtering'),
  ('shadow-filtering', 'Soft Shadows'),
  ('shadow-filtering', 'Shadow Filter Quality'),
  ('shadow-filtering', 'PCF Quality'),
  ('virtual-shadow-maps', 'Virtual Shadow Maps'),
  ('virtual-shadow-maps', 'VSM'),
  ('virtual-shadow-maps', 'Virtual Shadows'),
  ('cascaded-shadows', 'Cascaded Shadow Maps'),
  ('cascaded-shadows', 'CSM'),
  ('cascaded-shadows', 'Shadow Cascades'),
  ('cascaded-shadows', 'Cascade Count'),
  ('local-light-shadows', 'Local Light Shadows'),
  ('local-light-shadows', 'Point Light Shadows'),
  ('local-light-shadows', 'Spot Light Shadows'),
  ('local-light-shadows', 'Additional Light Shadows'),
  ('lighting-quality', 'Lighting Quality'),
  ('lighting-quality', 'Light Quality'),
  ('lighting-quality', 'Lighting Detail'),
  ('dynamic-light-count', 'Dynamic Light Count'),
  ('dynamic-light-count', 'Dynamic Lights'),
  ('dynamic-light-count', 'Additional Lights'),
  ('dynamic-light-count', 'Local Light Count'),
  ('indirect-lighting-quality', 'Indirect Lighting Quality'),
  ('indirect-lighting-quality', 'Indirect Lighting'),
  ('indirect-lighting-quality', 'Bounce Lighting'),
  ('indirect-lighting-quality', 'Indirect Diffuse Quality'),
  ('lumen-global-illumination', 'Lumen Global Illumination'),
  ('lumen-global-illumination', 'Lumen GI'),
  ('lumen-global-illumination', 'Lumen Global Illumination Quality'),
  ('volumetric-lighting', 'Volumetric Lighting'),
  ('volumetric-lighting', 'Volumetric Light'),
  ('volumetric-lighting', 'Light Scattering'),
  ('volumetric-lighting', 'Volumetric Illumination'),
  ('volumetric-fog', 'Volumetric Fog'),
  ('volumetric-fog', 'Fog Quality'),
  ('volumetric-fog', 'Volumetric Fog Quality'),
  ('volumetric-fog', 'Fog Volumetrics'),
  ('volumetric-clouds', 'Volumetric Clouds'),
  ('volumetric-clouds', 'Cloud Quality'),
  ('volumetric-clouds', 'Volumetric Cloud Quality'),
  ('volumetric-clouds', 'Cloud Rendering'),
  ('light-shafts', 'Light Shafts'),
  ('light-shafts', 'God Rays'),
  ('light-shafts', 'Sun Shafts'),
  ('light-shafts', 'Crepuscular Rays'),
  ('planar-reflections', 'Planar Reflections'),
  ('planar-reflections', 'Planar Reflection Quality'),
  ('planar-reflections', 'Real-Time Planar Reflections'),
  ('reflection-probes', 'Reflection Probes'),
  ('reflection-probes', 'Cubemap Reflections'),
  ('reflection-probes', 'Environment Probes'),
  ('reflection-probes', 'Reflection Capture Quality'),
  ('water-reflections', 'Water Reflections'),
  ('water-reflections', 'Water Reflection Quality'),
  ('water-reflections', 'Ocean Reflections'),
  ('ray-traced-shadows', 'Ray-Traced Shadows'),
  ('ray-traced-shadows', 'RT Shadows'),
  ('ray-traced-shadows', 'Ray Traced Shadows'),
  ('ray-traced-global-illumination', 'Ray-Traced Global Illumination'),
  ('ray-traced-global-illumination', 'RTGI'),
  ('ray-traced-global-illumination', 'Ray Traced Global Illumination'),
  ('ray-traced-global-illumination', 'RT Global Illumination'),
  ('ray-traced-ambient-occlusion', 'Ray-Traced Ambient Occlusion'),
  ('ray-traced-ambient-occlusion', 'RTAO'),
  ('ray-traced-ambient-occlusion', 'RT Ambient Occlusion'),
  ('ray-traced-ambient-occlusion', 'Ray Traced AO'),
  ('path-tracing', 'Path Tracing'),
  ('path-tracing', 'Full Path Tracing'),
  ('path-tracing', 'RT Overdrive'),
  ('path-tracing', 'Overdrive Mode'),
  ('lod-quality', 'Level of Detail Quality'),
  ('lod-quality', 'LOD Quality'),
  ('lod-quality', 'Level of Detail Quality'),
  ('lod-quality', 'Mesh LOD'),
  ('lod-quality', 'LOD Bias'),
  ('object-density', 'Object Density'),
  ('object-density', 'World Object Density'),
  ('object-density', 'Prop Density'),
  ('object-density', 'Scene Density'),
  ('terrain-quality', 'Terrain Quality'),
  ('terrain-quality', 'Landscape Quality'),
  ('terrain-quality', 'Ground Quality'),
  ('terrain-quality', 'Terrain Detail'),
  ('grass-density', 'Grass Density'),
  ('grass-density', 'Grass Quality'),
  ('grass-density', 'Grass Amount'),
  ('grass-density', 'Vegetation Density'),
  ('tree-quality', 'Tree Quality'),
  ('tree-quality', 'Tree Detail'),
  ('tree-quality', 'Tree LOD'),
  ('tree-quality', 'Forest Quality'),
  ('traffic-density', 'Traffic Density'),
  ('traffic-density', 'Vehicle Density'),
  ('traffic-density', 'Traffic Amount'),
  ('traffic-density', 'Car Density'),
  ('animation-quality', 'Animation Quality'),
  ('animation-quality', 'Animation Detail'),
  ('animation-quality', 'Animation LOD'),
  ('animation-quality', 'Character Animation Quality'),
  ('physics-quality', 'Physics Quality'),
  ('physics-quality', 'Physics Detail'),
  ('physics-quality', 'Physics Simulation Quality'),
  ('physics-quality', 'Simulation Quality'),
  ('ragdoll-quality', 'Ragdoll Quality'),
  ('ragdoll-quality', 'Ragdoll Count'),
  ('ragdoll-quality', 'Ragdoll Physics'),
  ('ragdoll-quality', 'Corpse Physics'),
  ('destruction-quality', 'Destruction Quality'),
  ('destruction-quality', 'Destruction Detail'),
  ('destruction-quality', 'Destructible Objects'),
  ('destruction-quality', 'Destruction Effects'),
  ('cloth-simulation', 'Cloth Simulation'),
  ('cloth-simulation', 'Cloth Quality'),
  ('cloth-simulation', 'Cloth Physics'),
  ('cloth-simulation', 'Fabric Simulation'),
  ('water-quality', 'Water Quality'),
  ('water-quality', 'Water Detail'),
  ('water-quality', 'Water Effects'),
  ('water-quality', 'Water Rendering Quality'),
  ('ocean-simulation', 'Ocean Simulation'),
  ('ocean-simulation', 'Ocean Quality'),
  ('ocean-simulation', 'Wave Quality'),
  ('ocean-simulation', 'Ocean Physics'),
  ('weather-quality', 'Weather Quality'),
  ('weather-quality', 'Weather Effects'),
  ('weather-quality', 'Rain Quality'),
  ('weather-quality', 'Snow Quality'),
  ('weather-quality', 'Storm Quality'),
  ('world-streaming-distance', 'World Streaming Distance'),
  ('world-streaming-distance', 'Streaming Distance'),
  ('world-streaming-distance', 'World Streaming'),
  ('world-streaming-distance', 'Cell Loading Distance'),
  ('nanite-geometry', 'Nanite Geometry'),
  ('nanite-geometry', 'Nanite'),
  ('nanite-geometry', 'Nanite Quality'),
  ('nanite-geometry', 'Virtualized Geometry'),
  ('vegetation-animation', 'Vegetation Animation'),
  ('vegetation-animation', 'Foliage Animation'),
  ('vegetation-animation', 'Wind Quality'),
  ('vegetation-animation', 'Tree Animation'),
  ('particle-lighting', 'Particle Lighting'),
  ('particle-lighting', 'Lit Particles'),
  ('particle-lighting', 'Particle Light Quality'),
  ('particle-lighting', 'Particle Shadows'),
  ('gpu-particles', 'GPU Particles'),
  ('gpu-particles', 'GPU Particle Quality'),
  ('gpu-particles', 'Compute Particles'),
  ('smoke-quality', 'Smoke Quality'),
  ('smoke-quality', 'Smoke Detail'),
  ('smoke-quality', 'Volumetric Smoke'),
  ('smoke-quality', 'Smoke Effects'),
  ('fire-quality', 'Fire Quality'),
  ('fire-quality', 'Fire Effects'),
  ('fire-quality', 'Flame Quality'),
  ('explosion-quality', 'Explosion Quality'),
  ('explosion-quality', 'Explosion Effects'),
  ('explosion-quality', 'Explosion Detail'),
  ('debris-amount', 'Debris Amount'),
  ('debris-amount', 'Debris Quality'),
  ('debris-amount', 'Debris Density'),
  ('debris-amount', 'Object Debris'),
  ('screen-space-effects', 'Screen-Space Effects Quality'),
  ('screen-space-effects', 'Screen Space Effects'),
  ('screen-space-effects', 'Screen-Space Quality'),
  ('lens-flare', 'Lens Flare'),
  ('lens-flare', 'Lens Flares'),
  ('lens-flare', 'Anamorphic Flare'),
  ('vignette', 'Vignette'),
  ('vignette', 'Screen Vignette'),
  ('lens-distortion', 'Lens Distortion'),
  ('lens-distortion', 'Camera Distortion'),
  ('lens-distortion', 'Barrel Distortion'),
  ('color-grading', 'Color Grading'),
  ('color-grading', 'Color Filter'),
  ('color-grading', 'Color Correction'),
  ('color-grading', 'LUT Quality'),
  ('tone-mapping', 'Tone Mapping'),
  ('tone-mapping', 'Tonemapper'),
  ('tone-mapping', 'Tone Mapper Quality'),
  ('tone-mapping', 'Filmic Tonemapping'),
  ('exposure-quality', 'Exposure / Eye Adaptation'),
  ('exposure-quality', 'Auto Exposure'),
  ('exposure-quality', 'Eye Adaptation'),
  ('exposure-quality', 'Exposure Quality'),
  ('distortion-effects', 'Distortion Effects'),
  ('distortion-effects', 'Heat Haze'),
  ('distortion-effects', 'Screen Distortion'),
  ('distortion-effects', 'Refraction Effects Quality'),
  ('ambient-particles', 'Ambient Particles'),
  ('ambient-particles', 'Environmental Particles'),
  ('ambient-particles', 'Ambient Effects'),
  ('ambient-particles', 'World Particles'),
  ('weather-particles', 'Weather Particles'),
  ('weather-particles', 'Rain Particles'),
  ('weather-particles', 'Snow Particles'),
  ('weather-particles', 'Precipitation Quality')
), normalized as (
  select
    entries.id as setting_impact_id,
    alias_seed.alias,
    regexp_replace(lower(alias_seed.alias), '[^a-z0-9]+', '', 'g') as normalized_alias
  from alias_seed
  join public.setting_impact_entries entries on entries.slug = alias_seed.slug
)
insert into public.setting_impact_aliases (
  setting_impact_id,
  alias,
  normalized_alias
)
select setting_impact_id, alias, normalized_alias
from normalized
where normalized_alias <> ''
on conflict (normalized_alias) do nothing;
