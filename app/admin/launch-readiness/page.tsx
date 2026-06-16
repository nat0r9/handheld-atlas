import Link from "next/link";
import { CONTENT_EDITOR_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

interface GameRow {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  notes: string | null;
  atlas_score: number | null;
  best_handheld: string | null;
  recommended_tdp: string | null;
}

interface HandheldRow {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  tagline: string | null;
  processor: string | null;
  memory: string | null;
  resolution: string | null;
  battery: string | null;
}

interface PresetRow {
  id: string;
  name: string;
  game_id: string | null;
  handheld_id: string | null;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  summary: string | null;
  atlas_verified: boolean;
}

interface BenchmarkRow {
  id: string;
  game_id: string | null;
  handheld_id: string | null;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  one_percent_low: number | null;
  test_notes: string | null;
}

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

type Severity = "critical" | "warning" | "ready";

interface AuditIssue {
  severity: Exclude<Severity, "ready">;
  area: string;
  title: string;
  detail: string;
  href: string;
  action: string;
}

interface AuditMetric {
  label: string;
  value: number;
  target: number;
  detail: string;
}

function hasText(value: string | null | undefined, minimum = 1) {
  return (value?.trim().length ?? 0) >= minimum;
}

function percentage(value: number, maximum: number) {
  if (maximum <= 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round((value / maximum) * 100)));
}

function getScoreTone(score: number) {
  if (score >= 85) {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  if (score >= 65) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function getSeverityStyle(severity: AuditIssue["severity"]) {
  return severity === "critical"
    ? "border-red-500/25 bg-red-500/[0.06] text-red-300"
    : "border-orange-500/25 bg-orange-500/[0.06] text-orange-300";
}

export default async function LaunchReadinessPage() {
  const { supabase } = await requireRole(CONTENT_EDITOR_ROLES, "/");

  const [
    gamesResult,
    handheldsResult,
    presetsResult,
    benchmarksResult,
    guidesResult,
    newsResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select(
        "id, name, slug, cover_image_url, notes, atlas_score, best_handheld, recommended_tdp",
      )
      .eq("status", "published")
      .order("name"),
    supabase
      .from("handhelds")
      .select(
        "id, name, slug, image_url, tagline, processor, memory, resolution, battery",
      )
      .eq("status", "published")
      .order("name"),
    supabase
      .from("presets")
      .select(
        "id, name, game_id, handheld_id, resolution, tdp, fps_average, one_percent_low, summary, atlas_verified",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("benchmarks")
      .select(
        "id, game_id, handheld_id, resolution, tdp, average_fps, one_percent_low, test_notes",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("guides")
      .select("id, title, slug, excerpt, content, cover_image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("news")
      .select("id, title, slug, excerpt, content, cover_image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false }),
  ]);

  const databaseErrors = [
    gamesResult.error,
    handheldsResult.error,
    presetsResult.error,
    benchmarksResult.error,
    guidesResult.error,
    newsResult.error,
  ].filter((error): error is NonNullable<typeof error> => Boolean(error));

  const games = (gamesResult.data ?? []) as GameRow[];
  const handhelds = (handheldsResult.data ?? []) as HandheldRow[];
  const presets = (presetsResult.data ?? []) as PresetRow[];
  const benchmarks = (benchmarksResult.data ?? []) as BenchmarkRow[];
  const guides = (guidesResult.data ?? []) as ArticleRow[];
  const news = (newsResult.data ?? []) as ArticleRow[];

  const issues: AuditIssue[] = [];
  let completedChecks = 0;
  let totalChecks = 0;

  function check(
    complete: boolean,
    issue: Omit<AuditIssue, "severity"> & { severity?: AuditIssue["severity"] },
  ) {
    totalChecks += 1;

    if (complete) {
      completedChecks += 1;
      return;
    }

    issues.push({
      severity: issue.severity ?? "warning",
      area: issue.area,
      title: issue.title,
      detail: issue.detail,
      href: issue.href,
      action: issue.action,
    });
  }

  const presetGameIds = new Set(
    presets.map((preset) => preset.game_id).filter((id): id is string => Boolean(id)),
  );
  const presetHandheldIds = new Set(
    presets
      .map((preset) => preset.handheld_id)
      .filter((id): id is string => Boolean(id)),
  );
  const benchmarkGameIds = new Set(
    benchmarks
      .map((benchmark) => benchmark.game_id)
      .filter((id): id is string => Boolean(id)),
  );
  const benchmarkHandheldIds = new Set(
    benchmarks
      .map((benchmark) => benchmark.handheld_id)
      .filter((id): id is string => Boolean(id)),
  );

  games.forEach((game) => {
    const href = `/admin/games/${game.id}/edit`;
    check(Boolean(game.cover_image_url), {
      severity: "critical",
      area: "Game",
      title: `${game.name} has no cover image`,
      detail: "Published game cards and social previews need a recognisable image.",
      href,
      action: "Edit game",
    });
    check(hasText(game.notes, 100), {
      area: "Game",
      title: `${game.name} has thin performance notes`,
      detail: "Add at least 100 characters of original handheld-specific context.",
      href,
      action: "Improve notes",
    });
    check(game.atlas_score !== null, {
      area: "Game",
      title: `${game.name} has no Atlas Score`,
      detail: "The public profile cannot communicate editorial compatibility yet.",
      href,
      action: "Set score",
    });
    check(hasText(game.best_handheld), {
      area: "Game",
      title: `${game.name} has no best handheld`,
      detail: "Add a current editorial recommendation or explicitly document that data is still developing.",
      href,
      action: "Set recommendation",
    });
    check(hasText(game.recommended_tdp), {
      area: "Game",
      title: `${game.name} has no recommended TDP`,
      detail: "A power target helps players understand where the recommendation starts.",
      href,
      action: "Set power target",
    });
    check(presetGameIds.has(game.id) || benchmarkGameIds.has(game.id), {
      severity: "critical",
      area: "Coverage",
      title: `${game.name} is an empty public profile`,
      detail: "The game has neither a published preset nor a published benchmark.",
      href,
      action: "Add performance data",
    });
  });

  handhelds.forEach((handheld) => {
    const href = `/admin/handhelds/${handheld.id}/edit`;
    check(Boolean(handheld.image_url), {
      severity: "critical",
      area: "Handheld",
      title: `${handheld.name} has no device image`,
      detail: "Device cards and the hardware hero need a clean product image.",
      href,
      action: "Edit handheld",
    });
    check(hasText(handheld.tagline, 60), {
      area: "Handheld",
      title: `${handheld.name} has a weak tagline`,
      detail: "Add a useful description of the device's position and strengths.",
      href,
      action: "Improve profile",
    });
    [
      ["processor", handheld.processor],
      ["memory", handheld.memory],
      ["resolution", handheld.resolution],
      ["battery", handheld.battery],
    ].forEach(([label, value]) => {
      check(hasText(value), {
        area: "Handheld",
        title: `${handheld.name} is missing ${label}`,
        detail: "Core specifications should be complete before broader promotion.",
        href,
        action: "Complete specs",
      });
    });
    check(
      presetHandheldIds.has(handheld.id) || benchmarkHandheldIds.has(handheld.id),
      {
        severity: "critical",
        area: "Coverage",
        title: `${handheld.name} has no performance coverage`,
        detail: "The device has neither a published preset nor a benchmark.",
        href,
        action: "Add coverage",
      },
    );
  });

  presets.forEach((preset) => {
    const href = `/admin/presets/${preset.id}/edit`;
    check(Boolean(preset.game_id && preset.handheld_id), {
      severity: "critical",
      area: "Preset",
      title: `${preset.name} is missing its target`,
      detail: "Every published preset must resolve to one game and one handheld.",
      href,
      action: "Repair target",
    });
    check(hasText(preset.resolution) && hasText(preset.tdp), {
      severity: "critical",
      area: "Preset",
      title: `${preset.name} has an incomplete test target`,
      detail: "Resolution and TDP are required for reproducible results.",
      href,
      action: "Complete target",
    });
    check(preset.fps_average !== null && preset.one_percent_low !== null, {
      severity: "critical",
      area: "Preset",
      title: `${preset.name} is missing measured FPS`,
      detail: "Average FPS and 1% low are the minimum useful performance pair.",
      href,
      action: "Add measurements",
    });
    check(
      !(
        preset.fps_average !== null &&
        preset.one_percent_low !== null &&
        preset.one_percent_low > preset.fps_average
      ),
      {
        severity: "critical",
        area: "Preset",
        title: `${preset.name} has impossible FPS ordering`,
        detail: "The 1% low cannot be higher than the average FPS.",
        href,
        action: "Correct data",
      },
    );
    check(hasText(preset.summary, 60), {
      area: "Preset",
      title: `${preset.name} has a short summary`,
      detail: "Explain the target, trade-off and important caveats in at least 60 characters.",
      href,
      action: "Improve summary",
    });
    check(preset.atlas_verified, {
      area: "Preset",
      title: `${preset.name} is not Atlas Verified`,
      detail: "Editorial verification is recommended for launch showcase presets.",
      href,
      action: "Review preset",
    });
  });

  benchmarks.forEach((benchmark) => {
    const href = `/admin/benchmarks/${benchmark.id}/edit`;
    check(Boolean(benchmark.game_id && benchmark.handheld_id), {
      severity: "critical",
      area: "Benchmark",
      title: `Benchmark ${benchmark.id.slice(0, 8)} has no complete target`,
      detail: "A benchmark must identify both the game and handheld.",
      href,
      action: "Repair benchmark",
    });
    check(hasText(benchmark.resolution) && hasText(benchmark.tdp), {
      severity: "critical",
      area: "Benchmark",
      title: `Benchmark ${benchmark.id.slice(0, 8)} lacks resolution or TDP`,
      detail: "The test cannot be reproduced without both values.",
      href,
      action: "Complete target",
    });
    check(benchmark.average_fps !== null && benchmark.one_percent_low !== null, {
      severity: "critical",
      area: "Benchmark",
      title: `Benchmark ${benchmark.id.slice(0, 8)} lacks FPS data`,
      detail: "Average FPS and 1% low should be recorded together.",
      href,
      action: "Add measurements",
    });
    check(
      !(
        benchmark.average_fps !== null &&
        benchmark.one_percent_low !== null &&
        benchmark.one_percent_low > benchmark.average_fps
      ),
      {
        severity: "critical",
        area: "Benchmark",
        title: `Benchmark ${benchmark.id.slice(0, 8)} has impossible FPS ordering`,
        detail: "The 1% low cannot exceed average FPS.",
        href,
        action: "Correct data",
      },
    );
    check(hasText(benchmark.test_notes, 60), {
      area: "Benchmark",
      title: `Benchmark ${benchmark.id.slice(0, 8)} has weak test notes`,
      detail: "Describe the scene, settings and important variables.",
      href,
      action: "Improve notes",
    });
  });

  const auditArticle = (article: ArticleRow, type: "Guide" | "News") => {
    const href =
      type === "Guide"
        ? `/admin/guides/${article.id}/edit`
        : `/admin/news/${article.id}/edit`;
    check(Boolean(article.cover_image_url), {
      severity: "critical",
      area: type,
      title: `${article.title} has no cover image`,
      detail: "Published articles need a strong card and social image.",
      href,
      action: `Edit ${type.toLowerCase()}`,
    });
    check(hasText(article.excerpt, 80), {
      area: type,
      title: `${article.title} has a thin excerpt`,
      detail: "Write a specific summary of at least 80 characters.",
      href,
      action: "Improve excerpt",
    });
    check(hasText(article.content, 500), {
      area: type,
      title: `${article.title} is too short`,
      detail: "Published showcase content should provide substantial original value.",
      href,
      action: "Expand article",
    });
    check(Boolean(article.published_at), {
      severity: "critical",
      area: type,
      title: `${article.title} has no publication date`,
      detail: "Search metadata and article trust signals need a publication timestamp.",
      href,
      action: "Set publication date",
    });
  };

  guides.forEach((guide) => auditArticle(guide, "Guide"));
  news.forEach((item) => auditArticle(item, "News"));

  const contentTargets: AuditMetric[] = [
    { label: "Published games", value: games.length, target: 10, detail: "Showcase target" },
    { label: "Published handhelds", value: handhelds.length, target: 8, detail: "Core device coverage" },
    { label: "Published presets", value: presets.length, target: 12, detail: "Useful launch library" },
    { label: "Published benchmarks", value: benchmarks.length, target: 8, detail: "Measured evidence" },
    { label: "Published guides", value: guides.length, target: 5, detail: "Searchable help content" },
    { label: "Published news", value: news.length, target: 5, detail: "Active editorial surface" },
  ];

  contentTargets.forEach((metric) => {
    check(metric.value >= metric.target, {
      area: "Content depth",
      title: `${metric.label} are below the launch target`,
      detail: `${metric.value} live; target ${metric.target}. This is a recommendation, not a deployment blocker.`,
      href:
        metric.label.includes("games")
          ? "/admin/games"
          : metric.label.includes("handhelds")
            ? "/admin/handhelds"
            : metric.label.includes("presets")
              ? "/admin/presets"
              : metric.label.includes("benchmarks")
                ? "/admin/benchmarks"
                : metric.label.includes("guides")
                  ? "/admin/guides"
                  : "/admin/news",
      action: "Add content",
    });
  });

  const score = percentage(completedChecks, totalChecks);
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.length - criticalCount;
  const launchLabel =
    databaseErrors.length > 0
      ? "Audit incomplete"
      : criticalCount > 0
        ? "Not promo ready"
        : score >= 85
          ? "Promo ready"
          : "Ready with warnings";

  const sortedIssues = [...issues].sort((first, second) => {
    if (first.severity !== second.severity) {
      return first.severity === "critical" ? -1 : 1;
    }
    return first.area.localeCompare(second.area);
  });

  return (
    <main className="atlas-page min-h-screen pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[radial-gradient(circle_at_12%_0%,rgba(239,35,60,0.16),transparent_34%),radial-gradient(circle_at_88%_10%,rgba(24,215,255,0.12),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(3,7,18,0.99))] p-6 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <Link href="/admin" className="text-sm font-black text-cyan-400 transition hover:text-white">
                ← Back to admin dashboard
              </Link>
              <p className="mt-8 text-[0.62rem] font-black uppercase tracking-[0.22em] text-red-400">
                Phase 7 control tower
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Launch Readiness Audit
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                A live quality gate for content depth, empty public profiles,
                reproducible performance data and article completeness before
                the next promotion wave brings actual humans with functioning eyeballs.
              </p>
            </div>

            <div className={`rounded-2xl border p-5 text-center ${getScoreTone(score)}`}>
              <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] opacity-80">
                Launch score
              </p>
              <p className="mt-2 text-5xl font-black text-white">
                {score}<span className="text-lg text-slate-500">/100</span>
              </p>
              <p className="mt-2 font-black">{launchLabel}</p>
            </div>
          </div>
        </section>

        {databaseErrors.length > 0 && (
          <section className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/[0.07] p-5">
            <h2 className="font-black text-red-300">The audit could not read every table.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Fix the database errors before trusting this score: {databaseErrors.map((error) => error.message).join(" · ")}
            </p>
          </section>
        )}

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Checks passed" value={completedChecks} detail={`of ${totalChecks}`} />
          <MetricCard label="Critical blockers" value={criticalCount} detail="Published data gaps" tone="red" />
          <MetricCard label="Warnings" value={warningCount} detail="Polish and depth" tone="orange" />
          <MetricCard label="Public records" value={games.length + handhelds.length + presets.length + benchmarks.length + guides.length + news.length} detail="Across all modules" tone="cyan" />
        </section>

        <section className="atlas-panel mt-5 p-5 sm:p-6">
          <div>
            <p className="atlas-section-label">Library depth</p>
            <h2 className="mt-2 text-2xl font-black">Recommended launch inventory</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {contentTargets.map((metric) => {
              const progress = percentage(metric.value, metric.target);
              return (
                <article key={metric.label} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-300">{metric.label}</p>
                      <p className="mt-1 text-[0.62rem] text-slate-600">{metric.detail}</p>
                    </div>
                    <p className="text-xl font-black text-white">
                      {metric.value}<span className="text-xs text-slate-600">/{metric.target}</span>
                    </p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="atlas-section-label">Action queue</p>
              <h2 className="mt-2 text-3xl font-black">What still needs attention</h2>
            </div>
            <Link href="/admin/preset-quality" className="atlas-button-secondary">
              Open deep preset audit
            </Link>
          </div>

          {sortedIssues.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-green-500/25 bg-green-500/[0.06] p-6">
              <p className="text-lg font-black text-green-300">No launch issues detected.</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The automated gate is clean. Finish the real-device and browser checklist before unleashing the promo horde.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {sortedIssues.map((issue, index) => (
                <article
                  key={`${issue.area}-${issue.title}-${index}`}
                  className="grid gap-4 rounded-2xl border border-white/[0.07] bg-slate-950/70 p-5 lg:grid-cols-[8rem_minmax(0,1fr)_auto] lg:items-center"
                >
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] ${getSeverityStyle(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <div>
                    <p className="text-[0.58rem] font-black uppercase tracking-[0.13em] text-cyan-400">{issue.area}</p>
                    <h3 className="mt-1 font-black text-white">{issue.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{issue.detail}</p>
                  </div>
                  <Link href={issue.href} className="atlas-button-secondary text-center">
                    {issue.action}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "default" | "red" | "orange" | "cyan";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-500/25 bg-red-500/[0.06]"
      : tone === "orange"
        ? "border-orange-500/25 bg-orange-500/[0.06]"
        : tone === "cyan"
          ? "border-cyan-500/25 bg-cyan-500/[0.06]"
          : "border-white/[0.07] bg-black/20";

  return (
    <article className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="text-[0.56rem] font-black uppercase tracking-[0.13em] text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
