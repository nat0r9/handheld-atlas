import {
  parseSettingNote,
} from "./preset-guidance";

export type PresetTrustTone =
  | "green"
  | "cyan"
  | "orange"
  | "slate";

export interface PresetTrustSetting {
  note: string | null;
}

export interface PresetTrustGroup {
  items: PresetTrustSetting[];
}

export interface PresetTrustInput {
  averageFps: number | null;
  onePercentLow: number | null;
  resolution: string | null;
  tdp: string | null;
  upscaler: string | null;
  batteryLife: string | null;
  summary: string | null;
  communityRating: number | null;
  upvoteCount: number;
  confirmationCount: number;
  atlasVerified: boolean;
  groups: PresetTrustGroup[];
}

export interface PresetTrustComponent {
  key:
    | "test-data"
    | "configuration"
    | "explanations"
    | "community"
    | "editorial";
  label: string;
  score: number;
  maximum: number;
  detail: string;
}

export interface PresetImpactSummary {
  settingsCount: number;
  explainedSettings: number;
  baselineSettings: number;
  performanceNotes: number;
  lowVisualImpactSettings: number;
  noticeableVisualImpactSettings: number;
  restartRequiredSettings: number;
  explanationCoverage: number;
  baselineCoverage: number;
}

export interface PresetTrustReport {
  score: number;
  label: string;
  tone: PresetTrustTone;
  summary: string;
  components: PresetTrustComponent[];
  impact: PresetImpactSummary;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function percentage(
  part: number,
  total: number,
) {
  if (total <= 0) {
    return 0;
  }

  return Math.round(
    (part / total) * 100,
  );
}

function getSettingsDepthScore(
  settingsCount: number,
) {
  if (settingsCount >= 40) {
    return 17;
  }

  if (settingsCount >= 20) {
    return 15;
  }

  if (settingsCount >= 10) {
    return 12;
  }

  if (settingsCount >= 5) {
    return 8;
  }

  if (settingsCount > 0) {
    return 4;
  }

  return 0;
}

function getGroupDepthScore(
  groupCount: number,
) {
  if (groupCount >= 3) {
    return 3;
  }

  return groupCount;
}

function getCoverageScore(
  coverage: number,
  maximum: number,
) {
  if (coverage >= 75) {
    return maximum;
  }

  if (coverage >= 50) {
    return Math.round(maximum * 0.75);
  }

  if (coverage >= 25) {
    return Math.round(maximum * 0.5);
  }

  if (coverage > 0) {
    return Math.round(maximum * 0.25);
  }

  return 0;
}

function getConfirmationScore(
  confirmationCount: number,
) {
  if (confirmationCount >= 10) {
    return 10;
  }

  if (confirmationCount >= 5) {
    return 8;
  }

  if (confirmationCount >= 2) {
    return 5;
  }

  if (confirmationCount === 1) {
    return 2;
  }

  return 0;
}

function getUpvoteScore(
  upvoteCount: number,
) {
  if (upvoteCount >= 5) {
    return 3;
  }

  if (upvoteCount >= 2) {
    return 2;
  }

  if (upvoteCount === 1) {
    return 1;
  }

  return 0;
}

function getRatingScore(
  rating: number | null,
) {
  if (rating === null) {
    return 0;
  }

  if (rating >= 4.5) {
    return 2;
  }

  if (rating >= 3.5) {
    return 1;
  }

  return 0;
}

function normalizeImpactText(
  value: string | null,
) {
  return value
    ?.trim()
    .toLowerCase() ?? "";
}

function getVisualImpactLevel(
  value: string | null,
): "low" | "noticeable" | null {
  const normalized =
    normalizeImpactText(value);

  const noticeable = [
    "medium",
    "moderate",
    "noticeable",
    "high",
    "major",
    "heavy",
    "large",
  ].some((keyword) =>
    normalized.includes(keyword),
  );

  if (noticeable) {
    return "noticeable";
  }

  const low = [
    "none",
    "no impact",
    "negligible",
    "minimal",
    "very low",
    "low",
    "minor",
    "small",
  ].some((keyword) =>
    normalized.includes(keyword),
  );

  return low ? "low" : null;
}

export function isLowVisualImpact(
  value: string | null,
) {
  return getVisualImpactLevel(value) === "low";
}

export function isNoticeableVisualImpact(
  value: string | null,
) {
  return getVisualImpactLevel(value) === "noticeable";
}

export function isRestartRequired(
  value: string | null,
) {
  const normalized =
    normalizeImpactText(value);

  if (!normalized) {
    return false;
  }

  return ![
    "no",
    "none",
    "not required",
    "without restart",
  ].some((keyword) =>
    normalized === keyword ||
    normalized.startsWith(`${keyword} `),
  );
}

export function calculatePresetTrust(
  input: PresetTrustInput,
): PresetTrustReport {
  const parsedSettings = input.groups.flatMap(
    (group) =>
      group.items.map((item) =>
        parseSettingNote(item.note),
      ),
  );

  const settingsCount =
    parsedSettings.length;

  const explainedSettings =
    parsedSettings.filter((note) =>
      Boolean(
        note.problem ||
          note.why ||
          note.description ||
          note.performanceImpact ||
          note.visualImpact,
      ),
    ).length;

  const baselineSettings =
    parsedSettings.filter((note) =>
      Boolean(note.defaultValue),
    ).length;

  const performanceNotes =
    parsedSettings.filter((note) =>
      Boolean(note.performanceImpact),
    ).length;

  const lowVisualImpactSettings =
    parsedSettings.filter((note) =>
      isLowVisualImpact(
        note.visualImpact,
      ),
    ).length;

  const noticeableVisualImpactSettings =
    parsedSettings.filter((note) =>
      isNoticeableVisualImpact(
        note.visualImpact,
      ),
    ).length;

  const restartRequiredSettings =
    parsedSettings.filter((note) =>
      isRestartRequired(note.restart),
    ).length;

  const explanationCoverage =
    percentage(
      explainedSettings,
      settingsCount,
    );

  const baselineCoverage =
    percentage(
      baselineSettings,
      settingsCount,
    );

  let testDataScore = 0;

  if (input.averageFps !== null) {
    testDataScore += 8;
  }

  if (input.onePercentLow !== null) {
    testDataScore += 8;
  }

  if (input.resolution) {
    testDataScore += 5;
  }

  if (input.tdp) {
    testDataScore += 5;
  }

  if (input.upscaler) {
    testDataScore += 2;
  }

  if (input.batteryLife) {
    testDataScore += 2;
  }

  const configurationScore =
    getSettingsDepthScore(
      settingsCount,
    ) +
    getGroupDepthScore(
      input.groups.length,
    );

  const summaryLength =
    input.summary?.trim().length ?? 0;

  const summaryScore =
    summaryLength >= 120
      ? 5
      : summaryLength >= 50
        ? 3
        : summaryLength > 0
          ? 1
          : 0;

  const explanationScore =
    getCoverageScore(
      explanationCoverage,
      12,
    );

  const baselineScore =
    getCoverageScore(
      baselineCoverage,
      5,
    );

  const impactCoverage =
    percentage(
      performanceNotes,
      settingsCount,
    );

  const impactScore =
    getCoverageScore(
      impactCoverage,
      3,
    );

  const documentationScore =
    summaryScore +
    explanationScore +
    baselineScore +
    impactScore;

  const communityScore =
    getConfirmationScore(
      input.confirmationCount,
    ) +
    getUpvoteScore(
      input.upvoteCount,
    ) +
    getRatingScore(
      input.communityRating,
    );

  const editorialScore =
    input.atlasVerified ? 10 : 0;

  const components: PresetTrustComponent[] = [
    {
      key: "test-data",
      label: "Test data",
      score: testDataScore,
      maximum: 30,
      detail:
        testDataScore >= 26
          ? "Frame rate, target resolution and power data are well documented."
          : "Add average FPS, 1% low, resolution and TDP to make the result reproducible.",
    },
    {
      key: "configuration",
      label: "Configuration depth",
      score: configurationScore,
      maximum: 20,
      detail:
        settingsCount > 0
          ? `${settingsCount} settings across ${input.groups.length} ${input.groups.length === 1 ? "group" : "groups"}.`
          : "No exact settings are recorded yet.",
    },
    {
      key: "explanations",
      label: "Explanation coverage",
      score: documentationScore,
      maximum: 25,
      detail:
        settingsCount > 0
          ? `${explanationCoverage}% explained · ${baselineCoverage}% include a default baseline.`
          : "Add structured notes to explain the reasoning and trade-offs.",
    },
    {
      key: "community",
      label: "Community proof",
      score: communityScore,
      maximum: 15,
      detail: `${input.confirmationCount} ${input.confirmationCount === 1 ? "matching-setup confirmation" : "matching-setup confirmations"} · ${input.upvoteCount} ${input.upvoteCount === 1 ? "upvote" : "upvotes"}.`,
    },
    {
      key: "editorial",
      label: "Atlas review",
      score: editorialScore,
      maximum: 10,
      detail: input.atlasVerified
        ? "An Atlas editor reviewed the target, data and configuration."
        : "Not yet marked Atlas Verified by an editor.",
    },
  ];

  const score = clamp(
    components.reduce(
      (total, component) =>
        total + component.score,
      0,
    ),
    0,
    100,
  );

  let label: string;
  let tone: PresetTrustTone;
  let summary: string;

  if (
    input.atlasVerified &&
    score >= 70
  ) {
    label = "Atlas Verified";
    tone = "green";
    summary =
      "Editor-reviewed with strong supporting data and transparent configuration notes.";
  } else if (score >= 80) {
    label = "High confidence";
    tone = "green";
    summary =
      "A well-documented preset with strong test data and community proof.";
  } else if (score >= 60) {
    label = "Strong evidence";
    tone = "cyan";
    summary =
      "The important target and settings are documented, with room for more validation.";
  } else if (score >= 40) {
    label = "Developing evidence";
    tone = "orange";
    summary =
      "Useful early data is present, but some testing or explanation gaps remain.";
  } else {
    label = "Early data";
    tone = "slate";
    summary =
      "Treat this as a starting point until more test data and confirmations arrive.";
  }

  return {
    score,
    label,
    tone,
    summary,
    components,
    impact: {
      settingsCount,
      explainedSettings,
      baselineSettings,
      performanceNotes,
      lowVisualImpactSettings,
      noticeableVisualImpactSettings,
      restartRequiredSettings,
      explanationCoverage,
      baselineCoverage,
    },
  };
}
