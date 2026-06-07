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

function getDifficultyStyle(
  difficulty: string | null,
) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "intermediate":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "advanced":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
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
      <main className="atlas-page pb-14 text-white">
        <section className="border-b border-white/[0.06]">
          <div className="atlas-shell py-12">
            <SearchHero query="" />
          </div>
        </section>

        <div className="atlas-shell pt-6">
          <section className="atlas-panel p-10 text-center">
            <p className="atlas-section-label">
              Global search
            </p>

            <h2 className="mt-3 text-4xl font-black">
              Search the entire Atlas
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-400">
              Search games, handhelds, presets,
              guides and news from one place.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/games"
                className="atlas-button-primary"
              >
                Browse games
              </Link>

              <Link
                href="/handhelds"
                className="atlas-button-secondary"
              >
                Browse handhelds
              </Link>
            </div>
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
  ]);

  const games =
    (gamesResult.data ?? []) as GameResult[];

  const handhelds =
    (handheldsResult.data ?? []) as HandheldResult[];

  const presets =
    (presetsResult.data ??
      []) as unknown as PresetResult[];

  const guides =
    (guidesResult.data ?? []) as GuideResult[];

  const newsItems =
    (newsResult.data ?? []) as NewsResult[];

  const totalResults =
    games.length +
    handhelds.length +
    presets.length +
    guides.length +
    newsItems.length;

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    presetsResult.error?.message ??
    guidesResult.error?.message ??
    newsResult.error?.message ??
    null;

  return (
    <main className="atlas-page pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-12">
          <SearchHero query={searchQuery} />
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">
              Some search results could not be
              loaded.
            </p>

            <p className="mt-2 break-words">
              {databaseError}
            </p>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
            label="Editorial"
            value={
              guides.length +
              newsItems.length
            }
          />
        </section>

        {totalResults === 0 ? (
          <section className="atlas-panel mt-5 p-12 text-center">
            <p className="atlas-section-label">
              No matches
            </p>

            <h2 className="mt-3 text-4xl font-black">
              Nothing found for “{searchQuery}”
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-400">
              Try a game title, handheld model,
              manufacturer, preset name or a
              broader keyword.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/games"
                className="atlas-button-primary"
              >
                Browse games
              </Link>

              <Link
                href="/handhelds"
                className="atlas-button-secondary"
              >
                Browse handhelds
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-8 space-y-8">
            {games.length > 0 && (
              <section className="atlas-panel p-5">
                <SectionHeading
                  title="Games"
                  count={games.length}
                  href="/games"
                />

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {games.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.slug}`}
                      className="group"
                    >
                      <article className="atlas-card atlas-card-hover h-full">
                        <div className="relative aspect-[4/5] overflow-hidden">
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

                          {game.atlas_score !== null && (
                            <div className="absolute right-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur">
                              <span className="text-[0.45rem] font-black uppercase tracking-[0.1em] text-red-400">
                                Atlas
                              </span>

                              <strong className="mt-0.5 text-xl">
                                {game.atlas_score}
                              </strong>
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-red-400">
                              {game.genre}
                            </p>

                            <h3 className="mt-2 line-clamp-2 text-2xl font-black leading-[1.05]">
                              {game.name}
                            </h3>

                            <p className="mt-2 text-xs text-slate-400">
                              {game.developer ??
                                "Developer not set"}
                            </p>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {handhelds.length > 0 && (
              <section className="atlas-panel p-5">
                <SectionHeading
                  title="Handhelds"
                  count={handhelds.length}
                  href="/handhelds"
                />

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {handhelds.map((handheld) => (
                    <Link
                      key={handheld.id}
                      href={`/handhelds/${handheld.slug}`}
                      className="group"
                    >
                      <article className="atlas-card atlas-card-hover atlas-card-cyan h-full">
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(circle_at_50%_65%,rgba(24,215,255,0.12),transparent_38%),linear-gradient(135deg,#0b101b,#05070d)]">
                          {handheld.image_url ? (
                            <Image
                              src={handheld.image_url}
                              alt={handheld.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-contain object-center p-7 transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-black uppercase tracking-[0.15em] text-slate-700">
                              Image coming soon
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-cyan-400">
                              {handheld.manufacturer}
                            </p>

                            <span className="atlas-chip-green atlas-chip">
                              {handheld.device_status}
                            </span>
                          </div>

                          <h3 className="mt-3 text-2xl font-black transition group-hover:text-cyan-400">
                            {handheld.name}
                          </h3>

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
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
              <section className="atlas-panel p-5">
                <SectionHeading
                  title="Presets"
                  count={presets.length}
                  href="/presets"
                />

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {presets.map((preset) => (
                    <Link
                      key={preset.id}
                      href="/presets"
                      className="atlas-card atlas-card-hover group p-5"
                    >
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] ${getPresetStyle(
                          preset.preset_type,
                        )}`}
                      >
                        {preset.preset_type}
                      </span>

                      <p className="mt-4 text-[0.58rem] font-black uppercase tracking-[0.14em] text-cyan-400">
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

                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                        {preset.summary ??
                          "Tested handheld performance configuration."}
                      </p>

                      <div className="mt-5 grid grid-cols-3 gap-2">
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

            {guides.length > 0 && (
              <section className="atlas-panel p-5">
                <SectionHeading
                  title="Guides"
                  count={guides.length}
                  href="/guides"
                />

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {guides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`/guides/${guide.slug}`}
                      className="group"
                    >
                      <article className="atlas-card atlas-card-hover atlas-card-cyan flex h-full flex-col">
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.07]">
                          {guide.cover_image_url ? (
                            <Image
                              src={guide.cover_image_url}
                              alt={guide.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover object-center transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-black" />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex flex-wrap gap-2">
                            <span className="atlas-chip-red atlas-chip">
                              {guide.category}
                            </span>

                            <span
                              className={`atlas-chip ${getDifficultyStyle(
                                guide.difficulty,
                              )}`}
                            >
                              {guide.difficulty ??
                                "Guide"}
                            </span>
                          </div>

                          <h3 className="mt-4 text-2xl font-black transition group-hover:text-cyan-400">
                            {guide.title}
                          </h3>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                            {guide.excerpt}
                          </p>

                          <p className="mt-auto border-t border-white/[0.07] pt-4 text-xs font-black text-slate-400">
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
              <section className="atlas-panel p-5">
                <SectionHeading
                  title="News"
                  count={newsItems.length}
                  href="/news"
                />

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {newsItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group"
                    >
                      <article className="atlas-card atlas-card-hover atlas-card-cyan flex h-full flex-col">
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.07]">
                          {item.cover_image_url ? (
                            <Image
                              src={item.cover_image_url}
                              alt={item.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover object-center transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-950 to-black" />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-red-400">
                            {item.category}
                          </p>

                          <h3 className="mt-3 text-2xl font-black transition group-hover:text-cyan-400">
                            {item.title}
                          </h3>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                            {item.excerpt}
                          </p>

                          <p className="mt-auto border-t border-white/[0.07] pt-4 text-xs text-slate-600">
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
    <section className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-red-500/10 blur-[100px]" />

      <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-500/10 blur-[90px]" />

      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="atlas-section-label">
            Global Atlas search
          </p>

          <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
            Search everything.
            <span className="block">
              Find it{" "}
              <span className="atlas-text-red">
                fast.
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            Search games, handhelds, presets,
            guides and news without crawling
            through five separate menus like
            some poor bastard trapped in UI hell.
          </p>
        </div>

        <form
          action="/search"
          method="get"
          className="atlas-panel p-4"
        >
          <label
            htmlFor="global-search"
            className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-600"
          >
            Search the Atlas
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
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
              className="atlas-button-primary"
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
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
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
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-3">
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
        className="text-xs font-black text-cyan-400 transition hover:text-white"
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
      className={`rounded-lg border p-3 ${
        highlighted
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-xs font-black ${
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