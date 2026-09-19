import { createClient } from "../supabase/public";
import { readAll } from "./read";
export interface BenchmarkIndex {
  id: string;
  game_id: string;
  handheld_id: string;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  published_at: string | null;
  evidence_tier: string;
  games: { name: string; slug: string } | null;
  handhelds: { name: string; slug: string } | null;
  presets: { name: string } | null;
}
export async function getBenchmarkIndex() {
  const db = await createClient();
  return readAll<BenchmarkIndex>(
    (from, to) =>
      db
        .from("benchmarks")
        .select(
          "id,game_id,handheld_id,resolution,tdp,average_fps,published_at,evidence_tier,games(name,slug),handhelds(name,slug),presets(name)",
        )
        .eq("status", "published")
        .order("id")
        .range(from, to),
    "benchmark index",
  );
}
