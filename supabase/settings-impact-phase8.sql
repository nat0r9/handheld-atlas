-- HandheldAtlas Phase 8 — Settings Impact Database
-- Run this in Supabase SQL Editor before deploying the Phase 8 web files.
-- The migration is idempotent. Seed rows are only inserted when the slug is new.

create table if not exists public.setting_impact_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'Other',
  summary text not null,
  description text,
  performance_impact smallint not null default 0 check (performance_impact between 0 and 5),
  visual_impact smallint not null default 0 check (visual_impact between 0 and 5),
  vram_impact smallint not null default 0 check (vram_impact between 0 and 5),
  cpu_impact smallint not null default 0 check (cpu_impact between 0 and 5),
  latency_impact smallint not null default 0 check (latency_impact between 0 and 5),
  restart_required boolean not null default false,
  when_to_lower text,
  when_to_keep_high text,
  handheld_advice text,
  caveat text,
  confidence smallint not null default 2 check (confidence between 1 and 5),
  atlas_verified boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setting_impact_aliases (
  id uuid primary key default gen_random_uuid(),
  setting_impact_id uuid not null references public.setting_impact_entries(id) on delete cascade,
  alias text not null,
  normalized_alias text not null unique,
  created_at timestamptz not null default now(),
  unique (setting_impact_id, alias)
);

create table if not exists public.game_setting_impacts (
  id uuid primary key default gen_random_uuid(),
  setting_impact_id uuid not null references public.setting_impact_entries(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  handheld_id uuid references public.handhelds(id) on delete set null,
  recommended_value text,
  performance_change text,
  visual_note text,
  resolution text,
  tdp text,
  test_note text,
  source_url text,
  confidence smallint not null default 2 check (confidence between 1 and 5),
  atlas_verified boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists setting_impact_entries_name_unique_idx
on public.setting_impact_entries(lower(name));

create index if not exists setting_impact_entries_status_name_idx
on public.setting_impact_entries(status, name);

create index if not exists setting_impact_entries_category_idx
on public.setting_impact_entries(category);

create index if not exists setting_impact_aliases_entry_idx
on public.setting_impact_aliases(setting_impact_id);

create index if not exists game_setting_impacts_setting_idx
on public.game_setting_impacts(setting_impact_id);

create index if not exists game_setting_impacts_game_idx
on public.game_setting_impacts(game_id);

create or replace function public.touch_settings_impact_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists setting_impact_entries_touch_updated_at
on public.setting_impact_entries;

create trigger setting_impact_entries_touch_updated_at
before update on public.setting_impact_entries
for each row execute function public.touch_settings_impact_updated_at();

drop trigger if exists game_setting_impacts_touch_updated_at
on public.game_setting_impacts;

create trigger game_setting_impacts_touch_updated_at
before update on public.game_setting_impacts
for each row execute function public.touch_settings_impact_updated_at();

alter table public.setting_impact_entries enable row level security;
alter table public.setting_impact_aliases enable row level security;
alter table public.game_setting_impacts enable row level security;

grant select on public.setting_impact_entries, public.setting_impact_aliases, public.game_setting_impacts to anon, authenticated;
grant insert, update, delete on public.setting_impact_entries, public.setting_impact_aliases, public.game_setting_impacts to authenticated;

-- Public visitors only see published knowledge and published game evidence.
drop policy if exists "Public can read published setting impact entries" on public.setting_impact_entries;
create policy "Public can read published setting impact entries"
on public.setting_impact_entries for select
to anon, authenticated
using (
  status = 'published'
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Public can read aliases for visible setting impacts" on public.setting_impact_aliases;
create policy "Public can read aliases for visible setting impacts"
on public.setting_impact_aliases for select
to anon, authenticated
using (
  exists (
    select 1 from public.setting_impact_entries
    where setting_impact_entries.id = setting_impact_aliases.setting_impact_id
      and (
        setting_impact_entries.status = 'published'
        or exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role in ('atlas_editor', 'admin')
        )
      )
  )
);

drop policy if exists "Public can read published game setting impacts" on public.game_setting_impacts;
create policy "Public can read published game setting impacts"
on public.game_setting_impacts for select
to anon, authenticated
using (
  status = 'published'
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

-- Only content editors maintain canonical knowledge. This also protects Atlas reviewed flags.
drop policy if exists "Editors can create setting impact entries" on public.setting_impact_entries;
create policy "Editors can create setting impact entries"
on public.setting_impact_entries for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Editors can update setting impact entries" on public.setting_impact_entries;
create policy "Editors can update setting impact entries"
on public.setting_impact_entries for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Editors can delete setting impact entries" on public.setting_impact_entries;
create policy "Editors can delete setting impact entries"
on public.setting_impact_entries for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Editors can create setting impact aliases" on public.setting_impact_aliases;
create policy "Editors can create setting impact aliases"
on public.setting_impact_aliases for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Editors can update setting impact aliases" on public.setting_impact_aliases;
create policy "Editors can update setting impact aliases"
on public.setting_impact_aliases for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Editors can delete setting impact aliases" on public.setting_impact_aliases;
create policy "Editors can delete setting impact aliases"
on public.setting_impact_aliases for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

-- Replaces all aliases atomically. A conflicting alias aborts before the old
-- aliases are removed, so an editor typo cannot silently disconnect presets.
create or replace function public.replace_setting_impact_aliases(
  p_setting_impact_id uuid,
  p_aliases jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_conflict text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select profiles.role
  into v_role
  from public.profiles
  where profiles.id = auth.uid();

  if v_role is null or v_role not in ('atlas_editor', 'admin') then
    raise exception 'Insufficient editor role';
  end if;

  if not exists (
    select 1
    from public.setting_impact_entries
    where id = p_setting_impact_id
  ) then
    raise exception 'Setting impact entry not found';
  end if;

  if jsonb_typeof(p_aliases) <> 'array' then
    raise exception 'Aliases must be a JSON array';
  end if;

  select aliases.normalized_alias
  into v_conflict
  from jsonb_to_recordset(p_aliases) as aliases(alias text, normalized_alias text)
  join public.setting_impact_aliases existing
    on existing.normalized_alias = aliases.normalized_alias
  where existing.setting_impact_id <> p_setting_impact_id
  limit 1;

  if v_conflict is not null then
    raise exception 'Alias already belongs to another setting: %', v_conflict;
  end if;

  delete from public.setting_impact_aliases
  where setting_impact_id = p_setting_impact_id;

  insert into public.setting_impact_aliases (
    setting_impact_id,
    alias,
    normalized_alias
  )
  select
    p_setting_impact_id,
    trim(aliases.alias),
    trim(aliases.normalized_alias)
  from jsonb_to_recordset(p_aliases) as aliases(alias text, normalized_alias text)
  where trim(coalesce(aliases.alias, '')) <> ''
    and trim(coalesce(aliases.normalized_alias, '')) <> '';
end;
$$;

grant execute on function public.replace_setting_impact_aliases(uuid, jsonb)
to authenticated;

drop policy if exists "Editors can create game setting impacts" on public.game_setting_impacts;
create policy "Editors can create game setting impacts"
on public.game_setting_impacts for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Editors can update game setting impacts" on public.game_setting_impacts;
create policy "Editors can update game setting impacts"
on public.game_setting_impacts for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

drop policy if exists "Editors can delete game setting impacts" on public.game_setting_impacts;
create policy "Editors can delete game setting impacts"
on public.game_setting_impacts for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('atlas_editor', 'admin')
  )
);

-- Initial general guidance. These rows deliberately use moderate confidence and
-- explicit caveats; game-specific measured evidence belongs in game_setting_impacts.
insert into public.setting_impact_entries (
  slug, name, category, summary, description,
  performance_impact, visual_impact, vram_impact, cpu_impact, latency_impact,
  when_to_lower, when_to_keep_high, handheld_advice, caveat,
  confidence, atlas_verified, status
) values
('resolution', 'Resolution', 'Display', 'The number of pixels rendered for the final image; usually one of the largest performance levers.', 'Higher output resolution asks the GPU to shade more pixels every frame. Native resolution is sharpest, while a lower resolution or render scale can create a large FPS gain at the cost of clarity.', 5, 5, 2, 1, 0, 'Lower it when the GPU is near full load and upscaling alone cannot hold the target frame rate.', 'Keep it native when text clarity and fine detail matter and the frame-time target is already stable.', 'On a handheld screen, a modest drop combined with a good quality upscaler often looks cleaner than expected.', 'Display scaling, panel resolution and internal render resolution are not always the same option.', 3, false, 'published'),
('render-scale', 'Render Scale', 'Display', 'Changes internal rendering resolution without changing the output resolution.', 'A lower render scale reduces the number of pixels the GPU renders, then stretches the image to the selected output resolution.', 5, 5, 2, 1, 0, 'Lower it when GPU load is the main limit and the game lacks a better upscaler.', 'Keep it at 100% when the game is already stable or the scaling filter produces obvious shimmer.', 'Small steps such as 90% or 80% can be useful on dense handheld displays.', 'Some games label the percentage differently or combine it with dynamic resolution.', 3, false, 'published'),
('upscaling-mode', 'Upscaling Mode', 'Upscaling', 'Balances image reconstruction quality against internal render resolution and FPS.', 'Quality, Balanced, Performance and Ultra Performance modes usually render progressively fewer internal pixels before reconstructing the output image.', 5, 4, 2, 1, 1, 'Use a faster mode when the GPU cannot hold the target FPS at the current output resolution.', 'Use Quality or native rendering when fine detail, text and distant geometry remain stable without a faster mode.', 'Quality is the safest starting point at 1080p; Balanced can be a practical fallback when a heavy game needs more headroom.', 'The same mode can look very different between FSR, XeSS, DLSS and game-specific implementations.', 3, false, 'published'),
('frame-generation', 'Frame Generation', 'Upscaling', 'Creates intermediate frames to raise displayed FPS, but does not replace a healthy base frame rate.', 'Frame generation can make motion look smoother by inserting generated frames. Controls, simulation and the original render still run at the base frame rate.', 4, 2, 2, 1, 5, 'Enable it when base performance is already reasonably stable and you want smoother presentation.', 'Disable it when latency, HUD artifacts or unstable base frame times are more distracting than the extra displayed frames.', 'Aim for a stable base near 40 FPS or higher before treating generated frames as a win.', 'Displayed FPS can rise dramatically while input latency and 1% lows improve far less.', 3, false, 'published'),
('texture-quality', 'Texture Quality', 'Textures', 'Controls texture detail and usually affects VRAM far more than raw FPS.', 'Higher textures keep surfaces sharper at close range. Performance is often similar until memory pressure causes streaming stutter, missing detail or sudden frame-time spikes.', 1, 5, 5, 1, 0, 'Lower it when VRAM is full, textures stream late or traversal produces repeated stutter.', 'Keep it high when memory headroom remains and surface detail is visibly better.', 'Shared-memory handhelds need enough reserved memory for the game and Windows; do not judge textures by average FPS alone.', 'Texture packs and engine streaming behavior can change the memory cost drastically.', 3, false, 'published'),
('texture-streaming-budget', 'Texture Streaming Budget', 'Textures', 'Sets how much memory the engine may reserve for streamed textures.', 'A higher budget can reduce blurry texture pop-in but may exceed available VRAM. A lower budget can prevent memory pressure while making detail stream later.', 1, 4, 5, 1, 0, 'Lower it when VRAM is saturated or the game shows large frame-time spikes after moving through new areas.', 'Keep it higher when texture pop-in is obvious and memory headroom remains.', 'Match the budget to the actual VRAM allocation instead of blindly selecting the largest number.', 'Some engines report budgets in a way that does not map directly to physical VRAM.', 3, false, 'published'),
('anisotropic-filtering', 'Anisotropic Filtering', 'Textures', 'Keeps textures sharper when viewed at an angle and is usually cheap on modern GPUs.', 'Roads, floors and distant surfaces remain clearer at 8x or 16x. The performance cost is normally small compared with the visual benefit.', 1, 3, 1, 0, 0, 'Lower it only after heavier options have already been tuned or when a specific game implements it badly.', 'Keep it high in most games because the image-quality gain is usually inexpensive.', '8x or 16x is commonly a sensible handheld value.', 'Very old or unusual engines can behave differently.', 3, false, 'published'),
('shadow-quality', 'Shadow Quality', 'Shadows', 'Controls shadow resolution, filtering, distance and sometimes the number of shadow-casting objects.', 'Shadows can load the GPU and CPU at the same time. Very high values often increase distance and resolution more than they improve the scene.', 4, 3, 2, 3, 0, 'Lower it when GPU load is high, busy areas hurt 1% lows or distant shadow detail is not worth the cost.', 'Keep it medium or high when low settings cause distracting flicker, pop-in or flat lighting.', 'Medium is often the safest first handheld compromise.', 'Some games split shadow distance, resolution and contact shadows into separate options.', 3, false, 'published'),
('contact-shadows', 'Contact Shadows', 'Shadows', 'Adds small local shadows where objects meet nearby surfaces.', 'Contact shadows improve grounding around characters and small objects but can add a moderate rendering cost.', 2, 3, 1, 1, 0, 'Lower or disable it when chasing a final few FPS after larger options are already tuned.', 'Keep it enabled when characters look detached from the environment without it.', 'Treat it as a second-pass option rather than the first thing to cut.', 'The cost can rise when the effect uses ray tracing.', 2, false, 'published'),
('ambient-occlusion', 'Ambient Occlusion', 'Lighting', 'Adds soft shading in corners and where objects sit close together.', 'Ambient occlusion gives scenes depth and contact. Higher-quality methods reduce noise and halos but can cost several FPS.', 3, 4, 2, 1, 0, 'Lower it when the game remains GPU-bound after resolution, shadows and volumetrics are tuned.', 'Keep at least a lower mode when disabling it makes scenes look flat or objects appear to float.', 'Low or medium often preserves most of the depth on a handheld screen.', 'SSAO, HBAO, GTAO and ray-traced AO have very different costs.', 3, false, 'published'),
('global-illumination', 'Global Illumination', 'Lighting', 'Simulates indirect light bouncing through the scene.', 'Global illumination can be a major part of a game’s visual identity. Software techniques range from moderate to heavy, while ray-traced variants are usually very expensive.', 4, 5, 3, 2, 0, 'Lower it when lighting is a major GPU cost and a simpler mode remains visually coherent.', 'Keep it higher when the game relies on indirect lighting for readable interiors and atmosphere.', 'Prefer the non-ray-traced or medium option when available.', 'Implementation differences are enormous; measured game evidence matters more than the generic score.', 2, false, 'published'),
('volumetric-quality', 'Volumetric Quality', 'Lighting', 'Controls fog, clouds, light shafts and other effects rendered through a volume.', 'Volumetrics often sample many points through the scene and can be one of the heaviest GPU settings, especially at high resolution.', 5, 4, 2, 1, 0, 'Lower it when weather, foggy scenes or bright light shafts cause the biggest drops.', 'Keep it higher when atmosphere is central to the game and the performance target still has headroom.', 'Medium commonly keeps the mood while cutting a large chunk of the cost.', 'Clouds and fog may be separate options in some games.', 3, false, 'published'),
('screen-space-reflections', 'Screen Space Reflections', 'Reflections', 'Creates reflections using information already visible on the screen.', 'SSR improves wet roads, floors and shiny surfaces but can produce missing reflections at screen edges. Higher quality increases samples and resolution.', 4, 4, 2, 1, 0, 'Lower it when reflective scenes are heavy or the artifacts are visible anyway.', 'Keep it medium or high when reflections are prominent and the game has enough GPU headroom.', 'Medium is often a good compromise; low can shimmer badly in motion.', 'The cost depends on how much of the scene is reflective.', 3, false, 'published'),
('reflection-quality', 'Reflection Quality', 'Reflections', 'Controls the resolution, update rate or complexity of non-ray-traced reflections.', 'Games may use cubemaps, probes, planar reflections or a combination. Higher settings can update more often or render more scene detail.', 3, 4, 2, 2, 0, 'Lower it around water, mirrors or glossy environments that cause repeatable drops.', 'Keep it high when reflections are a major visual feature and the cheaper modes update too slowly.', 'Use medium before disabling reflections completely.', 'This label is broad; check the game-specific note when available.', 2, false, 'published'),
('view-distance', 'View Distance', 'World detail', 'Controls how far detailed objects, shadows or simulation elements remain active.', 'Higher view distance can pressure both the CPU and GPU by keeping more objects and detail visible.', 4, 4, 2, 5, 0, 'Lower it when dense open worlds are CPU-bound or 1% lows collapse while moving quickly.', 'Keep it high when pop-in is distracting and the CPU still has headroom.', 'Medium often protects frame-time stability better than dropping purely visual effects.', 'Some games separate object, foliage and shadow distance.', 3, false, 'published'),
('crowd-density', 'Crowd Density', 'World detail', 'Changes how many NPCs or traffic actors are simulated in busy areas.', 'Crowd density is commonly CPU-heavy because every actor needs animation, navigation and simulation work.', 4, 2, 2, 5, 0, 'Lower it when cities, hubs or traffic cause poor 1% lows while GPU usage is below full load.', 'Keep it higher when world population matters and the CPU still holds the target frame time.', 'This is one of the first settings to test during a CPU bottleneck.', 'The exact effect depends on whether density changes are applied immediately or after reloading an area.', 3, false, 'published'),
('foliage-quality', 'Foliage Quality', 'World detail', 'Controls plant density, draw distance, animation and sometimes foliage shadows.', 'Dense foliage can stress geometry, transparency, shadows and the CPU at the same time.', 4, 4, 2, 4, 0, 'Lower it in forests or grass-heavy scenes that create repeatable frame drops.', 'Keep it higher when low values cause obvious bare terrain or aggressive pop-in.', 'Medium usually preserves the world better than low while cutting a meaningful cost.', 'Grass density and foliage distance may be separate settings.', 3, false, 'published'),
('geometry-quality', 'Geometry Quality', 'World detail', 'Controls model detail, tessellation, mesh distance or the number of objects rendered.', 'Higher geometry settings reduce visible level-of-detail transitions but can pressure the GPU, CPU and memory bandwidth.', 3, 4, 3, 3, 0, 'Lower it when open scenes or dense objects hurt frame times and pop-in remains acceptable.', 'Keep it high when character or vehicle silhouettes visibly degrade.', 'Medium is usually safer than minimum because extreme LOD pop-in is obvious on moving handheld gameplay.', 'The label may cover several different engine systems.', 2, false, 'published'),
('effects-quality', 'Effects Quality', 'Effects', 'Controls particles, transparency, explosions and temporary visual effects.', 'Effects quality can become expensive during combat even when quiet scenes run well. It may change particle counts, lighting and simulation detail.', 3, 3, 2, 2, 0, 'Lower it when explosions, spells or firefights produce the worst 1% lows.', 'Keep it higher when combat readability or spectacle suffers too much.', 'Test it in the busiest combat scene, not an empty menu corridor.', 'Average FPS can hide the short spikes this setting causes.', 3, false, 'published'),
('particle-quality', 'Particle Quality', 'Effects', 'Changes the amount, lifetime or detail of smoke, sparks, debris and similar effects.', 'Large particle systems can stress fill rate and simulation, especially when many transparent layers overlap.', 3, 3, 2, 2, 0, 'Lower it when smoke-heavy battles or weather effects create sudden drops.', 'Keep it high when particles carry important visual feedback and performance remains stable.', 'Medium often keeps combat readable with fewer worst-case spikes.', 'Some games include particles inside a broader Effects setting.', 2, false, 'published'),
('hair-quality', 'Hair Quality', 'Effects', 'Controls strand density, simulation and shading for hair or fur.', 'Advanced hair systems can be expensive on both the GPU and CPU, especially on close character shots.', 3, 3, 2, 3, 0, 'Lower it when character-heavy scenes are disproportionately expensive.', 'Keep it higher for cutscene-focused games when the performance target allows it.', 'Medium usually avoids the harshest visual downgrade while reducing simulation cost.', 'The option may only affect a few characters, so benchmark the right scene.', 2, false, 'published'),
('anti-aliasing', 'Anti-Aliasing', 'Post-processing', 'Reduces jagged edges and shimmer, often while helping reconstruct fine detail.', 'Modern TAA-style methods can stabilize the image but may add blur. MSAA is sharper in some engines but can be much heavier.', 2, 4, 2, 1, 0, 'Lower or change the method when the current AA is unusually expensive or overly blurry.', 'Keep a stable AA method when foliage, wires and distant edges shimmer without it.', 'Avoid disabling anti-aliasing entirely on a small high-density screen unless another reconstruction method replaces it.', 'The method matters more than the generic label.', 3, false, 'published'),
('post-processing-quality', 'Post-processing Quality', 'Post-processing', 'Groups several screen-space effects such as tone mapping, blur, bloom and color treatment.', 'This broad option can change many small effects at once. The total cost is often moderate, but the visual change can vary dramatically by game.', 2, 3, 1, 1, 0, 'Lower it after the major rendering costs are tuned or when the game’s effect stack looks overly heavy.', 'Keep it high when the lower mode changes the game’s tone, lighting or readability.', 'Compare screenshots because the label may hide several unrelated effects.', 'A single score cannot describe every effect grouped under this option.', 2, false, 'published'),
('motion-blur', 'Motion Blur', 'Post-processing', 'Blends motion across frames to make movement look smoother or more cinematic.', 'Motion blur usually has little performance cost. Disabling it is mainly a clarity and comfort choice.', 0, 2, 0, 0, 1, 'Disable it when it reduces clarity, causes discomfort or hides fine detail during camera movement.', 'Keep it when low frame rates look too juddery or the game’s presentation benefits from it.', 'Choose based on comfort rather than expecting a meaningful FPS gain.', 'Per-object and camera blur can be separate settings.', 3, false, 'published'),
('depth-of-field', 'Depth of Field', 'Post-processing', 'Blurs areas outside the camera’s focus, usually in cutscenes or aiming effects.', 'Depth of field can add cinematic focus but often has only a small performance cost.', 1, 2, 1, 0, 0, 'Disable it for a clearer image or when the effect is distracting during gameplay.', 'Keep it when the game uses it well in cutscenes and performance is already stable.', 'Treat it as a preference option, not a primary optimization lever.', 'Some high-quality bokeh implementations can be heavier than the generic score suggests.', 2, false, 'published'),
('bloom', 'Bloom', 'Post-processing', 'Adds glow around bright lights and emissive surfaces.', 'Bloom is normally inexpensive and mainly changes the presentation of bright scenes.', 1, 2, 0, 0, 0, 'Lower or disable it when highlights look washed out or the effect hurts clarity.', 'Keep it when neon, magic or sunlight looks flat without it.', 'Change it for taste, not as an early FPS fix.', 'Certain cinematic implementations can cost more.', 2, false, 'published'),
('ray-tracing', 'Ray Tracing', 'Ray tracing', 'Uses hardware ray traversal for lighting, reflections or shadows and is usually one of the heaviest options.', 'Ray tracing can improve realism but carries a large GPU cost and may increase memory use. The exact result depends on which effects are traced.', 5, 5, 4, 2, 1, 'Disable it when the handheld cannot hold a stable base frame rate or requires an aggressive upscaler to compensate.', 'Keep it only when the visual gain is obvious and the lower frame-rate target is intentional.', 'Start with ray tracing off. Add one traced effect at a time only after the non-RT preset is stable.', 'A single Ray Tracing toggle may enable several effects with different costs.', 3, false, 'published'),
('ray-traced-reflections', 'Ray-Traced Reflections', 'Ray tracing', 'Traces reflection rays beyond the limits of screen-space reflections.', 'Ray-traced reflections can show off-screen objects and improve stability, but the cost is very high on handheld-class GPUs.', 5, 5, 4, 1, 1, 'Disable it when reflective scenes cause major drops or require a very low internal resolution.', 'Keep it for a deliberate low-FPS quality mode when reflections are central to the game.', 'Use SSR or a lower RT quality before sacrificing the entire frame-rate target.', 'Roughness cutoffs and reflection resolution can change the cost substantially.', 3, false, 'published'),
('ray-traced-lighting', 'Ray-Traced Lighting', 'Ray tracing', 'Uses traced rays for direct or indirect lighting and can reshape the entire scene.', 'Ray-traced lighting often has a larger and more consistent cost than a single reflection or shadow effect.', 5, 5, 4, 2, 1, 'Disable it when the base frame rate is unstable or the game already has a strong raster lighting path.', 'Keep it only when the lighting difference is worth a lower target and aggressive reconstruction.', 'This is rarely a sensible first-choice handheld option.', 'Quality levels can represent radically different ray counts and bounce methods.', 3, false, 'published'),
('v-sync', 'V-Sync', 'Frame pacing', 'Synchronizes frame presentation to the display refresh cycle to prevent tearing.', 'V-Sync does not make the GPU render faster. It can improve presentation but may add latency or create frame-rate steps when performance falls below refresh.', 0, 0, 0, 0, 4, 'Disable it when variable refresh is available and latency matters more than tearing protection.', 'Keep it when tearing is distracting and the frame rate can stay near the chosen cap.', 'On VRR handhelds, use the device’s recommended VRR and cap strategy instead of blindly forcing every sync option on.', 'Driver, game and display sync settings can interact.', 3, false, 'published'),
('frame-rate-limit', 'Frame Rate Limit', 'Frame pacing', 'Caps FPS to stabilize power use, heat and frame pacing.', 'A cap does not increase maximum performance, but it can reduce power draw and prevent the device from oscillating between unstable frame times.', 0, 0, 0, 0, 2, 'Lower the cap when the device cannot hold a higher target consistently or battery life matters more than peak FPS.', 'Raise it when the system has real headroom and the display can show the extra frames.', 'A stable 40 FPS target can feel better than an unstable 45–60 FPS range.', 'The best cap depends on refresh rate, VRR range and input-latency priorities.', 4, false, 'published'),
('chromatic-aberration', 'Chromatic Aberration', 'Post-processing', 'Adds colored fringing near image edges for a lens-like effect.', 'Chromatic aberration is normally almost free and is purely a presentation preference.', 0, 1, 0, 0, 0, 'Disable it when you want a cleaner image or the color fringing is distracting.', 'Keep it only when you like the intended cinematic look.', 'Do not expect an FPS gain from disabling it.', 'The effect can be bundled into a larger post-processing toggle.', 3, false, 'published'),
('film-grain', 'Film Grain', 'Post-processing', 'Adds animated noise to imitate photographic film.', 'Film grain normally has negligible performance cost and changes perceived clarity rather than geometry or lighting.', 0, 1, 0, 0, 0, 'Disable it for a cleaner handheld image or when compression and upscaling already create noise.', 'Keep it when the art direction deliberately relies on a filmic texture.', 'Treat it as a taste setting.', 'It may be part of a broader post-processing preset.', 3, false, 'published')
on conflict (slug) do nothing;

with alias_seed(slug, alias) as (
  values
  ('resolution', 'Resolution'), ('resolution', 'Display Resolution'), ('resolution', 'Screen Resolution'),
  ('render-scale', 'Render Scale'), ('render-scale', 'Resolution Scale'), ('render-scale', 'Rendering Scale'), ('render-scale', '3D Resolution'),
  ('upscaling-mode', 'Upscaling Mode'), ('upscaling-mode', 'FSR Mode'), ('upscaling-mode', 'XeSS Mode'), ('upscaling-mode', 'DLSS Mode'), ('upscaling-mode', 'Super Resolution'),
  ('frame-generation', 'Frame Generation'), ('frame-generation', 'AFMF'), ('frame-generation', 'FSR Frame Generation'), ('frame-generation', 'DLSS Frame Generation'),
  ('texture-quality', 'Texture Quality'), ('texture-quality', 'Textures'), ('texture-quality', 'Texture Detail'), ('texture-quality', 'Texture Resolution'),
  ('texture-streaming-budget', 'Texture Streaming Budget'), ('texture-streaming-budget', 'Texture Pool Size'), ('texture-streaming-budget', 'Streaming Pool'),
  ('anisotropic-filtering', 'Anisotropic Filtering'), ('anisotropic-filtering', 'Texture Filtering'), ('anisotropic-filtering', 'AF'),
  ('shadow-quality', 'Shadow Quality'), ('shadow-quality', 'Shadows'), ('shadow-quality', 'Shadow Detail'), ('shadow-quality', 'Shadow Resolution'),
  ('contact-shadows', 'Contact Shadows'), ('contact-shadows', 'Contact Shadow Quality'),
  ('ambient-occlusion', 'Ambient Occlusion'), ('ambient-occlusion', 'SSAO'), ('ambient-occlusion', 'HBAO'), ('ambient-occlusion', 'GTAO'),
  ('global-illumination', 'Global Illumination'), ('global-illumination', 'Indirect Lighting'), ('global-illumination', 'GI Quality'),
  ('volumetric-quality', 'Volumetric Quality'), ('volumetric-quality', 'Volumetric Fog'), ('volumetric-quality', 'Fog Quality'), ('volumetric-quality', 'Volumetrics'), ('volumetric-quality', 'Cloud Quality'),
  ('screen-space-reflections', 'Screen Space Reflections'), ('screen-space-reflections', 'SSR'), ('screen-space-reflections', 'SSR Quality'),
  ('reflection-quality', 'Reflection Quality'), ('reflection-quality', 'Reflections'), ('reflection-quality', 'Mirror Quality'),
  ('view-distance', 'View Distance'), ('view-distance', 'Draw Distance'), ('view-distance', 'Level of Detail Distance'), ('view-distance', 'LOD Distance'),
  ('crowd-density', 'Crowd Density'), ('crowd-density', 'NPC Density'), ('crowd-density', 'Population Density'), ('crowd-density', 'Traffic Density'),
  ('foliage-quality', 'Foliage Quality'), ('foliage-quality', 'Vegetation Quality'), ('foliage-quality', 'Grass Quality'), ('foliage-quality', 'Foliage Density'),
  ('geometry-quality', 'Geometry Quality'), ('geometry-quality', 'Mesh Quality'), ('geometry-quality', 'Model Quality'), ('geometry-quality', 'Object Detail'), ('geometry-quality', 'Level of Detail'),
  ('effects-quality', 'Effects Quality'), ('effects-quality', 'Visual Effects'), ('effects-quality', 'VFX Quality'),
  ('particle-quality', 'Particle Quality'), ('particle-quality', 'Particles'), ('particle-quality', 'Particle Effects'),
  ('hair-quality', 'Hair Quality'), ('hair-quality', 'Hairworks'), ('hair-quality', 'Fur Quality'),
  ('anti-aliasing', 'Anti-Aliasing'), ('anti-aliasing', 'Anti Aliasing'), ('anti-aliasing', 'TAA'), ('anti-aliasing', 'MSAA'), ('anti-aliasing', 'SMAA'),
  ('post-processing-quality', 'Post-processing Quality'), ('post-processing-quality', 'Post Processing'), ('post-processing-quality', 'Post FX'),
  ('motion-blur', 'Motion Blur'), ('motion-blur', 'Camera Motion Blur'), ('motion-blur', 'Per Object Motion Blur'),
  ('depth-of-field', 'Depth of Field'), ('depth-of-field', 'DoF'),
  ('bloom', 'Bloom'), ('bloom', 'Light Bloom'),
  ('ray-tracing', 'Ray Tracing'), ('ray-tracing', 'RT Quality'), ('ray-tracing', 'Hardware Ray Tracing'),
  ('ray-traced-reflections', 'Ray-Traced Reflections'), ('ray-traced-reflections', 'Ray Traced Reflections'), ('ray-traced-reflections', 'RT Reflections'),
  ('ray-traced-lighting', 'Ray-Traced Lighting'), ('ray-traced-lighting', 'Ray Traced Lighting'), ('ray-traced-lighting', 'RT Lighting'), ('ray-traced-lighting', 'Path Tracing'),
  ('v-sync', 'V-Sync'), ('v-sync', 'VSync'), ('v-sync', 'Vertical Sync'),
  ('frame-rate-limit', 'Frame Rate Limit'), ('frame-rate-limit', 'FPS Limit'), ('frame-rate-limit', 'Frame Cap'), ('frame-rate-limit', 'Maximum FPS'),
  ('chromatic-aberration', 'Chromatic Aberration'),
  ('film-grain', 'Film Grain')
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
