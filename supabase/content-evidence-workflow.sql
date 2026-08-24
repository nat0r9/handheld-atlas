-- Evidence provenance for presets and benchmark results.
-- Legacy records remain visible but must be classified before editorial reuse.

alter table public.presets
  add column if not exists evidence_tier text not null default 'legacy_unclassified',
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_checked_at date,
  add column if not exists game_version text,
  add column if not exists driver_version text,
  add column if not exists os_version text;

alter table public.benchmarks
  add column if not exists evidence_tier text not null default 'legacy_unclassified',
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists source_checked_at date,
  add column if not exists game_version text,
  add column if not exists driver_version text,
  add column if not exists os_version text,
  add column if not exists capture_tool text,
  add column if not exists capture_duration_seconds integer,
  add column if not exists run_count integer,
  add column if not exists point_one_percent_low numeric,
  add column if not exists test_route text,
  add column if not exists tested_at date;

update public.presets
set evidence_tier = 'atlas_verified'
where atlas_verified = true
  and evidence_tier = 'legacy_unclassified';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'presets_evidence_tier_valid'
  ) then
    alter table public.presets
      add constraint presets_evidence_tier_valid
      check (evidence_tier in (
        'atlas_verified',
        'community_verified',
        'external_source',
        'estimated',
        'legacy_unclassified'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'benchmarks_evidence_tier_valid'
  ) then
    alter table public.benchmarks
      add constraint benchmarks_evidence_tier_valid
      check (evidence_tier in (
        'atlas_verified',
        'community_verified',
        'external_source',
        'estimated',
        'legacy_unclassified'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'benchmarks_capture_duration_positive'
  ) then
    alter table public.benchmarks
      add constraint benchmarks_capture_duration_positive
      check (
        capture_duration_seconds is null
        or capture_duration_seconds > 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'benchmarks_run_count_positive'
  ) then
    alter table public.benchmarks
      add constraint benchmarks_run_count_positive
      check (run_count is null or run_count > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'benchmarks_point_one_low_nonnegative'
  ) then
    alter table public.benchmarks
      add constraint benchmarks_point_one_low_nonnegative
      check (
        point_one_percent_low is null
        or point_one_percent_low >= 0
      );
  end if;
end
$$;

create index if not exists presets_evidence_tier_idx
  on public.presets (evidence_tier);

create index if not exists benchmarks_evidence_tier_idx
  on public.benchmarks (evidence_tier);
