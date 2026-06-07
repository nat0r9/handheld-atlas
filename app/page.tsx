import Image from "next/image";
import Link from "next/link";
import { createClient } from "../lib/supabase/server";

interface FeaturedNews {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
}

interface GameItem {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  atlas_score: number | null;
  best_handheld: string | null;
  recommended_tdp: string | null;
  cover_image_url: string | null;
}

interface HandheldItem {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  processor: string | null;
  battery: string | null;
  image_url: string | null;
}

interface PresetItem {
  id: string;
  name: string;
  preset_type:
    | "Performance"
    | "Balanced"
    | "Battery"
    | "Docked"
    | "Custom";
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;

  games: {
    name: string;
    slug: string;
    cover_image_url: string | null;
  } | null;

  handhelds: {
    name: string;
    slug: string;
  } | null;
}

interface BenchmarkItem {
  id: string;
  average_fps: number | null;
  one_percent_low: number | null;

  games: {
    name: string;
    slug: string;
  } | null;

  handhelds: {
    name: string;
    slug: string;
  } | null;

  presets: {
    name: string;
    preset_type: string;
  } | null;
}

interface GuideItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image_url: string | null;
  published_at: string | null;
}

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image_url: string | null;
  published_at: string | null;
}

interface PortalStat {
  label: string;
  value: number;
  href: string;
}

function formatCompactNumber(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(
      value >= 10000 ? 0 : 1,
    )}k+`;
  }

  return `${value}+`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Recently published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently published";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getPresetStyle(
  type: PresetItem["preset_type"],
) {
  switch (type) {
    case "Performance":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "Balanced":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";

    case "Battery":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "Docked":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";

    default:
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
  }
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    featuredNewsResult,
    gamesResult,
    handheldsResult,
    presetsResult,
    benchmarksResult,
    guidesResult,
    newsResult,
    gamesCountResult,
    handheldsCountResult,
    presetsCountResult,
    benchmarksCountResult,
  ] = await Promise.all([
    supabase
      .from("news")
      .select(`
        id,
        title,
        slug,
        category,
        excerpt,
        cover_image_url
      `)
      .eq("status", "published")
      .eq("is_featured", true)
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("games")
      .select(`
        id,
        name,
        slug,
        genre,
        developer,
        atlas_score,
        best_handheld,
        recommended_tdp,
        cover_image_url
      `)
      .eq("status", "published")
      .order("atlas_score", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(5),

    supabase
      .from("handhelds")
      .select(`
        id,
        name,
        slug,
        manufacturer,
        processor,
        battery,
        image_url
      `)
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      })
      .limit(3),

    supabase
      .from("presets")
      .select(`
        id,
        name,
        preset_type,
        resolution,
        tdp,
        fps_average,
        games (
          name,
          slug,
          cover_image_url
        ),
        handhelds (
          name,
          slug
        )
      `)
      .eq("status", "published")
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(4),

    supabase
      .from("benchmarks")
      .select(`
        id,
        average_fps,
        one_percent_low,
        games (
          name,
          slug
        ),
        handhelds (
          name,
          slug
        ),
        presets (
          name,
          preset_type
        )
      `)
      .eq("status", "published")
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(5),

    supabase
      .from("guides")
      .select(`
        id,
        title,
        slug,
        category,
        cover_image_url,
        published_at
      `)
      .eq("status", "published")
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(2),

    supabase
      .from("news")
      .select(`
        id,
        title,
        slug,
        category,
        cover_image_url,
        published_at
      `)
      .eq("status", "published")
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(2),

    supabase
      .from("games")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabase
      .from("handhelds")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

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
  ]);

  const featuredNews =
    featuredNewsResult.data as FeaturedNews | null;

  const games =
    (gamesResult.data ?? []) as GameItem[];

  const handhelds =
    (handheldsResult.data ??
      []) as HandheldItem[];

  const presets =
    (presetsResult.data ??
      []) as unknown as PresetItem[];

  const benchmarks =
    (benchmarksResult.data ??
      []) as unknown as BenchmarkItem[];

  const guides =
    (guidesResult.data ?? []) as GuideItem[];

  const newsItems =
    (newsResult.data ?? []) as NewsItem[];

  const editorialItems = [
    ...newsItems.map((item) => ({
      id: `news-${item.id}`,
      title: item.title,
      href: `/news/${item.slug}`,
      label: item.category,
      imageUrl: item.cover_image_url,
      publishedAt: item.published_at,
    })),

    ...guides.map((item) => ({
      id: `guide-${item.id}`,
      title: item.title,
      href: `/guides/${item.slug}`,
      label: item.category,
      imageUrl: item.cover_image_url,
      publishedAt: item.published_at,
    })),
  ].slice(0, 4);

  const portalStats: PortalStat[] = [
    {
      label: "Games",
      value: gamesCountResult.count ?? 0,
      href: "/games",
    },
    {
      label: "Handhelds",
      value: handheldsCountResult.count ?? 0,
      href: "/handhelds",
    },
    {
      label: "Presets",
      value: presetsCountResult.count ?? 0,
      href: "/presets",
    },
    {
      label: "Benchmarks",
      value: benchmarksCountResult.count ?? 0,
      href: "/benchmarks",
    },
  ];

  const databaseError =
    featuredNewsResult.error?.message ??
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    presetsResult.error?.message ??
    benchmarksResult.error?.message ??
    guidesResult.error?.message ??
    newsResult.error?.message ??
    null;

  return (
    <main className="atlas-page pb-12 text-white">
      <section className="relative overflow-hidden border-b border-white/5">
        {featuredNews?.cover_image_url ? (
          <Image
            src={featuredNews.cover_image_url}
            alt={featuredNews.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(124,58,237,0.28),transparent_30%),radial-gradient(circle_at_86%_20%,rgba(239,35,60,0.24),transparent_28%),linear-gradient(135deg,#05070d,#080b15_55%,#170915)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/95 to-[#05070d]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-black/20" />

        <div className="atlas-shell relative grid min-h-0 items-center gap-8 pb-10 pt-12 sm:min-h-[38rem] sm:gap-10 sm:py-14 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-3xl">
            <p className="atlas-section-label">
              Your performance hub
            </p>

            <h1 className="mt-4 text-[2.7rem] font-black leading-[0.94] tracking-[-0.055em] sm:mt-5 sm:text-6xl lg:text-7xl">
              Master every game.
              <span className="block">
                On every{" "}
                <span className="atlas-text-red">
                  handheld.
                </span>
              </span>
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              Real settings. Real performance. A living
              handheld gaming database built for players
              who want answers without the usual filler.
            </p>

            <form
              action="/search"
              method="get"
              className="mt-7 flex max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur sm:mt-8"
            >
              <label
                htmlFor="homepage-search"
                className="sr-only"
              >
                Search HandheldAtlas
              </label>

              <input
                id="homepage-search"
                name="q"
                type="search"
                placeholder="Search games, handhelds, presets..."
                className="min-w-0 flex-1 border-0 bg-transparent px-5 py-4 text-sm shadow-none focus:border-0 focus:shadow-none"
              />

              <button
                type="submit"
                aria-label="Search"
                className="flex w-14 items-center justify-center text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <SearchIcon />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/games"
                className="atlas-button-primary"
              >
                Explore games
              </Link>

              <Link
                href="/compare"
                className="atlas-button-secondary"
              >
                Compare devices
              </Link>
            </div>
          </div>

          <div className="relative hidden min-h-[29rem] lg:block">
            <div className="absolute inset-8 rounded-full bg-purple-500/20 blur-[90px]" />

            <div className="absolute bottom-12 right-0 w-[92%] rotate-[-4deg] rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-slate-900/70 to-black/90 p-8 shadow-[0_0_80px_rgba(239,35,60,0.18)] backdrop-blur">
              <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_65%_40%,rgba(59,130,246,0.36),transparent_25%),radial-gradient(circle_at_35%_55%,rgba(239,35,60,0.28),transparent_30%),#080b13]">
                {featuredNews?.cover_image_url ? (
                  <div className="relative h-full">
                    <Image
                      src={featuredNews.cover_image_url}
                      alt={featuredNews.title}
                      fill
                      sizes="50vw"
                      className="object-cover object-center opacity-80"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-400">
                        {featuredNews.category}
                      </p>

                      <p className="mt-2 text-2xl font-black">
                        {featuredNews.title}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/10 text-3xl font-black text-red-400">
                        HA
                      </div>

                      <p className="mt-5 text-sm font-black uppercase tracking-[0.25em] text-slate-500">
                        Handheld performance intelligence
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="atlas-shell relative min-w-0 max-w-full overflow-x-clip pb-8">
          <div className="atlas-stat-strip grid grid-cols-2 lg:grid-cols-4">
            {portalStats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group px-5 py-5 text-center transition hover:bg-white/[0.025]"
              >
                <p className="text-2xl font-black text-white">
                  {formatCompactNumber(stat.value)}
                </p>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 transition group-hover:text-red-400">
                  {stat.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="atlas-shell min-w-0 max-w-full overflow-x-clip pt-8">
        {databaseError && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Some live data could not be loaded:{" "}
            {databaseError}
          </div>
        )}

        <section className="atlas-panel min-w-0 max-w-full overflow-hidden p-4">
          <SectionHeader
            title="Featured games"
            href="/games"
            linkLabel="View all games"
          />

          {games.length === 0 ? (
            <EmptyState text="No published games yet." />
          ) : (
            <div className="mt-4 flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
              {games.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.slug}`}
                  className="group min-w-[17rem] snap-start sm:min-w-0"
                >
                  <article className="atlas-card atlas-card-hover h-full">
                    <div className="relative aspect-[5/4] overflow-hidden">
                      {game.cover_image_url ? (
                        <Image
                          src={game.cover_image_url}
                          alt={game.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 20vw"
                          className="object-cover object-center transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                      {game.atlas_score !== null && (
                        <div className="absolute right-3 top-3 atlas-score">
                          <span>Atlas score</span>
                          <strong>
                            {game.atlas_score}
                          </strong>
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="text-lg font-black">
                          {game.name}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2 p-4 text-xs">
                      <p className="text-slate-400">
                        Best:{" "}
                        <strong className="text-slate-200">
                          {game.best_handheld ??
                            "Not set"}
                        </strong>
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">
                          Avg FPS:{" "}
                          <strong className="text-slate-300">
                            —
                          </strong>
                        </span>

                        <span className="text-slate-500">
                          {game.recommended_tdp ??
                            "TDP n/a"}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 grid min-w-0 max-w-full gap-5 overflow-x-clip xl:grid-cols-[1.05fr_1fr_1.15fr]">
          <div className="atlas-panel min-w-0 max-w-full overflow-hidden p-4">
            <SectionHeader
              title="Latest presets"
              href="/presets"
              linkLabel="View all presets"
              compact
            />

            {presets.length === 0 ? (
              <EmptyState text="No published presets yet." />
            ) : (
              <div className="mt-4 space-y-2">
                {presets.map((preset) => (
                  <Link
                    key={preset.id}
                    href="/presets"
                    className="group grid grid-cols-[3.4rem_1fr] gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-2.5 transition hover:border-red-500/35 hover:bg-white/[0.025]"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-slate-900">
                      {preset.games
                        ?.cover_image_url ? (
                        <Image
                          src={
                            preset.games
                              .cover_image_url
                          }
                          alt={
                            preset.games.name
                          }
                          fill
                          sizes="54px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-red-950 to-black" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black transition group-hover:text-red-400">
                        {preset.games?.name ??
                          "Unknown game"}{" "}
                        ·{" "}
                        {preset.handhelds?.name ??
                          "Unknown device"}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[0.58rem] font-black uppercase ${getPresetStyle(
                            preset.preset_type,
                          )}`}
                        >
                          {preset.preset_type}
                        </span>

                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[0.58rem] font-black uppercase text-slate-400">
                          {preset.resolution ??
                            "Resolution n/a"}
                        </span>
                      </div>

                      <p className="mt-1.5 text-[0.68rem] text-slate-500">
                        {preset.tdp ??
                          "TDP n/a"}{" "}
                        ·{" "}
                        {preset.fps_average !==
                        null
                          ? `${preset.fps_average} FPS`
                          : "FPS n/a"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="atlas-panel min-w-0 max-w-full overflow-hidden p-4">
            <SectionHeader
              title="Handheld spotlight"
              href="/handhelds"
              linkLabel="View all handhelds"
              compact
            />

            {handhelds.length === 0 ? (
              <EmptyState text="No published handhelds yet." />
            ) : (
              <div className="mt-4 flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:pb-0">
                {handhelds.map(
                  (handheld, index) => (
                    <Link
                      key={handheld.id}
                      href={`/handhelds/${handheld.slug}`}
                      className="group min-w-[10.5rem] snap-start overflow-hidden rounded-xl border border-white/[0.07] bg-black/20 transition hover:border-cyan-500/35"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-900 to-black">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(24,215,255,0.12),transparent_50%)]" />

                        {handheld.image_url ? (
                          <Image
                            src={
                              handheld.image_url
                            }
                            alt={handheld.name}
                            fill
                            sizes="150px"
                            className="object-contain p-3 transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-black text-slate-700">
                            HA
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="truncate text-xs font-black">
                          {handheld.name}
                        </p>

                        <p className="mt-1 truncate text-[0.62rem] text-slate-500">
                          {handheld.processor ??
                            handheld.manufacturer}
                        </p>

                        <p
                          className={`mt-4 text-2xl font-black ${
                            index === 0
                              ? "text-red-400"
                              : index === 1
                                ? "text-cyan-400"
                                : "text-slate-300"
                          }`}
                        >
                          {92 - index * 4}
                        </p>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="atlas-panel min-w-0 max-w-full overflow-hidden p-4">
            <SectionHeader
              title="Benchmark wall"
              href="/benchmarks"
              linkLabel="See all benchmarks"
              compact
            />

            {benchmarks.length === 0 ? (
              <EmptyState text="No published benchmarks yet." />
            ) : (
              <>
                <div className="mt-4 space-y-2 md:hidden">
                  {benchmarks.map((benchmark) => (
                    <article
                      key={benchmark.id}
                      className="rounded-xl border border-white/[0.07] bg-black/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-200">
                            {benchmark.games?.name ?? "Unknown"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {benchmark.handhelds?.name ?? "Unknown device"}
                          </p>
                        </div>

                        <strong
                          className={`shrink-0 text-xl ${
                            (benchmark.average_fps ?? 0) >= 60
                              ? "text-green-400"
                              : "text-cyan-400"
                          }`}
                        >
                          {benchmark.average_fps ?? "—"} FPS
                        </strong>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="atlas-chip">
                          {benchmark.presets?.preset_type ?? "Custom"}
                        </span>

                        {benchmark.one_percent_low !== null && (
                          <span className="atlas-chip">
                            1% Low {benchmark.one_percent_low} FPS
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-4 hidden overflow-hidden rounded-xl border border-white/[0.07] md:block">
                  <div className="grid grid-cols-[1.3fr_1fr_1fr_auto] gap-3 bg-black/30 px-3 py-2 text-[0.58rem] font-black uppercase tracking-[0.12em] text-slate-600">
                    <span>Game</span>
                    <span>Device</span>
                    <span>Preset</span>
                    <span>FPS</span>
                  </div>

                  {benchmarks.map((benchmark, index) => (
                    <div
                      key={benchmark.id}
                      className={`grid grid-cols-[1.3fr_1fr_1fr_auto] items-center gap-3 px-3 py-3 text-[0.68rem] ${
                        index === benchmarks.length - 1
                          ? ""
                          : "border-b border-white/[0.06]"
                      }`}
                    >
                      <span className="truncate font-bold text-slate-200">
                        {benchmark.games?.name ?? "Unknown"}
                      </span>

                      <span className="truncate text-slate-400">
                        {benchmark.handhelds?.name ?? "Unknown"}
                      </span>

                      <span className="truncate text-slate-500">
                        {benchmark.presets?.preset_type ?? "Custom"}
                      </span>

                      <strong
                        className={
                          (benchmark.average_fps ?? 0) >= 60
                            ? "text-green-400"
                            : "text-slate-200"
                        }
                      >
                        {benchmark.average_fps ?? "—"}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="atlas-panel mt-5 p-4">
          <SectionHeader
            title="Latest news & guides"
            href="/news"
            linkLabel="View all news"
          />

          {editorialItems.length === 0 ? (
            <EmptyState text="No published editorial content yet." />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {editorialItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group"
                >
                  <article className="atlas-card atlas-card-hover atlas-card-cyan h-full">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-black" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                    </div>

                    <div className="p-4">
                      <p className="text-[0.62rem] font-black uppercase tracking-[0.15em] text-red-400">
                        {item.label}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-base font-black leading-snug transition group-hover:text-cyan-400">
                        {item.title}
                      </h3>

                      <p className="mt-4 text-[0.68rem] text-slate-600">
                        {formatDate(
                          item.publishedAt,
                        )}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

interface SectionHeaderProps {
  title: string;
  href: string;
  linkLabel: string;
  compact?: boolean;
}

function SectionHeader({
  title,
  href,
  linkLabel,
  compact = false,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-3">
      <h2
        className={
          compact
            ? "text-sm font-black uppercase tracking-[-0.02em]"
            : "text-base font-black uppercase tracking-[-0.02em]"
        }
      >
        {title}
      </h2>

      <Link
        href={href}
        className="shrink-0 text-right text-[0.62rem] font-black text-cyan-400 transition hover:text-white sm:text-[0.65rem]"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-black/20 p-7 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}