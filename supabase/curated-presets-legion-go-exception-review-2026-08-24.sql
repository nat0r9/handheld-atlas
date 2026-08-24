-- Editorial review of the first Legion Go Life preset batch.
-- Numeric FPS fields remain null because the sources do not provide exact,
-- repeatable captures. The linked images provide the approved visual proof.

with editor as (
  select id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
), reviewed as (
  select *
  from (values
    (
      'red-dead-redemption-2',
      'Legion Go Life 800p Performance Baseline',
      'https://legiongolife.com/wp-content/uploads/2023/10/Red-Dead-Redemption-2-Legion-Go-Game-Settings.jpg.webp',
      'Legion Go Life provides labelled 800p and 30W gameplay screenshots plus the complete settings table. The source does not disclose an exact average scalar, 1% low, current game build or driver, so those fields remain empty and the preset stays draft until its game profile is complete.'
    ),
    (
      'ghost-of-tsushima-directors-cut',
      'Legion Go Life 1200p Frame Generation Baseline',
      'https://legiongolife.com/wp-content/uploads/2024/05/Ghost-of-Tsushima-Legion-Go-Game-Settings.webp',
      'Legion Go Life provides labelled 1200p and 25W performance screenshots plus the complete settings table. The source uses frame generation but does not disclose base FPS, 1% low, current game build or driver, so numeric fields remain empty and the preset stays draft until its game profile is complete.'
    ),
    (
      'diablo-iv',
      'Legion Go Life 1200p Quality Baseline',
      'https://legiongolife.com/wp-content/uploads/2023/11/Diablo-4-Legion-Go-Game-Settings.webp',
      'Legion Go Life provides labelled 20W and 25W gameplay screenshots plus the complete settings table. The author reports a 50–60+ FPS range at 25W, but no exact average scalar, 1% low, game build or driver, so numeric fields remain empty and the public page carries this evidence exception.'
    )
  ) values_table(game_slug, preset_name, artifact_url, exception_reason)
)
update public.presets preset
set
  evidence_artifact_type = 'performance_screenshot',
  evidence_artifact_url = reviewed.artifact_url,
  evidence_exception_approved = true,
  evidence_exception_reason = reviewed.exception_reason,
  evidence_exception_approved_at = timestamptz '2026-08-24 18:00:00+02',
  evidence_exception_approved_by = editor.id,
  status = case
    when reviewed.game_slug = 'diablo-iv'
      then 'published'::public.content_status
    else preset.status
  end,
  published_at = case
    when reviewed.game_slug = 'diablo-iv'
      then coalesce(preset.published_at, timestamptz '2026-08-24 18:00:00+02')
    else preset.published_at
  end,
  summary = case reviewed.game_slug
    when 'diablo-iv' then
      'Historical Legion Go Life settings baseline for the original Legion Go Z1 Extreme at 1200p and 25W with 6GB VRAM and FSR 2 Quality. The source reports roughly 50–60+ FPS but no exact measured average or low-percentile data; use this as a transparent starting point and retest after major game or driver updates.'
    else preset.summary
  end
from reviewed
join public.games game on game.slug = reviewed.game_slug
cross join editor
where preset.game_id = game.id
  and preset.name = reviewed.preset_name
  and preset.evidence_tier = 'external_source';
