import Image from "next/image";
import Link from "next/link";
import { createClient } from "../lib/supabase/server";

interface FeaturedNewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string | null;
  reading_time: number | null;
  published_at: string | null;
}

interface LatestNewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
}

interface LatestGame {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  atlas_score: number | null;
  cover_image_url: string | null;
}

interface LatestHandheld {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  device_status: string;
  tagline: string | null;
  image_url: string | null;
}

interface LatestPreset {
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
  one_percent_low: number | null;
  published_at: string | null;
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
  } | null;
}

interface LatestBenchmark {
  id: string;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  one_percent_low: number | null;
  battery_life: string | null;
  published_at: string | null;
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
  } | null;
}

interface LatestGuide {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  difficulty: string | null;
  reading_time: number | null;
  cover_image_url: string | null;
  published_at: string | null;
}

interface PortalCount {
  label: string;
  value: number;
  href: string;
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
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getPresetStyle(
  type: LatestPreset["preset_type"],
) {
  switch (type) {
    case "Performance":
      return "border-orange-500/30 bg-orange-500/15 text-orange-400";

    case "Balanced":
      return "border-cyan-500/30 bg-cyan-500/15 text-cyan-400";

    case "Battery":
      return "border-green-500/30 bg-green-500/15 text-green-400";

    case "Docked":
      return "border-red-500/30 bg-red-500/15 text-red-400";

    default:
      return "border-purple-500/30 bg-purple-500/15 text-purple-400";
  }
}

function getDifficultyStyle(
  difficulty: string | null,
) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "border-green-500/30 bg-green-500/15 text-green-400";

    case "intermediate":
      return "border-orange-500/30 bg-orange-500/15 text-orange-400";

    case "advanced":
      return "border-red-500/30 bg-red-500/15 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    featuredNewsResult,
    latestNewsResult,
    latestGamesResult,
    latestHandheldsResult,
    latestPresetsResult,
    latestBenchmarksResult,
    latestGuidesResult,
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
        cover_image_url,
        author_name,
        reading_time,
        published_at
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
      .from("news")
      .select(`
        id,
        title,
        slug,
        category,
        excerpt,
        cover_image_url,
        published_at
      `)
      .eq("status", "published")
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(4),

    supabase
      .from("games")
      .select(`
        id,
        name,
        slug,
        genre,
        developer,
        atlas_score,
        cover_image_url
      `)
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("handhelds")
      .select(`
        id,
        name,
        slug,
        manufacturer,
        device_status,
        tagline,
        image_url
      `)
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      })
      .limit(4),

    supabase
      .from("presets")
      .select(`
        id,
        name,
        preset_type,
        resolution,
        tdp,
        fps_average,
        one_percent_low,
        published_at,
        games (
          name,
          slug
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
        resolution,
        tdp,
        average_fps,
        one_percent_low,
        battery_life,
        published_at,
        games (
          name,
          slug
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
      .limit(5),

    supabase
      .from("guides")
      .select(`
        id,
        title,
        slug,
        category,
        excerpt,
        difficulty,
        reading_time,
        cover_image_url,
        published_at
      `)
      .eq("status", "published")
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(3),

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

  const latestNews =
    (latestNewsResult.data ??
      []) as LatestNewsItem[];

  const featuredNews =
    (featuredNewsResult.data ??
      latestNews[0] ??
      null) as FeaturedNewsItem | null;

  const remainingNews = latestNews
    .filter(
      (item) =>
        item.id !== featuredNews?.id,
    )
    .slice(0, 3);

  const latestGames =
    (latestGamesResult.data ??
      []) as LatestGame[];

  const latestHandhelds =
    (latestHandheldsResult.data ??
      []) as LatestHandheld[];

  const latestPresets =
    (latestPresetsResult.data ??
      []) as unknown as LatestPreset[];

  const latestBenchmarks =
    (latestBenchmarksResult.data ??
      []) as unknown as LatestBenchmark[];

  const latestGuides =
    (latestGuidesResult.data ??
      []) as LatestGuide[];

  const portalCounts: PortalCount[] = [
    {
      label: "Published Games",
      value: gamesCountResult.count ?? 0,
      href: "/games",
    },
    {
      label: "Handheld Devices",
      value: handheldsCountResult.count ?? 0,
      href: "/handhelds",
    },
    {
      label: "Performance Presets",
      value: presetsCountResult.count ?? 0,
      href: "/presets",
    },
    {
      label: "Verified Benchmarks",
      value: benchmarksCountResult.count ?? 0,
      href: "/benchmarks",
    },
  ];

  const databaseError =
    featuredNewsResult.error?.message ??
    latestNewsResult.error?.message ??
    latestGamesResult.error?.message ??
    latestHandheldsResult.error?.message ??
    latestPresetsResult.error?.message ??
    latestBenchmarksResult.error?.message ??
    latestGuidesResult.error?.message ??
    null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
        {featuredNews?.cover_image_url ? (
          <Image
            src={featuredNews.cover_image_url}
            alt={featuredNews.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-black" />
        )}

        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />
        <div className="pointer-events-none absolute right-[8%] top-[15%] h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative mx-auto flex min-h-[42rem] max-w-7xl items-end px-6 py-16">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300 backdrop-blur">
                Handheld Gaming Intelligence
              </span>

              {featuredNews && (
                <span className="rounded-full border border-yellow-500/40 bg-yellow-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-300 backdrop-blur">
                  Featured Story
                </span>
              )}
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.95] md:text-7xl xl:text-8xl">
              The Atlas for
              <span className="block text-cyan-400">
                handheld gaming.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
              Tested settings, real benchmarks, hardware
              profiles, guides and news for every serious
              handheld player.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/presets"
                className="rounded-xl bg-cyan-500 px-6 py-4 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Explore presets
              </Link>

              <Link
                href="/benchmarks"
                className="rounded-xl border border-white/15 bg-black/30 px-6 py-4 font-black text-white backdrop-blur transition hover:border-cyan-500 hover:text-cyan-400"
              >
                View benchmarks
              </Link>

              {featuredNews && (
                <Link
                  href={`/news/${featuredNews.slug}`}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-6 py-4 font-black text-yellow-300 backdrop-blur transition hover:bg-yellow-500 hover:text-slate-950"
                >
                  Read featured story
                </Link>
              )}
            </div>

            {featuredNews && (
              <div className="mt-10 max-w-3xl border-l-2 border-cyan-500 pl-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                  {featuredNews.category}
                </p>

                <p className="mt-2 text-xl font-black md:text-2xl">
                  {featuredNews.title}
                </p>

                <p className="mt-2 line-clamp-2 leading-7 text-slate-400">
                  {featuredNews.excerpt}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-14">
        {databaseError && (
          <div className="mb-10 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            <p className="font-black">
              Some live portal data could not be loaded.
            </p>

            <p className="mt-2 break-words text-sm">
              {databaseError}
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {portalCounts.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-cyan-500/50"
            >
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                {item.label}
              </p>

              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-4xl font-black text-white">
                  {item.value}
                </p>

                <span className="font-black text-cyan-400 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Latest Coverage"
            title="Newsroom"
            href="/news"
            linkLabel="Browse all news"
          />

          {remainingNews.length === 0 ? (
            <EmptySection
              title="No additional news yet"
              description="Fresh handheld stories will appear here after publication."
            />
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {remainingNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-800 bg-slate-950">
                      {item.cover_image_url ? (
                        <Image
                          src={item.cover_image_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover object-center transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-black" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <span className="absolute left-4 top-4 rounded-full border border-cyan-500/30 bg-slate-950/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-400 backdrop-blur">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-2xl font-black leading-tight transition group-hover:text-cyan-400">
                        {item.title}
                      </h3>

                      <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                        {item.excerpt}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-800 pt-5">
                        <span className="text-sm text-slate-500">
                          {formatDate(
                            item.published_at,
                          )}
                        </span>

                        <span className="font-black text-cyan-400">
                          Read →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Game Database"
            title="Latest games"
            href="/games"
            linkLabel="Explore all games"
          />

          {latestGames.length === 0 ? (
            <EmptySection
              title="No published games yet"
              description="Published game profiles will appear here automatically."
            />
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {latestGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.slug}`}
                  className="group"
                >
                  <article className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                    {game.cover_image_url ? (
                      <Image
                        src={game.cover_image_url}
                        alt={game.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-cover object-center transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-950 to-black" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                          {game.genre}
                        </span>

                        {game.atlas_score !== null && (
                          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-3 py-1 text-xs font-black text-cyan-300 backdrop-blur">
                            {game.atlas_score}/100
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-2xl font-black">
                        {game.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        {game.developer ??
                          "Developer not set"}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Hardware Database"
            title="Latest handhelds"
            href="/handhelds"
            linkLabel="Explore all handhelds"
          />

          {latestHandhelds.length === 0 ? (
            <EmptySection
              title="No published handhelds yet"
              description="Published hardware profiles will appear here automatically."
            />
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {latestHandhelds.map((handheld) => (
                <Link
                  key={handheld.id}
                  href={`/handhelds/${handheld.slug}`}
                  className="group"
                >
                  <article className="h-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-purple-500">
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5">
                      <div className="absolute h-36 w-36 rounded-full bg-purple-500/15 blur-3xl" />

                      {handheld.image_url ? (
                        <Image
                          src={handheld.image_url}
                          alt={handheld.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-contain object-center p-6 transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <p className="relative text-center font-black text-slate-500">
                          Device image coming soon
                        </p>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-400">
                          {handheld.manufacturer}
                        </span>

                        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-black uppercase text-green-400">
                          {handheld.device_status}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black transition group-hover:text-purple-400">
                        {handheld.name}
                      </h3>

                      <p className="mt-3 line-clamp-2 leading-7 text-slate-400">
                        {handheld.tagline ??
                          "Full handheld specifications and performance data."}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Recommended Profiles"
            title="Latest presets"
            href="/presets"
            linkLabel="Browse all presets"
          />

          {latestPresets.length === 0 ? (
            <EmptySection
              title="No published presets yet"
              description="Published performance profiles will appear here automatically."
            />
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {latestPresets.map((preset) => (
                <Link
                  key={preset.id}
                  href="/presets"
                  className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500"
                >
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getPresetStyle(
                      preset.preset_type,
                    )}`}
                  >
                    {preset.preset_type}
                  </span>

                  <p className="mt-5 text-sm font-black uppercase tracking-[0.15em] text-cyan-400">
                    {preset.games?.name ??
                      "Unknown game"}
                  </p>

                  <h3 className="mt-2 text-2xl font-black transition group-hover:text-cyan-400">
                    {preset.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {preset.handhelds?.name ??
                      "Unknown handheld"}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <MiniStat
                      label="Resolution"
                      value={
                        preset.resolution ??
                        "Not set"
                      }
                    />

                    <MiniStat
                      label="TDP"
                      value={preset.tdp ?? "Not set"}
                    />

                    <MiniStat
                      label="Average"
                      value={
                        preset.fps_average !== null
                          ? `${preset.fps_average} FPS`
                          : "Not set"
                      }
                      highlighted
                    />

                    <MiniStat
                      label="1% Low"
                      value={
                        preset.one_percent_low !== null
                          ? `${preset.one_percent_low} FPS`
                          : "Not set"
                      }
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16 grid gap-8 xl:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Performance Data"
              title="Fresh benchmarks"
              href="/benchmarks"
              linkLabel="Compare all results"
            />

            {latestBenchmarks.length === 0 ? (
              <EmptySection
                title="No published benchmarks yet"
                description="Verified performance results will appear here automatically."
              />
            ) : (
              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                {latestBenchmarks.map(
                  (benchmark, index) => (
                    <article
                      key={benchmark.id}
                      className={`grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center ${
                        index ===
                        latestBenchmarks.length - 1
                          ? ""
                          : "border-b border-slate-800"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-black text-cyan-400">
                          {benchmark.games?.name ??
                            "Unknown game"}
                        </p>

                        <h3 className="mt-1 text-xl font-black">
                          {benchmark.handhelds?.name ??
                            "Unknown handheld"}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {benchmark.resolution ??
                            "Resolution not set"}
                          {" · "}
                          {benchmark.tdp ??
                            "TDP not set"}
                          {" · "}
                          {benchmark.battery_life ??
                            "Battery not set"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-right">
                          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                            Average
                          </p>

                          <p className="mt-1 text-2xl font-black text-cyan-400">
                            {benchmark.average_fps !== null
                              ? `${benchmark.average_fps} FPS`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-3 text-right">
                          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                            1% Low
                          </p>

                          <p className="mt-1 text-xl font-black text-slate-200">
                            {benchmark.one_percent_low !==
                            null
                              ? `${benchmark.one_percent_low} FPS`
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>

          <div>
            <SectionHeading
              eyebrow="Knowledge Base"
              title="Latest guides"
              href="/guides"
              linkLabel="Browse all guides"
            />

            {latestGuides.length === 0 ? (
              <EmptySection
                title="No published guides yet"
                description="Fresh tutorials and optimization guides will appear here."
              />
            ) : (
              <div className="mt-8 space-y-5">
                {latestGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/guides/${guide.slug}`}
                    className="group block overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-yellow-500"
                  >
                    <div className="grid md:grid-cols-[10rem_1fr]">
                      <div className="relative min-h-40 overflow-hidden border-b border-slate-800 bg-slate-950 md:border-b-0 md:border-r">
                        {guide.cover_image_url ? (
                          <Image
                            src={guide.cover_image_url}
                            alt={guide.title}
                            fill
                            sizes="160px"
                            className="object-cover object-center transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-950 via-slate-950 to-black" />
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black uppercase text-yellow-400">
                            {guide.category}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${getDifficultyStyle(
                              guide.difficulty,
                            )}`}
                          >
                            {guide.difficulty ??
                              "Guide"}
                          </span>
                        </div>

                        <h3 className="mt-4 text-xl font-black transition group-hover:text-yellow-400">
                          {guide.title}
                        </h3>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                          {guide.excerpt}
                        </p>

                        <p className="mt-4 text-xs font-bold text-slate-600">
                          {guide.reading_time !== null
                            ? `${guide.reading_time} min read`
                            : "Reading time not set"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-20 overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-950 p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
                Build the community atlas
              </p>

              <h2 className="mt-4 text-4xl font-black md:text-5xl">
                Real data. Real settings. Less bullshit.
              </h2>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                HandheldAtlas is being built as a living
                database for players who want useful answers,
                not twelve minutes of YouTube filler before
                someone finally says “turn shadows to medium.”
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:flex-col">
              <Link
                href="/guides"
                className="rounded-xl bg-cyan-500 px-6 py-4 text-center font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Read guides
              </Link>

              <Link
                href="/news"
                className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-4 text-center font-black text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
              >
                Latest news
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-4xl font-black">
          {title}
        </h2>
      </div>

      <Link
        href={href}
        className="text-sm font-black text-cyan-400 transition hover:text-cyan-300"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function MiniStat({
  label,
  value,
  highlighted = false,
}: MiniStatProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlighted
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 font-black ${
          highlighted
            ? "text-cyan-400"
            : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-slate-700 bg-slate-900 p-8">
      <h3 className="text-xl font-black">
        {title}
      </h3>

      <p className="mt-2 text-slate-400">
        {description}
      </p>
    </div>
  );
}