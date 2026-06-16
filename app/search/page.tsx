import Image from "next/image";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

interface GameResult {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  atlas_score: number | null;
  cover_image_url: string | null;
}

interface HandheldResult {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  device_status: string;
  processor: string | null;
  image_url: string | null;
  tagline: string | null;
}

interface PresetResult {
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
  summary: string | null;

  games: {
    name: string;
    slug: string;
  } | null;

  handhelds: {
    name: string;
    slug: string;
  } | null;
}

interface GuideResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  difficulty: string | null;
  reading_time: number | null;
  cover_image_url: string | null;
}

interface NewsResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
}

interface SettingImpactResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  summary: string;
  performance_impact: number;
  visual_impact: number;
  vram_impact: number;
}

function escapeSearchValue(value: string) {
  return value
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ");
}

function getPresetStyle(
  type: PresetResult["preset_type"],
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

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { q = "" } = await searchParams;

  const searchQuery = q.trim();
  const normalizedQuery =
    escapeSearchValue(searchQuery);

  if (!searchQuery) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SearchHero query="" />

          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400">
              Global Search
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Search the entire Atlas
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
              Search games, handhelds, performance
              presets, graphics settings, guides and news from one place.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const [
    gamesResult,
    handheldsResult,
    presetsResult,
    guidesResult,
    newsResult,
    settingsImpactResult,
  ] = await Promise.all([
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
      .or(
        `name.ilike.%${normalizedQuery}%,genre.ilike.%${normalizedQuery}%,developer.ilike.%${normalizedQuery}%`,
      )
      .order("name", {
        ascending: true,
      })
      .limit(12),

    supabase
      .from("handhelds")
      .select(`
        id,
        name,
        slug,
        manufacturer,
        device_status,
        processor,
        image_url,
        tagline
      `)
      .eq("status", "published")
      .or(
        `name.ilike.%${normalizedQuery}%,manufacturer.ilike.%${normalizedQuery}%,processor.ilike.%${normalizedQuery}%,tagline.ilike.%${normalizedQuery}%`,
      )
      .order("name", {
        ascending: true,
      })
      .limit(12),

    supabase
      .from("presets")
      .select(`
        id,
        name,
        preset_type,
        resolution,
        tdp,
        fps_average,
        summary,
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
      .or(
        `name.ilike.%${normalizedQuery}%,resolution.ilike.%${normalizedQuery}%,tdp.ilike.%${normalizedQuery}%,summary.ilike.%${normalizedQuery}%`,
      )
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(12),

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
        cover_image_url
      `)
      .eq("status", "published")
      .or(
        `title.ilike.%${normalizedQuery}%,category.ilike.%${normalizedQuery}%,excerpt.ilike.%${normalizedQuery}%,difficulty.ilike.%${normalizedQuery}%`,
      )
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(12),

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
      .or(
        `title.ilike.%${normalizedQuery}%,category.ilike.%${normalizedQuery}%,excerpt.ilike.%${normalizedQuery}%`,
      )
      .order("published_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(12),

    supabase
      .from("setting_impact_entries")
      .select(`
        id,
        name,
        slug,
        category,
        summary,
        performance_impact,
        visual_impact,
        vram_impact
      `)
      .eq("status", "published")
      .or(
        `name.ilike.%${normalizedQuery}%,category.ilike.%${normalizedQuery}%,summary.ilike.%${normalizedQuery}%`,
      )
      .order("name", { ascending: true })
      .limit(12),
  ]);

  const games =
    (gamesResult.data ?? []) as GameResult[];

  const handhelds =
    (handheldsResult.data ??
      []) as HandheldResult[];

  const presets =
    (presetsResult.data ??
      []) as unknown as PresetResult[];

  const guides =
    (guidesResult.data ?? []) as GuideResult[];

  const newsItems =
    (newsResult.data ?? []) as NewsResult[];

  const settingsImpact =
    (settingsImpactResult.data ?? []) as SettingImpactResult[];

  const totalResults =
    games.length +
    handhelds.length +
    presets.length +
    guides.length +
    newsItems.length +
    settingsImpact.length;

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    presetsResult.error?.message ??
    guidesResult.error?.message ??
    newsResult.error?.message ??
    settingsImpactResult.error?.message ??
    null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <SearchHero query={searchQuery} />

        {databaseError && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            <p className="font-black">
              Some search results could not be loaded.
            </p>

            <p className="mt-2 break-words text-sm">
              {databaseError}
            </p>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SearchStat
            label="All results"
            value={totalResults}
            highlighted
          />

          <SearchStat
            label="Games"
            value={games.length}
          />

          <SearchStat
            label="Handhelds"
            value={handhelds.length}
          />

          <SearchStat
            label="Presets"
            value={presets.length}
          />

          <SearchStat
            label="Settings"
            value={settingsImpact.length}
          />

          <div className="col-span-2 md:col-span-1">
          <SearchStat
            label="Editorial"
            value={
              guides.length +
              newsItems.length
            }
          />
          </div>
        </section>

        {totalResults === 0 ? (
          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400">
              No Matches
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Nothing found for “{searchQuery}”
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
              Try a game title, handheld model, graphics setting, preset name or a broader keyword.
            </p>
          </section>
        ) : (
          <div className="mt-14 space-y-16">
            {games.length > 0 && (
              <section>
                <SectionHeading
                  title="Games"
                  count={games.length}
                  href="/games"
                />

                <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {games.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.slug}`}
                      className="group min-w-0"
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

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
                              {game.genre}
                            </span>

                            {game.atlas_score !==
                              null && (
                              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-3 py-1 text-xs font-black text-cyan-300 backdrop-blur">
                                {game.atlas_score}
                                /100
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
              </section>
            )}

            {handhelds.length > 0 && (
              <section>
                <SectionHeading
                  title="Handhelds"
                  count={handhelds.length}
                  href="/handhelds"
                />

                <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {handhelds.map((handheld) => (
                    <Link
                      key={handheld.id}
                      href={`/handhelds/${handheld.slug}`}
                      className="group min-w-0"
                    >
                      <article className="h-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-purple-500">
                        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6">
                          {handheld.image_url ? (
                            <Image
                              src={handheld.image_url}
                              alt={handheld.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-contain object-center p-8 transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <p className="font-black text-slate-600">
                              Device image coming soon
                            </p>
                          )}
                        </div>

                        <div className="p-6">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-400">
                            {handheld.manufacturer}
                          </p>

                          <h3 className="mt-3 text-2xl font-black transition group-hover:text-purple-400">
                            {handheld.name}
                          </h3>

                          <p className="mt-3 line-clamp-2 leading-7 text-slate-400">
                            {handheld.tagline ??
                              handheld.processor ??
                              "Complete handheld profile."}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {presets.length > 0 && (
              <section>
                <SectionHeading
                  title="Presets"
                  count={presets.length}
                  href="/presets"
                />

                <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {presets.map((preset) => (
                    <Link
                      key={preset.id}
                      href={`/presets/${preset.id}`}
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

                      <h3 className="mt-2 break-words text-xl font-black transition group-hover:text-cyan-400 sm:text-2xl">
                        {preset.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {preset.handhelds?.name ??
                          "Unknown handheld"}
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        <MiniStat
                          label="Resolution"
                          value={
                            preset.resolution ??
                            "Not set"
                          }
                        />

                        <MiniStat
                          label="TDP"
                          value={
                            preset.tdp ??
                            "Not set"
                          }
                        />

                        <MiniStat
                          label="Average"
                          value={
                            preset.fps_average !==
                            null
                              ? `${preset.fps_average} FPS`
                              : "Not set"
                          }
                          highlighted
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {settingsImpact.length > 0 && (
              <section>
                <SectionHeading
                  title="Settings Guide"
                  count={settingsImpact.length}
                  href="/settings-impact"
                />

                <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {settingsImpact.map((setting) => (
                    <Link
                      key={setting.id}
                      href={`/settings-impact/${setting.slug}`}
                      className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
                        {setting.category}
                      </p>
                      <h3 className="mt-3 text-2xl font-black transition group-hover:text-cyan-400">
                        {setting.name}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-400">
                        {setting.summary}
                      </p>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <MiniStat label="FPS" value={`${setting.performance_impact}/5`} highlighted />
                        <MiniStat label="Visual" value={`${setting.visual_impact}/5`} />
                        <MiniStat label="VRAM" value={`${setting.vram_impact}/5`} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {guides.length > 0 && (
              <section>
                <SectionHeading
                  title="Guides"
                  count={guides.length}
                  href="/guides"
                />

                <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {guides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`/guides/${guide.slug}`}
                      className="group min-w-0"
                    >
                      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-yellow-500">
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-800 bg-slate-950">
                          {guide.cover_image_url ? (
                            <Image
                              src={guide.cover_image_url}
                              alt={guide.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover object-center transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-950 via-slate-950 to-black" />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-6">
                          <div className="flex flex-wrap gap-2">
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

                          <h3 className="mt-4 text-2xl font-black transition group-hover:text-yellow-400">
                            {guide.title}
                          </h3>

                          <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                            {guide.excerpt}
                          </p>

                          <p className="mt-auto border-t border-slate-800 pt-5 text-sm text-slate-500">
                            {guide.reading_time !==
                            null
                              ? `${guide.reading_time} min read`
                              : "Reading time not set"}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {newsItems.length > 0 && (
              <section>
                <SectionHeading
                  title="News"
                  count={newsItems.length}
                  href="/news"
                />

                <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {newsItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group min-w-0"
                    >
                      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-800 bg-slate-950">
                          {item.cover_image_url ? (
                            <Image
                              src={item.cover_image_url}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover object-center transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-black" />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-6">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
                            {item.category}
                          </p>

                          <h3 className="mt-3 text-xl font-black transition group-hover:text-cyan-400 sm:text-2xl">
                            {item.title}
                          </h3>

                          <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                            {item.excerpt}
                          </p>

                          <p className="mt-auto border-t border-slate-800 pt-5 text-sm text-slate-500">
                            {formatDate(
                              item.published_at,
                            )}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function SearchHero({
  query,
}: {
  query: string;
}) {
  return (
    <section className="relative min-w-0 overflow-hidden">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-red-500/10 blur-[100px]" />
      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-500/10 blur-[90px]" />

      <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-8">
        <div className="min-w-0">
          <p className="atlas-section-label">
            Global Atlas search
          </p>

          <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:mt-4 sm:text-6xl">
            Search everything.
            <span className="block">
              Find it{" "}
              <span className="atlas-text-red">
                fast.
              </span>
            </span>
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:leading-8">
            Search games, handhelds, presets, graphics settings,
            guides and news without crawling
            through five separate menus like
            some poor bastard trapped in UI hell.
          </p>
        </div>

        <form
          action="/search"
          method="get"
          className="atlas-panel min-w-0 p-4"
        >
          <label
            htmlFor="global-search"
            className="mb-2 block text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-600 sm:text-[0.58rem] sm:tracking-[0.15em]"
          >
            Search the Atlas
          </label>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <input
              id="global-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Cyberpunk, ROG Ally, Battery preset..."
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3 text-sm"
            />

            <button
              type="submit"
              className="atlas-button-primary w-full sm:w-auto"
            >
              Search
            </button>
          </div>

          {query && (
            <p className="mt-3 text-xs text-slate-600">
              Results for{" "}
              <strong className="text-slate-300">
                “{query}”
              </strong>
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

function SearchStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: number;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`min-w-0 rounded-xl border p-3 sm:p-4 ${
        highlighted
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[0.45rem] font-black uppercase leading-tight tracking-[0.1em] text-slate-600 sm:text-[0.52rem] sm:tracking-[0.14em]">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black sm:text-3xl ${
          highlighted
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function SectionHeading({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.07] pb-3">
      <div>
        <p className="atlas-section-label">
          Search results
        </p>

        <h2 className="mt-1 text-xl font-black">
          {title}
        </h2>
      </div>

      <Link
        href={href}
        className="text-[0.68rem] font-black text-cyan-400 transition hover:text-white sm:text-xs"
      >
        {count}{" "}
        {count === 1 ? "result" : "results"} →
      </Link>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border p-3 ${
        highlighted
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.48rem] font-black uppercase tracking-[0.1em] text-slate-600 sm:text-[0.5rem] sm:tracking-[0.12em]">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-[0.68rem] font-black sm:text-xs ${
          highlighted
            ? "text-red-400"
            : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
