-- Replace article cover images with the matching gameplay performance captures.
-- Checked 2026-08-24 against the source article galleries on LegionGoLife.

with reviewed as (
  select *
  from (values
    (
      'diablo-iv',
      'Legion Go Life 1200p Quality Baseline',
      'https://legiongolife.com/wp-content/uploads/2023/11/Diablo-4-Legion-Go-Game-Settings-1.png'
    ),
    (
      'ghost-of-tsushima-directors-cut',
      'Legion Go Life 1200p Frame Generation Baseline',
      'https://legiongolife.com/wp-content/uploads/2024/05/Ghost-of-Tsushima-Legion-Go-5.png'
    ),
    (
      'red-dead-redemption-2',
      'Legion Go Life 800p Performance Baseline',
      'https://legiongolife.com/wp-content/uploads/2023/12/Red-Dead-Redemption-2-Legion-Go-2.png'
    )
  ) values_table(game_slug, preset_name, artifact_url)
)
update public.presets preset
set
  evidence_artifact_url = reviewed.artifact_url,
  updated_at = now()
from reviewed
join public.games game on game.slug = reviewed.game_slug
join public.handhelds handheld on handheld.slug = 'lenovo-legion-go-z1-extreme'
where preset.game_id = game.id
  and preset.handheld_id = handheld.id
  and preset.name = reviewed.preset_name
  and preset.evidence_artifact_type = 'performance_screenshot'
  and preset.evidence_exception_approved = true;
