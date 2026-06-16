import Link from "next/link";
import {
  CONTENT_EDITOR_ROLES,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";
import { parseSettingNote } from "../../../lib/preset-guidance";

interface PresetQualityPageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

interface QualitySettingItem {
  id: string;
  label: string;
  value: string;
  note: string | null;
}

interface QualitySettingGroup {
  id: string;
  name: string;
  preset_setting_items: QualitySettingItem[];
}

interface QualityPreset {
  id: string;
  name: string;
  preset_type: string;
  status: "draft" | "published" | "archived";
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  summary: string | null;
  atlas_verified: boolean;
  created_at: string;
  games:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  handhelds:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  preset_setting_groups: QualitySettingGroup[];
}

type QualityLevel =
  | "ready"
  | "needs-work"
  | "critical";

interface PresetAuditResult {
  preset: QualityPreset;
  score: number;
  level: QualityLevel;
  issues: string[];
  completeSettings: number;
  structuredNotes: number;
  defaultComparisons: number;
}

function getRelationValue<T>(
  relation: T | T[] | null,
) {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation)
    ? relation[0] ?? null
    : relation;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function auditPreset(
  preset: QualityPreset,
): PresetAuditResult {
  const groups =
    preset.preset_setting_groups ?? [];

  const items = groups.flatMap(
    (group) =>
      group.preset_setting_items ?? [],
  );

  const completeSettings = items.filter(
    (item) =>
      item.label.trim().length > 0 &&
      item.value.trim().length > 0,
  ).length;

  const parsedNotes = items.map((item) =>
    parseSettingNote(item.note),
  );

  const structuredNotes = parsedNotes.filter(
    (note) => note.hasStructuredData,
  ).length;

  const defaultComparisons = parsedNotes.filter(
    (note) => note.defaultValue,
  ).length;

  const game = getRelationValue(preset.games);
  const handheld = getRelationValue(
    preset.handhelds,
  );

  const hasIdentity = Boolean(
    preset.name.trim() &&
      game?.name &&
      handheld?.name,
  );

  const hasTarget = Boolean(
    preset.resolution?.trim() &&
      preset.tdp?.trim(),
  );

  const hasPerformance =
    preset.fps_average !== null &&
    preset.one_percent_low !== null;

  const hasUsefulSummary =
    (preset.summary?.trim().length ?? 0) >= 60;

  const hasConfiguration =
    groups.some(
      (group) => group.name.trim().length > 0,
    ) && completeSettings >= 3;

  const checks = [
    { complete: hasIdentity, weight: 10 },
    { complete: hasTarget, weight: 15 },
    { complete: hasPerformance, weight: 20 },
    { complete: hasUsefulSummary, weight: 10 },
    { complete: hasConfiguration, weight: 20 },
    { complete: structuredNotes > 0, weight: 10 },
    { complete: defaultComparisons > 0, weight: 5 },
    {
      complete: preset.atlas_verified,
      weight: 10,
    },
  ];

  const score = checks.reduce(
    (total, check) =>
      total + (check.complete ? check.weight : 0),
    0,
  );

  const issues: string[] = [];

  if (!hasTarget) {
    issues.push("Missing resolution or TDP");
  }

  if (!hasPerformance) {
    issues.push("Missing average FPS or 1% low");
  }

  if (
    preset.fps_average !== null &&
    preset.one_percent_low !== null &&
    preset.one_percent_low >
      preset.fps_average
  ) {
    issues.push("1% low is higher than average FPS");
  }

  if (!hasUsefulSummary) {
    issues.push("Summary is shorter than 60 characters");
  }

  if (completeSettings < 3) {
    issues.push("Fewer than three complete settings");
  }

  if (
    groups.some(
      (group) =>
        group.preset_setting_items?.length > 0 &&
        !group.name.trim(),
    )
  ) {
    issues.push("One or more settings groups are unnamed");
  }

  if (structuredNotes === 0) {
    issues.push("No structured impact explanation");
  }

  if (defaultComparisons === 0) {
    issues.push("No Default → Recommended comparison");
  }

  if (!preset.atlas_verified) {
    issues.push("Not Atlas Verified");
  }

  const hasCriticalIssue =
    preset.status === "published" &&
    (
      !hasIdentity ||
      !hasTarget ||
      !hasPerformance ||
      !hasConfiguration ||
      (
        preset.fps_average !== null &&
        preset.one_percent_low !== null &&
        preset.one_percent_low >
          preset.fps_average
      )
    );

  const level: QualityLevel =
    hasCriticalIssue
      ? "critical"
      : score >= 80 &&
          preset.status === "published"
        ? "ready"
        : "needs-work";

  return {
    preset,
    score,
    level,
    issues,
    completeSettings,
    structuredNotes,
    defaultComparisons,
  };
}

function getLevelStyle(level: QualityLevel) {
  switch (level) {
    case "ready":
      return "border-green-500/30 bg-green-500/10 text-green-300";
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }
}

function getLevelLabel(level: QualityLevel) {
  switch (level) {
    case "ready":
      return "Launch ready";
    case "critical":
      return "Critical gap";
    default:
      return "Needs work";
  }
}

export default async function PresetQualityPage({
  searchParams,
}: PresetQualityPageProps) {
  const { filter = "all" } =
    await searchParams;

  const { supabase } = await requireRole(
    CONTENT_EDITOR_ROLES,
    "/",
  );

  const { data, error } = await supabase
    .from("presets")
    .select(`
      id,
      name,
      preset_type,
      status,
      resolution,
      tdp,
      fps_average,
      one_percent_low,
      summary,
      atlas_verified,
      created_at,
      games (
        name,
        slug
      ),
      handhelds (
        name,
        slug
      ),
      preset_setting_groups (
        id,
        name,
        preset_setting_items (
          id,
          label,
          value,
          note
        )
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  const presets =
    (data ?? []) as unknown as QualityPreset[];

  const audits = presets
    .map(auditPreset)
    .sort((first, second) => {
      const levelOrder: Record<
        QualityLevel,
        number
      > = {
        critical: 0,
        "needs-work": 1,
        ready: 2,
      };

      const levelDifference =
        levelOrder[first.level] -
        levelOrder[second.level];

      return levelDifference !== 0
        ? levelDifference
        : first.score - second.score;
    });

  const counts = {
    all: audits.length,
    critical: audits.filter(
      (audit) =>
        audit.level === "critical",
    ).length,
    "needs-work": audits.filter(
      (audit) =>
        audit.level === "needs-work",
    ).length,
    ready: audits.filter(
      (audit) => audit.level === "ready",
    ).length,
  };

  const filteredAudits =
    filter === "critical" ||
    filter === "needs-work" ||
    filter === "ready"
      ? audits.filter(
          (audit) => audit.level === filter,
        )
      : audits;

  const averageScore = audits.length
    ? Math.round(
        audits.reduce(
          (total, audit) =>
            total + audit.score,
          0,
        ) / audits.length,
      )
    : 0;

  return (
    <main className="atlas-page min-h-screen pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <section className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(15,23,42,0.97),rgba(3,7,18,0.99))] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href="/admin/presets"
                className="text-sm font-black text-cyan-400 transition hover:text-white"
              >
                ← Back to presets
              </Link>

              <p className="mt-8 text-[0.62rem] font-black uppercase tracking-[0.22em] text-red-400">
                Pre-promo quality gate
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Preset Quality Audit
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                Find published presets missing reproducible test data,
                complete settings or useful explanations before users and
                search engines wander into the room with pitchforks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[34rem]">
              <MetricCard
                label="Total"
                value={counts.all}
              />
              <MetricCard
                label="Critical"
                value={counts.critical}
                tone="red"
              />
              <MetricCard
                label="Ready"
                value={counts.ready}
                tone="green"
              />
              <MetricCard
                label="Average"
                value={`${averageScore}%`}
                tone="cyan"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            Could not load preset audit: {error.message}
          </div>
        )}

        <nav className="mt-6 flex flex-wrap gap-2">
          <FilterLink
            href="/admin/preset-quality"
            label="All"
            count={counts.all}
            active={filter === "all"}
          />
          <FilterLink
            href="/admin/preset-quality?filter=critical"
            label="Critical"
            count={counts.critical}
            active={filter === "critical"}
          />
          <FilterLink
            href="/admin/preset-quality?filter=needs-work"
            label="Needs work"
            count={counts["needs-work"]}
            active={filter === "needs-work"}
          />
          <FilterLink
            href="/admin/preset-quality?filter=ready"
            label="Launch ready"
            count={counts.ready}
            active={filter === "ready"}
          />
        </nav>

        {filteredAudits.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-2xl font-black">
              Nothing in this queue
            </h2>
            <p className="mt-2 text-slate-500">
              Either the Atlas is beautifully clean or this filter has
              nothing to complain about. Both are suspiciously pleasant.
            </p>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {filteredAudits.map((audit) => {
              const game = getRelationValue(
                audit.preset.games,
              );
              const handheld = getRelationValue(
                audit.preset.handhelds,
              );

              return (
                <article
                  key={audit.preset.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
                >
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] ${getLevelStyle(
                            audit.level,
                          )}`}
                        >
                          {getLevelLabel(audit.level)}
                        </span>

                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-slate-400">
                          {audit.preset.status}
                        </span>

                        {audit.preset.atlas_verified && (
                          <span className="rounded-full border border-green-500/25 bg-green-500/[0.08] px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-green-300">
                            Atlas Verified
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-white">
                        {audit.preset.name}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {game?.name ?? "Unknown game"} · {handheld?.name ?? "Unknown handheld"} · {audit.preset.preset_type}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <AuditMetric
                          label="Complete settings"
                          value={audit.completeSettings}
                        />
                        <AuditMetric
                          label="Structured notes"
                          value={audit.structuredNotes}
                        />
                        <AuditMetric
                          label="Default comparisons"
                          value={audit.defaultComparisons}
                        />
                      </div>

                      {audit.issues.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {audit.issues.map((issue) => (
                            <span
                              key={issue}
                              className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 text-xs text-slate-400"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-5 text-sm font-bold text-green-300">
                          No quality gaps detected.
                        </p>
                      )}
                    </div>

                    <aside className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                        Quality score
                      </p>
                      <p className="mt-2 text-4xl font-black text-white">
                        {audit.score}%
                      </p>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-cyan-400"
                          style={{
                            width: `${audit.score}%`,
                          }}
                        />
                      </div>

                      <p className="mt-4 text-xs leading-5 text-slate-600">
                        Updated {formatDate(
                          audit.preset.created_at,
                        )}
                      </p>

                      <Link
                        href={`/admin/presets/${audit.preset.id}/edit`}
                        className="mt-5 flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400"
                      >
                        Open editor
                      </Link>

                      {game?.slug && (
                        <Link
                          href={`/games/${game.slug}`}
                          target="_blank"
                          className="mt-2 flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-slate-500 hover:text-white"
                        >
                          Open public game ↗
                        </Link>
                      )}
                    </aside>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "red" | "green" | "cyan";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-300"
      : tone === "green"
        ? "text-green-300"
        : tone === "cyan"
          ? "text-cyan-300"
          : "text-white";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
      <p className="text-[0.55rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function FilterLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
        active
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
          : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
      }`}
    >
      {label} · {count}
    </Link>
  );
}

function AuditMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <p className="text-[0.55rem] font-black uppercase tracking-[0.13em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}
