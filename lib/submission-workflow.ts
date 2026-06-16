export const SUBMISSION_STATUSES = [
  "draft",
  "pending",
  "changes_requested",
  "rejected",
  "approved",
] as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_EVENT_TYPES = [
  "created",
  "submitted",
  "resubmitted",
  "withdrawn",
  "changes_requested",
  "rejected",
  "approved",
  "imported",
] as const;

export type SubmissionEventType =
  (typeof SUBMISSION_EVENT_TYPES)[number];

export interface SubmissionSettingInput {
  label: string;
  value: string;
}

export interface SubmissionGroupInput {
  name: string;
  items: SubmissionSettingInput[];
}

export interface SubmissionReadinessInput {
  gameId: string;
  handheldId: string;
  name: string;
  resolution: string;
  tdp: string;
  fpsAverage: string | number | null;
  onePercentLow: string | number | null;
  batteryLife: string;
  summary: string;
  groups: SubmissionGroupInput[];
}

export interface SubmissionReadinessCheck {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
}

export interface SubmissionReadiness {
  score: number;
  isReady: boolean;
  completeSettings: number;
  completeGroups: number;
  checks: SubmissionReadinessCheck[];
  issues: string[];
}

function hasNumericValue(
  value: string | number | null,
) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0;
  }

  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function getSubmissionReadiness(
  input: SubmissionReadinessInput,
): SubmissionReadiness {
  const completeGroups = input.groups.filter(
    (group) =>
      group.name.trim().length > 0 &&
      group.items.some(
        (item) =>
          item.label.trim().length > 0 &&
          item.value.trim().length > 0,
      ),
  ).length;

  const completeSettings = input.groups.reduce(
    (total, group) =>
      total +
      group.items.filter(
        (item) =>
          item.label.trim().length > 0 &&
          item.value.trim().length > 0,
      ).length,
    0,
  );

  const hasTestResult =
    hasNumericValue(input.fpsAverage) ||
    hasNumericValue(input.onePercentLow) ||
    input.batteryLife.trim().length >= 3;

  const checks: SubmissionReadinessCheck[] = [
    {
      id: "identity",
      label: "Game, handheld and preset name",
      detail:
        "The preset must identify exactly what it targets.",
      complete:
        input.gameId.trim().length > 0 &&
        input.handheldId.trim().length > 0 &&
        input.name.trim().length >= 4,
    },
    {
      id: "test-target",
      label: "Resolution and TDP",
      detail:
        "Readers need the exact test target before copying settings.",
      complete:
        input.resolution.trim().length > 0 &&
        input.tdp.trim().length > 0,
    },
    {
      id: "result",
      label: "Measured result",
      detail:
        "Add average FPS, 1% low or a tested battery-life result.",
      complete: hasTestResult,
    },
    {
      id: "summary",
      label: "Useful summary",
      detail:
        "Explain the goal, test conditions and important trade-offs in at least 50 characters.",
      complete: input.summary.trim().length >= 50,
    },
    {
      id: "settings",
      label: "At least three complete settings",
      detail:
        "A publishable preset needs one named group and three setting/value pairs.",
      complete:
        completeGroups >= 1 && completeSettings >= 3,
    },
  ];

  const completedChecks = checks.filter(
    (check) => check.complete,
  ).length;

  const score = Math.round(
    (completedChecks / checks.length) * 100,
  );

  const issues = checks
    .filter((check) => !check.complete)
    .map((check) => check.label);

  return {
    score,
    isReady: issues.length === 0,
    completeSettings,
    completeGroups,
    checks,
    issues,
  };
}

export function getSubmissionStatusLabel(
  status: SubmissionStatus,
) {
  switch (status) {
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Published";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function getSubmissionStatusDescription(
  status: SubmissionStatus,
) {
  switch (status) {
    case "draft":
      return "Private and editable. Finish the readiness checks before sending it to moderation.";
    case "pending":
      return "Locked while the Atlas moderation team reviews the submitted revision.";
    case "changes_requested":
      return "The moderator left actionable feedback. Edit the preset and resubmit a new revision.";
    case "rejected":
      return "The current revision was not accepted. You can still revise it or remove the submission.";
    case "approved":
      return "Approved and published in the public preset database.";
  }
}

export function getSubmissionStatusClassName(
  status: SubmissionStatus,
) {
  switch (status) {
    case "pending":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "approved":
      return "border-green-500/30 bg-green-500/10 text-green-300";
    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "changes_requested":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

export function isSubmissionEditable(
  status: SubmissionStatus,
) {
  return [
    "draft",
    "rejected",
    "changes_requested",
  ].includes(status);
}

export function getSubmissionEventLabel(
  eventType: SubmissionEventType,
) {
  switch (eventType) {
    case "created":
      return "Draft created";
    case "submitted":
      return "Submitted for review";
    case "resubmitted":
      return "New revision submitted";
    case "withdrawn":
      return "Withdrawn from review";
    case "changes_requested":
      return "Changes requested";
    case "rejected":
      return "Submission rejected";
    case "approved":
      return "Approved and published";
    case "imported":
      return "Workflow history started";
  }
}

export function getSubmissionEventClassName(
  eventType: SubmissionEventType,
) {
  switch (eventType) {
    case "approved":
      return "border-green-500/30 bg-green-500/10 text-green-300";
    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "changes_requested":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "submitted":
    case "resubmitted":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "withdrawn":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}
