import BenchmarksCatalog, {
  type PublicBenchmark,
} from "../../components/BenchmarksCatalog";
import { createClient } from "../../lib/supabase/server";
import type { PublicContributor } from "../../lib/contributors";

interface DatabaseBenchmark {
  id: string;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  one_percent_low: number | null;
  battery_life: string | null;
  test_notes: string | null;
  published_at: string | null;
  created_by: string | null;
  evidence_tier: string;
  source_name: string | null;
  source_url: string | null;
  source_checked_at: string | null;
  tested_at: string | null;

  games: {
    name: string;
    slug: string;
  } | null;

  handhelds: {
    name: string;
    slug: string;
    manufacturer: string;
  } | null;

  presets: {
    id: string;
    name: string;
    preset_type: string;
  } | null;
}

export default async function BenchmarksPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("benchmarks")
    .select(`
      id,
      resolution,
      tdp,
      average_fps,
      one_percent_low,
      battery_life,
      test_notes,
      published_at,
      created_by,
      evidence_tier,
      source_name,
      source_url,
      source_checked_at,
      tested_at,
      games (
        name,
        slug
      ),
      handhelds (
        name,
        slug,
        manufacturer
      ),
      presets (
        id,
        name,
        preset_type
      )
    `)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  const databaseBenchmarks =
    (data ?? []) as unknown as DatabaseBenchmark[];

  const contributorIds = Array.from(new Set(databaseBenchmarks.map((benchmark) => benchmark.created_by).filter((value): value is string => Boolean(value))));
  let contributorMap = new Map<string, PublicContributor>();
  if (contributorIds.length > 0) {
    const { data: contributors } = await supabase
      .from("profiles")
      .select("id, display_name, public_slug, avatar_url, contributor_level, public_profile")
      .in("id", contributorIds);
    contributorMap = new Map(((contributors ?? []) as PublicContributor[]).map((profile) => [profile.id, profile]));
  }

  const benchmarks: PublicBenchmark[] =
    databaseBenchmarks.map((benchmark) => ({
      id: benchmark.id,
      resolution: benchmark.resolution,
      tdp: benchmark.tdp,
      averageFps: benchmark.average_fps,
      onePercentLow: benchmark.one_percent_low,
      batteryLife: benchmark.battery_life,
      testNotes: benchmark.test_notes,
      publishedAt: benchmark.published_at,
      evidenceTier: benchmark.evidence_tier,
      sourceName: benchmark.source_name,
      sourceUrl: benchmark.source_url,
      sourceCheckedAt: benchmark.source_checked_at,
      testedAt: benchmark.tested_at,
      game: benchmark.games,
      handheld: benchmark.handhelds,
      preset: benchmark.presets,
      contributor: benchmark.created_by ? contributorMap.get(benchmark.created_by) ?? null : null,
    }));

  return (
    <BenchmarksCatalog
      benchmarks={benchmarks}
      databaseError={error?.message ?? null}
    />
  );
}
