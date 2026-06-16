import Link from "next/link";
import {
  CONTENT_EDITOR_ROLES,
  MODERATION_ROLES,
  getRoleLabel,
  hasAnyRole,
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

interface DashboardModule {
  label: string;
  value: number;
  href: string;
  description: string;
  actionLabel: string;
  tone: "cyan" | "red";
}

interface SummaryItem {
  label: string;
  value: number;
  description: string;
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
    profileResult,
    pendingSubmissionsResult,
    pendingGuideSubmissionsResult,
    presetConfirmationsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .maybeSingle(),

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

    supabase
      .from("preset_confirmations")
      .select("id", {
        count: "exact",
        head: true,
      }),
  ]);

  const displayName =
    profileResult.data?.display_name?.trim() ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Atlas staff";

  const profileEmail =
    profileResult.data?.email ??
    user.email ??
    null;

  const moderationModules: DashboardModule[] =
    canModerate
      ? [
          {
            label: "Preset submissions",
            value:
              pendingSubmissionsResult.count ??
              0,
            href: "/admin/submissions",
            description:
              "Review community presets waiting for approval.",
            actionLabel:
              "Open preset queue",
            tone: "red",
          },
          {
            label: "Guide submissions",
            value:
              pendingGuideSubmissionsResult.count ??
              0,
            href:
              "/admin/guide-submissions",
            description:
              "Review community guides and moderator feedback.",
            actionLabel:
              "Open guide queue",
            tone: "red",
          },
          {
            label: "Preset confirmations",
            value:
              presetConfirmationsResult.count ??
              0,
            href:
              "/admin/preset-feedback",
            description:
              "Audit Worked for me signals and keep a moderation log.",
            actionLabel:
              "Open trust moderation",
            tone: "red",
          },
        ]
      : [];

  let contentModules: DashboardModule[] = [];
  let summaryItems: SummaryItem[] = [];
  let recentNews: RecentNewsItem[] = [];
  let recentGuides: RecentGuide[] = [];
  let recentPresets: RecentPreset[] = [];
  let recentBenchmarks: RecentBenchmark[] = [];
  let contentError: string | null = null;

  if (canEditContent) {
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
    ]);

    contentModules = [
      {
        label: "Games",
        value:
          gamesCountResult.count ?? 0,
        href: "/admin/games",
        description:
          "Games, ratings and public metadata.",
        actionLabel: "Manage games",
        tone: "cyan",
      },
      {
        label: "Handhelds",
        value:
          handheldsCountResult.count ??
          0,
        href: "/admin/handhelds",
        description:
          "Devices, specifications and hardware profiles.",
        actionLabel:
          "Manage handhelds",
        tone: "cyan",
      },
      {
        label: "Presets",
        value:
          presetsCountResult.count ?? 0,
        href: "/admin/presets",
        description:
          "Performance profiles and detailed settings.",
        actionLabel:
          "Manage presets",
        tone: "cyan",
      },
      {
        label: "Preset quality",
        value:
          publishedPresetsResult.count ?? 0,
        href: "/admin/preset-quality",
        description:
          "Audit launch readiness, evidence and configuration quality.",
        actionLabel:
          "Run quality audit",
        tone: "cyan",
      },
      {
        label: "Launch readiness",
        value:
          (publishedPresetsResult.count ?? 0) +
          (publishedBenchmarksResult.count ?? 0),
        href: "/admin/launch-readiness",
        description:
          "Run the cross-site promo gate for content depth, coverage and SEO quality.",
        actionLabel:
          "Open control tower",
        tone: "red",
      },
      {
        label: "Benchmarks",
        value:
          benchmarksCountResult.count ??
          0,
        href: "/admin/benchmarks",
        description:
          "Verified FPS, battery and power results.",
        actionLabel:
          "Manage benchmarks",
        tone: "cyan",
      },
      {
        label: "Guides",
        value:
          guidesCountResult.count ?? 0,
        href: "/admin/guides",
        description:
          "Tutorials, fixes and optimization articles.",
        actionLabel:
          "Manage guides",
        tone: "cyan",
      },
      {
        label: "News",
        value:
          newsCountResult.count ?? 0,
        href: "/admin/news",
        description:
          "Stories, updates and featured articles.",
        actionLabel:
          "Manage news",
        tone: "cyan",
      },
    ];

    summaryItems = [
      {
        label: "Published presets",
        value:
          publishedPresetsResult.count ??
          0,
        description:
          "Visible performance profiles",
      },
      {
        label: "Published benchmarks",
        value:
          publishedBenchmarksResult.count ??
          0,
        description:
          "Visible verified results",
      },
      {
        label: "Draft guides",
        value:
          draftGuidesResult.count ?? 0,
        description:
          "Waiting for publication",
      },
      {
        label: "Draft news",
        value:
          draftNewsResult.count ?? 0,
        description:
          "Still in the newsroom",
      },
    ];

    recentNews =
      (recentNewsResult.data ??
        []) as RecentNewsItem[];

    recentGuides =
      (recentGuidesResult.data ??
        []) as RecentGuide[];

    recentPresets =
      (recentPresetsResult.data ??
        []) as RecentPreset[];

    recentBenchmarks =
      (recentBenchmarksResult.data ??
        []) as RecentBenchmark[];

    contentError =
      gamesCountResult.error?.message ??
      handheldsCountResult.error
        ?.message ??
      presetsCountResult.error?.message ??
      benchmarksCountResult.error
        ?.message ??
      guidesCountResult.error?.message ??
      newsCountResult.error?.message ??
      recentNewsResult.error?.message ??
      recentGuidesResult.error
        ?.message ??
      recentPresetsResult.error
        ?.message ??
      recentBenchmarksResult.error
        ?.message ??
      null;
  }

  const databaseError =
    profileResult.error?.message ??
    pendingSubmissionsResult.error
      ?.message ??
    pendingGuideSubmissionsResult.error
      ?.message ??
    presetConfirmationsResult.error
      ?.message ??
    contentError;

  return (
    <main className="atlas-page min-h-screen pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(3,7,18,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_75%_30%,rgba(239,35,60,0.12),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_20%_80%,rgba(24,215,255,0.09),transparent_55%)]" />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center">
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-red-400">
                HandheldAtlas staff area
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Atlas Workspace
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                {role === "moderator"
                  ? "Review community submissions, return clear feedback and keep published Atlas content trustworthy."
                  : "Manage content, publishing, moderation and performance data from one focused workspace."}
              </p>
            </div>

            <aside className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 backdrop-blur">
              <p className="text-[0.55rem] font-black uppercase tracking-[0.16em] text-slate-600">
                Signed in as
              </p>

              <p className="mt-2 truncate text-lg font-black text-white">
                {displayName}
              </p>

              {profileEmail && (
                <p className="mt-1 truncate text-xs text-slate-600">
                  {profileEmail}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-purple-500/25 bg-purple-500/[0.08] px-3 py-1 text-[0.55rem] font-black uppercase tracking-[0.12em] text-purple-300">
                  {getRoleLabel(role)}
                </span>

                <Link
                  href="/"
                  target="_blank"
                  className="text-xs font-black text-cyan-400 transition hover:text-white"
                >
                  Open website ↗
                </Link>
              </div>
            </aside>
          </div>
        </section>

        {databaseError && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            <p className="font-black">
              Some workspace data could not be loaded.
            </p>

            <p className="mt-2 break-words text-sm">
              {databaseError}
            </p>
          </div>
        )}

        {canEditContent && (
          <>
            <WorkspaceSectionHeader
              eyebrow="Database overview"
              title="Content modules"
              description="Everything published across the Atlas, grouped into compact management modules."
            />

            <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {contentModules.map(
                (item) => (
                  <ModuleCard
                    key={item.label}
                    item={item}
                  />
                ),
              )}
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryItems.map(
                (item) => (
                  <SummaryCard
                    key={item.label}
                    item={item}
                  />
                ),
              )}
            </section>
          </>
        )}

        {canModerate && (
          <>
            <WorkspaceSectionHeader
              eyebrow="Community moderation"
              title="Review queues"
              description="Pending community content that needs a human pair of eyes before publication."
            />

            <section className="mt-4 grid gap-3 md:grid-cols-2">
              {moderationModules.map(
                (item) => (
                  <ModuleCard
                    key={item.label}
                    item={item}
                  />
                ),
              )}
            </section>
          </>
        )}

        {canEditContent && (
          <>
            <WorkspaceSectionHeader
              eyebrow="Quick actions"
              title="Create new content"
              description="Jump directly into the most common editorial workflows."
            />

            <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <QuickAction
                href="/admin/games"
                label="Add game"
              />

              <QuickAction
                href="/admin/handhelds"
                label="Add handheld"
              />

              <QuickAction
                href="/admin/presets"
                label="Build preset"
              />

              <QuickAction
                href="/admin/preset-quality"
                label="Audit presets"
              />

              <QuickAction
                href="/admin/benchmarks"
                label="Record benchmark"
              />

              <QuickAction
                href="/admin/guides"
                label="Write guide"
              />

              <QuickAction
                href="/admin/news"
                label="Write news"
              />
            </section>

            <WorkspaceSectionHeader
              eyebrow="Recent activity"
              title="Latest content"
              description="The newest editorial items across the Atlas."
            />

            <section className="mt-4 grid gap-4 xl:grid-cols-2">
              <RecentContentSection
                title="Latest news"
                emptyText="No news articles yet."
                manageHref="/admin/news"
              >
                {recentNews.map(
                  (item) => (
                    <RecentContentRow
                      key={item.id}
                      title={item.title}
                      subtitle={formatDate(
                        item.created_at,
                      )}
                      status={item.status}
                      href={`/admin/news/${item.id}/edit`}
                    />
                  ),
                )}
              </RecentContentSection>

              <RecentContentSection
                title="Latest guides"
                emptyText="No guides yet."
                manageHref="/admin/guides"
              >
                {recentGuides.map(
                  (item) => (
                    <RecentContentRow
                      key={item.id}
                      title={item.title}
                      subtitle={formatDate(
                        item.created_at,
                      )}
                      status={item.status}
                      href={`/admin/guides/${item.id}/edit`}
                    />
                  ),
                )}
              </RecentContentSection>

              <RecentContentSection
                title="Latest presets"
                emptyText="No presets yet."
                manageHref="/admin/presets"
              >
                {recentPresets.map(
                  (item) => (
                    <RecentContentRow
                      key={item.id}
                      title={item.name}
                      subtitle={`${item.preset_type} · ${formatDate(
                        item.created_at,
                      )}`}
                      status={item.status}
                      href={`/admin/presets/${item.id}/edit`}
                    />
                  ),
                )}
              </RecentContentSection>

              <RecentContentSection
                title="Latest benchmarks"
                emptyText="No benchmarks yet."
                manageHref="/admin/benchmarks"
              >
                {recentBenchmarks.map(
                  (item) => (
                    <RecentContentRow
                      key={item.id}
                      title={
                        item.average_fps !==
                        null
                          ? `${item.average_fps} FPS benchmark`
                          : "Benchmark result"
                      }
                      subtitle={formatDate(
                        item.created_at,
                      )}
                      status={item.status}
                      href={`/admin/benchmarks/${item.id}/edit`}
                    />
                  ),
                )}
              </RecentContentSection>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function WorkspaceSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-9 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-red-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-white">
          {title}
        </h2>
      </div>

      <p className="max-w-xl text-xs leading-5 text-slate-600 sm:text-right">
        {description}
      </p>
    </div>
  );
}

function ModuleCard({
  item,
}: {
  item: DashboardModule;
}) {
  const isModeration =
    item.tone === "red";

  return (
    <Link
      href={item.href}
      className={`group rounded-2xl border p-4 transition duration-300 hover:-translate-y-0.5 ${
        isModeration
          ? "border-red-500/20 bg-red-500/[0.045] hover:border-red-500/45 hover:bg-red-500/[0.075]"
          : "border-white/[0.07] bg-[#0b1120]/75 hover:border-cyan-500/35 hover:bg-cyan-500/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-slate-500">
            {item.label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
            {item.value}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-black transition ${
            isModeration
              ? "border-red-500/25 bg-red-500/[0.08] text-red-400 group-hover:bg-red-500 group-hover:text-white"
              : "border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950"
          }`}
        >
          →
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {item.description}
      </p>

      <p
        className={`mt-4 text-xs font-black ${
          isModeration
            ? "text-red-400"
            : "text-cyan-400"
        }`}
      >
        {item.actionLabel} →
      </p>
    </Link>
  );
}

function SummaryCard({
  item,
}: {
  item: SummaryItem;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <p className="text-[0.55rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {item.label}
      </p>

      <p className="mt-2 text-2xl font-black text-white">
        {item.value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        {item.description}
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
      className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.07] px-4 py-3 text-center text-xs font-black text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-500 hover:text-slate-950"
    >
      + {label}
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
    <section className="rounded-2xl border border-white/[0.07] bg-[#0b1120]/75 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black">
          {title}
        </h2>

        <Link
          href={manageHref}
          className="text-xs font-black text-cyan-400 transition hover:text-white"
        >
          Manage →
        </Link>
      </div>

      {hasChildren ? (
        <div className="mt-4 space-y-2">
          {children}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] p-5 text-center text-xs text-slate-600">
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
      className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/20 p-3 transition hover:border-cyan-500/35"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {subtitle}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.5rem] font-black uppercase tracking-[0.1em] ${getStatusStyle(
          status,
        )}`}
      >
        {status}
      </span>
    </Link>
  );
}
