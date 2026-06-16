export type PresetProfileType =
  | "Performance"
  | "Balanced"
  | "Battery"
  | "Docked"
  | "Custom";

export interface PresetProfileGuide {
  label: string;
  shortLabel: string;
  bestFor: string;
  goal: string;
  tradeoff: string;
}

const profileGuides: Record<PresetProfileType, PresetProfileGuide> = {
  Performance: {
    label: "Performance",
    shortLabel: "More frames",
    bestFor: "players who prioritize responsiveness and the highest practical frame rate",
    goal: "Reduce the settings that cost the most performance while protecting clarity where it matters.",
    tradeoff: "Some visual effects or scene detail may be reduced.",
  },
  Balanced: {
    label: "Balanced",
    shortLabel: "Quality + speed",
    bestFor: "players who want a stable middle ground between image quality and smoothness",
    goal: "Keep the game looking strong without wasting performance on settings with weak visual payoff.",
    tradeoff: "It may not reach the highest FPS or the highest visual preset.",
  },
  Battery: {
    label: "Battery",
    shortLabel: "Longer sessions",
    bestFor: "portable play where lower power draw and longer battery life matter most",
    goal: "Hold a playable target at a lower TDP and avoid settings that burn power for marginal gains.",
    tradeoff: "Frame rate, resolution or visual quality may be capped more aggressively.",
  },
  Docked: {
    label: "Docked",
    shortLabel: "External display",
    bestFor: "plugged-in play on a monitor or TV with a higher power budget",
    goal: "Use the extra power headroom for a sharper output, higher frame rate or both.",
    tradeoff: "This profile is not designed around battery efficiency.",
  },
  Custom: {
    label: "Custom",
    shortLabel: "Specialist setup",
    bestFor: "a specific device, display, mod setup or personal performance target",
    goal: "Solve a narrower use case that does not fit the standard profile categories.",
    tradeoff: "Read the summary and notes carefully because the target can vary.",
  },
};

export function getPresetProfileGuide(
  type: PresetProfileType,
): PresetProfileGuide {
  return profileGuides[type];
}

export interface ParsedSettingNote {
  description: string | null;
  problem: string | null;
  why: string | null;
  performanceImpact: string | null;
  visualImpact: string | null;
  restart: string | null;
  defaultValue: string | null;
  hasStructuredData: boolean;
}

const fieldAliases: Record<
  string,
  keyof Omit<ParsedSettingNote, "description" | "hasStructuredData">
> = {
  problem: "problem",
  solves: "problem",
  issue: "problem",
  why: "why",
  reason: "why",
  explanation: "why",
  fps: "performanceImpact",
  performance: "performanceImpact",
  "performance impact": "performanceImpact",
  "expected fps": "performanceImpact",
  gain: "performanceImpact",
  visual: "visualImpact",
  quality: "visualImpact",
  "visual impact": "visualImpact",
  "quality impact": "visualImpact",
  restart: "restart",
  "requires restart": "restart",
  default: "defaultValue",
  baseline: "defaultValue",
  "default value": "defaultValue",
  "game default": "defaultValue",
};

export function parseSettingNote(note: string | null): ParsedSettingNote {
  const emptyResult: ParsedSettingNote = {
    description: null,
    problem: null,
    why: null,
    performanceImpact: null,
    visualImpact: null,
    restart: null,
    defaultValue: null,
    hasStructuredData: false,
  };

  if (!note?.trim()) {
    return emptyResult;
  }

  const result: ParsedSettingNote = { ...emptyResult };
  const descriptionParts: string[] = [];
  const segments = note
    .split(/\r?\n|\s+\|\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const match = segment.match(/^([^:]{2,32}):\s*(.+)$/);

    if (!match) {
      descriptionParts.push(segment);
      continue;
    }

    const rawKey = match[1].trim().toLowerCase();
    const value = match[2].trim();
    const field = fieldAliases[rawKey];

    if (!field || !value) {
      descriptionParts.push(segment);
      continue;
    }

    result[field] = result[field]
      ? `${result[field]} ${value}`
      : value;
    result.hasStructuredData = true;
  }

  result.description = descriptionParts.length
    ? descriptionParts.join(" ")
    : null;

  if (!result.hasStructuredData && result.description) {
    result.why = result.description;
    result.description = null;
  }

  return result;
}
