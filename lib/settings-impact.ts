export const SETTING_IMPACT_CATEGORIES = [
  "Display",
  "Upscaling",
  "Anti-aliasing",
  "Textures",
  "Materials",
  "Lighting",
  "Shadows",
  "Reflections",
  "Effects",
  "Post-processing",
  "World detail",
  "Simulation",
  "Ray tracing",
  "Frame pacing",
  "Other",
] as const;

export const SETTING_IMPACT_COMMONNESS = [
  "common",
  "advanced",
  "specialized",
] as const;

export type SettingImpactCategory =
  (typeof SETTING_IMPACT_CATEGORIES)[number];

export type SettingImpactCommonness =
  (typeof SETTING_IMPACT_COMMONNESS)[number];

export type ImpactLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface SettingImpactAlias {
  alias: string;
  normalized_alias: string;
}

export interface GameSettingImpact {
  id: string;
  game_id: string;
  handheld_id: string | null;
  recommended_value: string | null;
  performance_change: string | null;
  visual_note: string | null;
  resolution: string | null;
  tdp: string | null;
  test_note: string | null;
  source_url: string | null;
  confidence: number;
  atlas_verified: boolean;
  games?: {
    name: string;
    slug: string;
  } | null;
  handhelds?: {
    name: string;
    slug: string;
  } | null;
}

export interface SettingImpactEntry {
  id: string;
  slug: string;
  name: string;
  category: SettingImpactCategory;
  commonness: SettingImpactCommonness;
  summary: string;
  description: string | null;
  performance_impact: ImpactLevel;
  visual_impact: ImpactLevel;
  vram_impact: ImpactLevel;
  cpu_impact: ImpactLevel;
  latency_impact: ImpactLevel;
  restart_required: boolean;
  when_to_lower: string | null;
  when_to_keep_high: string | null;
  handheld_advice: string | null;
  caveat: string | null;
  confidence: number;
  atlas_verified: boolean;
  status: "draft" | "published" | "archived";
  updated_at: string | null;
  setting_impact_aliases?: SettingImpactAlias[];
  game_setting_impacts?: GameSettingImpact[];
}

const impactLabels = [
  "None",
  "Very low",
  "Low",
  "Medium",
  "High",
  "Very high",
] as const;

export function getImpactLabel(value: number) {
  const safeValue = Math.min(5, Math.max(0, Math.round(value)));
  return impactLabels[safeValue];
}

export function getSettingCommonnessLabel(
  value: SettingImpactCommonness | string,
) {
  switch (value) {
    case "specialized":
      return "Specialized";
    case "advanced":
      return "Advanced";
    default:
      return "Common";
  }
}

export function getImpactExplanation(
  metric: "performance" | "visual" | "vram" | "cpu" | "latency",
) {
  switch (metric) {
    case "performance":
      return "How much lowering this setting can usually improve FPS or frame times.";
    case "visual":
      return "How noticeable the image-quality loss can be when the setting is reduced.";
    case "vram":
      return "How strongly the setting can affect video-memory usage.";
    case "cpu":
      return "How strongly the setting can load the processor rather than the GPU.";
    case "latency":
      return "How strongly the setting can affect input delay or frame presentation.";
  }
}

export function normalizeSettingKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function buildSettingImpactLookup(entries: SettingImpactEntry[]) {
  const lookup = new Map<string, SettingImpactEntry>();

  for (const entry of entries) {
    const keys = [
      entry.name,
      entry.slug,
      ...(entry.setting_impact_aliases ?? []).map((alias) => alias.alias),
    ];

    for (const key of keys) {
      const normalized = normalizeSettingKey(key);

      if (normalized && !lookup.has(normalized)) {
        lookup.set(normalized, entry);
      }
    }
  }

  return lookup;
}

export function findSettingImpact(
  label: string,
  lookup: Map<string, SettingImpactEntry>,
) {
  return lookup.get(normalizeSettingKey(label)) ?? null;
}

export function getGoalScore(
  entry: SettingImpactEntry,
  goal: "fps" | "vram" | "cpu" | "all",
) {
  switch (goal) {
    case "fps":
      return entry.performance_impact * 3 - entry.visual_impact;
    case "vram":
      return entry.vram_impact * 3 - entry.visual_impact;
    case "cpu":
      return entry.cpu_impact * 3 - entry.visual_impact;
    default:
      return entry.name.localeCompare(entry.name);
  }
}
