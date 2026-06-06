import BenchmarksCatalog, {
  type PublicBenchmark,
} from "../../components/BenchmarksCatalog";
import { createClient } from "../../lib/supabase/server";

interface DatabaseBenchmark {
  id: string;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  one_percent_low: number | null;
  battery_life: string | null;
  test_notes: string | null;
  published_at: string | null;

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
      game: benchmark.games,
      handheld: benchmark.handhelds,
      preset: benchmark.presets,
    }));

  return (
    <BenchmarksCatalog
      benchmarks={benchmarks}
      databaseError={error?.message ?? null}
    />
  );
}