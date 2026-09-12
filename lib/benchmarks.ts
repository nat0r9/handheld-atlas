import type { PublicContributor } from "./contributors";
export interface BenchmarkRecord {
  id: string;
  created_by: string | null;
  contributor?: PublicContributor | null;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  one_percent_low: number | null;
  point_one_percent_low: number | null;
  battery_life: string | null;
  test_notes: string | null;
  evidence_tier: string;
  source_name: string | null;
  source_url: string | null;
  source_checked_at: string | null;
  tested_at: string | null;
  published_at: string | null;
  capture_tool: string | null;
  capture_duration_seconds: number | null;
  run_count: number | null;
  test_route: string | null;
  games: { name: string; slug: string } | null;
  handhelds: { name: string; slug: string; manufacturer: string } | null;
  presets: { id: string; name: string; preset_type: string } | null;
}
export const BENCHMARK_SELECT = `id, created_by, resolution, tdp, average_fps, one_percent_low, point_one_percent_low, battery_life, test_notes, evidence_tier, source_name, source_url, source_checked_at, tested_at, published_at, capture_tool, capture_duration_seconds, run_count, test_route, games(name,slug), handhelds(name,slug,manufacturer), presets(id,name,preset_type)`;
export function evidenceLabel(tier: string) {
  return (
    (
      {
        atlas_verified: "Atlas tested",
        community_verified: "Community benchmark",
        external_source: "External benchmark",
        estimated: "Estimated performance",
      } as Record<string, string>
    )[tier] ?? "Evidence awaiting review"
  );
}
export function settingsSummary(notes: string | null) {
  const match = notes?.match(
    /^SETTINGS:\s*([\s\S]*?)(?:\s+Historical\b|\n|$)/i,
  );
  return match?.[1]?.trim() || null;
}
export function dateLabel(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Not reported";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
