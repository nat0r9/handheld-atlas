import Link from "next/link";
import { redirect } from "next/navigation";
import {
  type AppRole,
  CONTENT_EDITOR_ROLES,
  MODERATION_ROLES,
  hasAnyRole,
  getRoleLabel,
} from "../../lib/auth/roles";
import { requireRole } from "../../lib/auth/require-role";

interface RecentNewsItem {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  created_at: string;
}

interface RecentGuide {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  created_at: string;
}

interface RecentPreset {
  id: string;
  name: string;
  preset_type: string;
  status: "draft" | "published" | "archived";
  created_at: string;
}

interface RecentBenchmark {
  id: string;
  status: "draft" | "published" | "archived";
  average_fps: number | null;
  created_at: string;
}

interface DashboardCount {
  label: string;
  value: number;
  href: string;
  description: string;
  accent:
    | "cyan"
    | "green"
    | "purple"
    | "orange"
    | "yellow"
    | "red";
}

function getStatusStyle(
  status: "draft" | "published" | "archived",
) {
  switch (status) {
    case "published":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "archived":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
  }
}

function getAccentStyle(
  accent: DashboardCount["accent"],
) {
  switch (accent) {
    case "green":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "purple":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";

    case "orange":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "yellow":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

    case "red":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
  }
}

function formatDate(value: string) {
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

export default async function AdminDashboardPage() {
  const {
    supabase,
    user,
    role,
  } = await requireRole(
    [
      "moderator",
      "atlas_editor",
      "admin",
    ],
    "/",
  );

  const canEditContent =
    hasAnyRole(
      role,
      CONTENT_EDITOR_ROLES,
    );

  const canModerate =
    hasAnyRole(
      role,
      MODERATION_ROLES,
    );

  const [
    gamesCountResult,
    handheldsCountResult,
    presetsCountResult,
    benchmarksCountResult,
    guidesCountResult,
    newsCountResult,
    publishedPresetsResult,
    publishedBenchmarksResult,
    draftGuidesResult,
    draftNewsResult,
    recentNewsResult,
    recentGuidesResult,
    recentPresetsResult,
    recentBenchmarksResult,
    pendingSubmissionsResult,
    pendingGuideSubmissionsResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("handhelds")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("presets")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("benchmarks")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("guides")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("news")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("presets")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabase
      .from("benchmarks")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabase
      .from("guides")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "draft"),

    supabase
      .from("news")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "draft"),

    supabase
      .from("news")
      .select(
        "id, title, slug, status, created_at",
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("guides")
      .select(
        "id, title, slug, status, created_at",
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("presets")
      .select(
        "id, name, preset_type, status, created_at",
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("benchmarks")
      .select(
        "id, status, average_fps, created_at",
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("preset_submissions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "pending"),

    supabase
      .from("guide_submissions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "pending"),
  ]);

  const allCounts: DashboardCount[] = [
    {
      label: "Games",
      value: gamesCountResult.count ?? 0,
      href: "/admin/games",
      description:
        "Manage the game database and Atlas ratings.",
      accent: "cyan",
    },
    {
      label: "Handhelds",
      value: handheldsCountResult.count ?? 0,
      href: "/admin/handhelds",
      description:
        "Manage hardware specifications and devices.",
      accent: "purple",
    },
    {
      label: "Presets",
      value: presetsCountResult.count ?? 0,
      href: "/admin/presets",
      description:
        "Create detailed performance configurations.",
      accent: "orange",
    },
    {
      label: "Benchmarks",
      value: benchmarksCountResult.count ?? 0,
      href: "/admin/benchmarks",
      description:
        "Record verified FPS and battery results.",
      accent: "green",
    },
    {
      label: "Guides",
      value: guidesCountResult.count ?? 0,
      href: "/admin/guides",
      description:
        "Publish tutorials and optimization guides.",
      accent: "yellow",
    },
    {
      label: "News",
      value: newsCountResult.count ?? 0,
      href: "/admin/news",
      description:
        "Write stories, updates and featured articles.",
      accent: "red",
    },
    {
      label: "Community submissions",
      value: pendingSubmissionsResult.count ?? 0,
      href: "/admin/submissions",
      description:
        "Review, approve and return community presets.",
      accent: "purple",
    },
    {
      label: "Guide submissions",
      value: pendingGuideSubmissionsResult.count ?? 0,
      href: "/admin/guide-submissions",
      description:
        "Review, approve and return community guides.",
      accent: "yellow",
    },
  ];

  const counts =
    allCounts.filter((item) => {
      if (
        item.href === "/admin/submissions" ||
        item.href === "/admin/guide-submissions"
      ) {
        return canModerate;
      }

      return canEditContent;
    });

  const recentNews =
    (recentNewsResult.data ??
      []) as RecentNewsItem[];

  const recentGuides =
    (recentGuidesResult.data ??
      []) as RecentGuide[];

  const recentPresets =
    (recentPresetsResult.data ??
      []) as RecentPreset[];

  const recentBenchmarks =
    (recentBenchmarksResult.data ??
      []) as RecentBenchmark[];

  const databaseError =
    gamesCountResult.error?.message ??
    handheldsCountResult.error?.message ??
    presetsCountResult.error?.message ??
    benchmarksCountResult.error?.message ??
    guidesCountResult.error?.message ??
    newsCountResult.error?.message ??
    recentNewsResult.error?.message ??
    recentGuidesResult.error?.message ??
    recentPresetsResult.error?.message ??
    recentBenchmarksResult.error?.message ??
    pendingSubmissionsResult.error?.message ??
    pendingGuideSubmissionsResult.error?.message ??
    null;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-7 md:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
                HandheldAtlas Control Center
              </p>

              <h1 className="mt-4 text-5xl font-black md:text-7xl">
                {role === "moderator"
                  ? "Moderation Dashboard"
                  : role === "atlas_editor"
                    ? "Atlas Editor Dashboard"
                    : "Admin Dashboard"}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                {role === "moderator"
                  ? "Review community submissions and keep published Atlas content clean."
                  : "Manage the database, publishing pipeline, performance data and editorial content from one beautifully overpowered command deck."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-black/30 px-5 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Signed in as
              </p>

              <p className="mt-2 max-w-xs break-all font-black text-slate-200">
                {user.email ?? "Atlas staff"}
              </p>

              <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-purple-300">
                {getRoleLabel(role as AppRole)}
              </p>

              <Link
                href="/"
                target="_blank"
                className="mt-4 inline-flex text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
              >
                Open public website ↗
              </Link>
            </div>
          </div>
        </section>

        {databaseError && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            <p className="font-black">
              Some dashboard data could not be loaded.
            </p>

            <p className="mt-2 break-words text-sm">
              {databaseError}
            </p>
          </div>
        )}

        <section className="mt-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400">
              Database Overview
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Content modules
            </h2>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {counts.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/50"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                      {item.label}
                    </p>

                    <p className="mt-3 text-5xl font-black">
                      {item.value}
                    </p>
                  </div>

                  <span
                    className={`rounded-2xl border px-4 py-3 text-xl font-black ${getAccentStyle(
                      item.accent,
                    )}`}
                  >
                    →
                  </span>
                </div>

                <p className="mt-5 leading-7 text-slate-400">
                  {item.description}
                </p>

                <p className="mt-5 text-sm font-bold text-cyan-400 transition group-hover:text-cyan-300">
                  Manage {item.label.toLowerCase()} →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {canEditContent && (
        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Published presets"
            value={publishedPresetsResult.count ?? 0}
            description="Visible performance profiles"
            accent="cyan"
          />

          <SummaryCard
            label="Published benchmarks"
            value={publishedBenchmarksResult.count ?? 0}
            description="Visible verified results"
            accent="green"
          />

          <SummaryCard
            label="Draft guides"
            value={draftGuidesResult.count ?? 0}
            description="Articles waiting for publication"
            accent="orange"
          />

          <SummaryCard
            label="Draft news"
            value={draftNewsResult.count ?? 0}
            description="Stories still in the newsroom"
            accent="purple"
          />
        </section>
        )}

        <section className="mt-12">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400">
              Quick Actions
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Create new content
            </h2>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <QuickAction
              href="/admin/games"
              label="+ Add game"
            />

            <QuickAction
              href="/admin/handhelds"
              label="+ Add handheld"
            />

            <QuickAction
              href="/admin/presets"
              label="+ Build preset"
            />

            <QuickAction
              href="/admin/benchmarks"
              label="+ Record benchmark"
            />

            <QuickAction
              href="/admin/guides"
              label="+ Write guide"
            />

            <QuickAction
              href="/admin/news"
              label="+ Write news"
            />
          </div>
        </section>

        <section className="mt-12 grid gap-6 xl:grid-cols-2">
          <RecentContentSection
            title="Latest news"
            emptyText="No news articles yet."
            manageHref="/admin/news"
          >
            {recentNews.map((item) => (
              <RecentContentRow
                key={item.id}
                title={item.title}
                subtitle={formatDate(
                  item.created_at,
                )}
                status={item.status}
                href={`/admin/news/${item.id}/edit`}
              />
            ))}
          </RecentContentSection>

          <RecentContentSection
            title="Latest guides"
            emptyText="No guides yet."
            manageHref="/admin/guides"
          >
            {recentGuides.map((item) => (
              <RecentContentRow
                key={item.id}
                title={item.title}
                subtitle={formatDate(
                  item.created_at,
                )}
                status={item.status}
                href={`/admin/guides/${item.id}/edit`}
              />
            ))}
          </RecentContentSection>

          <RecentContentSection
            title="Latest presets"
            emptyText="No presets yet."
            manageHref="/admin/presets"
          >
            {recentPresets.map((item) => (
              <RecentContentRow
                key={item.id}
                title={item.name}
                subtitle={`${item.preset_type} · ${formatDate(
                  item.created_at,
                )}`}
                status={item.status}
                href={`/admin/presets/${item.id}/edit`}
              />
            ))}
          </RecentContentSection>

          <RecentContentSection
            title="Latest benchmarks"
            emptyText="No benchmarks yet."
            manageHref="/admin/benchmarks"
          >
            {recentBenchmarks.map((item) => (
              <RecentContentRow
                key={item.id}
                title={
                  item.average_fps !== null
                    ? `${item.average_fps} FPS benchmark`
                    : "Benchmark result"
                }
                subtitle={formatDate(
                  item.created_at,
                )}
                status={item.status}
                href={`/admin/benchmarks/${item.id}/edit`}
              />
            ))}
          </RecentContentSection>
        </section>
      </div>
    </main>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  description: string;
  accent:
    | "cyan"
    | "green"
    | "orange"
    | "purple";
}

function SummaryCard({
  label,
  value,
  description,
  accent,
}: SummaryCardProps) {
  const accentClass =
    accent === "green"
      ? "text-green-400"
      : accent === "orange"
        ? "text-orange-400"
        : accent === "purple"
          ? "text-purple-400"
          : "text-cyan-400";

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-3 text-4xl font-black ${accentClass}`}
      >
        {value}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function QuickAction({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 font-black text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
    >
      {label}
    </Link>
  );
}

interface RecentContentSectionProps {
  title: string;
  emptyText: string;
  manageHref: string;
  children: React.ReactNode;
}

function RecentContentSection({
  title,
  emptyText,
  manageHref,
  children,
}: RecentContentSectionProps) {
  const hasChildren =
    Array.isArray(children)
      ? children.length > 0
      : Boolean(children);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black">
          {title}
        </h2>

        <Link
          href={manageHref}
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          Manage →
        </Link>
      </div>

      {hasChildren ? (
        <div className="mt-5 space-y-3">
          {children}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      )}
    </section>
  );
}

interface RecentContentRowProps {
  title: string;
  subtitle: string;
  status: "draft" | "published" | "archived";
  href: string;
}

function RecentContentRow({
  title,
  subtitle,
  status,
  href,
}: RecentContentRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-500/50"
    >
      <div className="min-w-0">
        <p className="truncate font-black text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
          status,
        )}`}
      >
        {status}
      </span>
    </Link>
  );
}