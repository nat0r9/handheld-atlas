import Image from "next/image";
import Link from "next/link";
import CommunityTopGamesPanel, {
  type TopGamePanelItem,
} from "../components/CommunityTopGamesPanel";
import HandheldSpotlight from "../components/HandheldSpotlight";
import {
  COMMUNITY_MIN_QUALIFIED_GAMES,
  COMMUNITY_MIN_VOTES_PER_GAME,
  COMMUNITY_TOP_GAME_LIMIT,
  getRatingConfidenceLabel,
  parseMonthlyTopGames,
} from "../lib/game-ratings";
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

function getAtlasScoreClass(score: number | null) {
  if (score === null) {
    return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }

  if (score >= 90) {
    return "border-green-500/30 bg-green-500/15 text-green-300";
  }

  if (score >= 85) {
    return "border-cyan-500/30 bg-cyan-500/15 text-cyan-300";
  }

  if (score >= 75) {
    return "border-orange-500/30 bg-orange-500/15 text-orange-300";
  }

  return "border-red-500/30 bg-red-500/15 text-red-300";
}


export default async function HomePage() {
  const supabase = await createClient();

  const now = new Date();

  const monthStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
    ),
  );

  const monthLabel =
    new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(monthStart);

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
    monthlyRatingsResult,
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
      }),

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

    supabase.rpc("get_monthly_top_games", {
      p_month_start: monthStart.toISOString().slice(0, 10),
      p_limit: COMMUNITY_TOP_GAME_LIMIT,
      p_min_votes: COMMUNITY_MIN_VOTES_PER_GAME,
    }),
  ]);

  const featuredNews =
    featuredNewsResult.data as FeaturedNews | null;

  const games =
    (gamesResult.data ?? []) as GameItem[];

  const communityCandidates = parseMonthlyTopGames(
    monthlyRatingsResult.data,
  );

  const useCommunityRanking =
    communityCandidates.length >= COMMUNITY_MIN_QUALIFIED_GAMES;

  const topGameItems: TopGamePanelItem[] = useCommunityRanking
    ? communityCandidates.map((game, index) => ({
        rank: index + 1,
        id: game.gameId,
        name: game.name,
        slug: game.slug,
        genre: game.genre,
        coverImageUrl: game.coverImageUrl,
        atlasScore: game.atlasScore,
        communityRating: game.averageRating,
        ratingCount: game.ratingCount,
        weightedScore: game.weightedScore,
        confidenceLabel: getRatingConfidenceLabel(game.ratingCount),
      }))
    : games.map((game, index) => ({
        rank: index + 1,
        id: game.id,
        name: game.name,
        slug: game.slug,
        genre: game.genre,
        coverImageUrl: game.cover_image_url,
        atlasScore: game.atlas_score,
        communityRating: null,
        ratingCount: 0,
        weightedScore: null,
        confidenceLabel: "Editorial",
      }));

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
    monthlyRatingsResult.error?.message ??
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

          <div className="relative min-h-[31rem] min-w-0 sm:min-h-[34rem] lg:min-h-[29rem]">
            <div className="absolute inset-6 rounded-full bg-purple-500/15 blur-[90px]" />

            <div className="relative h-full min-h-[31rem] sm:min-h-[34rem] lg:min-h-[29rem]">
              <CommunityTopGamesPanel
                items={topGameItems}
                mode={
                  useCommunityRanking
                    ? "community"
                    : "atlas"
                }
                monthLabel={monthLabel}
              />
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
                          unoptimized
                          sizes="(max-width: 640px) 100vw, 20vw"
                          className="object-cover object-center transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                      <div className="absolute right-3 top-3">
                        <div
                          className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl border backdrop-blur sm:h-14 sm:w-14 ${getAtlasScoreClass(
                            game.atlas_score,
                          )}`}
                        >
                          <span className="text-[0.42rem] font-black uppercase tracking-[0.1em] sm:text-[0.45rem]">
                            Atlas
                          </span>
                          <strong className="mt-0.5 text-lg leading-none sm:text-xl">
                            {game.atlas_score ?? "—"}
                          </strong>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="text-lg font-black">
                          {game.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 text-xs">
                      <span className="text-slate-500">
                        Avg FPS:{" "}
                        <strong className="text-slate-300">
                          —
                        </strong>
                      </span>
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

            <HandheldSpotlight
              handhelds={handhelds.map(
                (handheld) => ({
                  id: handheld.id,
                  name: handheld.name,
                  slug: handheld.slug,
                  manufacturer:
                    handheld.manufacturer,
                  processor:
                    handheld.processor,
                  battery:
                    handheld.battery,
                  imageUrl:
                    handheld.image_url,
                }),
              )}
            />
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