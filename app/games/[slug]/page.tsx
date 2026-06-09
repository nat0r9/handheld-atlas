import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GameRatingControl from "../../../components/GameRatingControl";
import AtlasScore from "../../../components/AtlasScore";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface DatabaseGame {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  release_year: number | null;
  atlas_score: number | null;
  best_handheld: string | null;
  recommended_tdp: string | null;
  notes: string | null;
  cover_image_url: string | null;
}

interface DatabaseSettingItem {
  id: string;
  label: string;
  value: string;
  note: string | null;
  sort_order: number;
}

interface DatabaseSettingGroup {
  id: string;
  name: string;
  sort_order: number;
  preset_setting_items: DatabaseSettingItem[];
}

interface DatabasePreset {
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
  upscaler: string | null;
  battery_life: string | null;
  community_rating: number | null;
  summary: string | null;

  handhelds: {
    name: string;
    slug: string;
    manufacturer: string;
  } | null;

  preset_setting_groups: DatabaseSettingGroup[];
}

interface DatabaseBenchmark {
  id: string;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  one_percent_low: number | null;
  battery_life: string | null;
  test_notes: string | null;

  handhelds: {
    name: string;
    slug: string;
    manufacturer: string;
  } | null;

  presets: {
    name: string;
    preset_type: string;
  } | null;
}

async function getGame(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      "id, name, slug, genre, developer, release_year, atlas_score, best_handheld, recommended_tdp, notes, cover_image_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Could not load game:", error.message);
    return null;
  }

  return data as DatabaseGame | null;
}

async function getGamePresets(gameId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("presets")
    .select(`
      id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      one_percent_low,
      upscaler,
      battery_life,
      community_rating,
      summary,
      handhelds (
        name,
        slug,
        manufacturer
      ),
      preset_setting_groups (
        id,
        name,
        sort_order,
        preset_setting_items (
          id,
          label,
          value,
          note,
          sort_order
        )
      )
    `)
    .eq("game_id", gameId)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error("Could not load game presets:", error.message);
    return [];
  }

  return (data ?? []) as unknown as DatabasePreset[];
}

async function getGameBenchmarks(gameId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("benchmarks")
    .select(`
      id,
      resolution,
      tdp,
      average_fps,
      one_percent_low,
      battery_life,
      test_notes,
      handhelds (
        name,
        slug,
        manufacturer
      ),
      presets (
        name,
        preset_type
      )
    `)
    .eq("game_id", gameId)
    .eq("status", "published")
    .order("average_fps", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error("Could not load game benchmarks:", error.message);
    return [];
  }

  return (data ?? []) as unknown as DatabaseBenchmark[];
}

async function getGameRatings(
  gameId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data,
    error,
  } = await supabase
    .from("game_ratings")
    .select("rating, user_id")
    .eq("game_id", gameId);

  if (error) {
    console.error(
      "Could not load game ratings:",
      error.message,
    );

    return {
      averageRating: null,
      ratingCount: 0,
      userRating: null,
    };
  }

  const ratingValues =
    (data ?? []).map(
      (row) => Number(row.rating),
    );

  const averageRating =
    ratingValues.length > 0
      ? ratingValues.reduce(
          (total, value) =>
            total + value,
          0,
        ) / ratingValues.length
      : null;

  const userRating =
    user !== null
      ? (data ?? []).find(
          (row) =>
            row.user_id === user.id,
        )?.rating ?? null
      : null;

  return {
    averageRating:
      averageRating !== null
        ? Number(
            averageRating.toFixed(2),
          )
        : null,
    ratingCount:
      ratingValues.length,
    userRating:
      userRating !== null
        ? Number(userRating)
        : null,
  };
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);

  if (!game) {
    return {
      title: "Game Not Found",
      description:
        "The requested game does not exist in the HandheldAtlas database.",
    };
  }

  const description =
    game.notes ??
    `${game.name} handheld presets, recommended settings and performance information.`;

  return {
    title: `${game.name} Handheld Settings`,
    description,
    openGraph: {
      title: `${game.name} Handheld Settings | HandheldAtlas`,
      description,
      images: game.cover_image_url
        ? [{ url: game.cover_image_url, alt: game.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.name} Handheld Settings | HandheldAtlas`,
      description,
      images: game.cover_image_url ? [game.cover_image_url] : [],
    },
  };
}

function getCompatibilityData(score: number | null) {
  if (score === null) {
    return {
      label: "Unrated",
      style: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    };
  }

  if (score >= 90) {
    return {
      label: "Excellent",
      style: "border-green-500/30 bg-green-500/10 text-green-400",
    };
  }

  if (score >= 85) {
    return {
      label: "Great",
      style: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    };
  }

  if (score >= 75) {
    return {
      label: "Playable",
      style: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    };
  }

  return {
    label: "Tweaks Required",
    style: "border-red-500/30 bg-red-500/10 text-red-400",
  };
}

function getPresetStyle(type: DatabasePreset["preset_type"]) {
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

function getFpsStyle(value: number | null) {
  if (value === null) return "text-slate-400";
  if (value >= 60) return "text-green-400";
  if (value >= 45) return "text-cyan-400";
  if (value >= 30) return "text-orange-400";
  return "text-red-400";
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGame(slug);

  if (!game) {
    notFound();
  }

  const [
    gamePresets,
    gameBenchmarks,
    gameRatings,
  ] = await Promise.all([
    getGamePresets(game.id),
    getGameBenchmarks(game.id),
    getGameRatings(game.id),
  ]);

  const compatibility = getCompatibilityData(game.atlas_score);

  const validBenchmarkFps = gameBenchmarks
    .map((benchmark) => benchmark.average_fps)
    .filter((value): value is number => typeof value === "number");

  const highestTestedFps =
    validBenchmarkFps.length > 0 ? Math.max(...validBenchmarkFps) : null;

  const averageTestedFps =
    validBenchmarkFps.length > 0
      ? Math.round(
          validBenchmarkFps.reduce((total, value) => total + value, 0) /
            validBenchmarkFps.length,
        )
      : null;

  return (
    <main className="atlas-page min-w-0 overflow-x-hidden pb-14 text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        {game.cover_image_url ? (
          <Image
            src={game.cover_image_url}
            alt={game.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(124,58,237,0.25),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(239,35,60,0.2),transparent_25%),linear-gradient(135deg,#05070d,#090d16_55%,#14090f)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/95 to-[#05070d]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-black/25" />

        <div className="atlas-shell relative grid min-h-[34rem] items-end gap-7 py-9 sm:min-h-[38rem] sm:gap-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-w-0">
            <Link
              href="/games"
              className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 transition hover:text-white"
            >
              ← Back to games
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
              <span
                className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] backdrop-blur ${compatibility.style}`}
              >
                {compatibility.label}
              </span>

              <span className="atlas-chip">{game.genre}</span>

              {game.release_year && (
                <span className="atlas-chip">{game.release_year}</span>
              )}
            </div>

            <h1 className="mt-4 max-w-4xl break-words text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:mt-5 sm:text-6xl lg:text-7xl">
              {game.name}
            </h1>

            <p className="mt-3 text-base font-bold text-slate-300 sm:mt-4 sm:text-lg">
              {game.developer ?? "Unknown developer"}
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:mt-5 sm:text-base sm:leading-8">
              {game.notes ??
                "Detailed handheld performance notes and recommended settings will be added soon."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link
                href="/presets"
                className="atlas-button-primary w-full sm:w-auto"
              >
                Browse presets
              </Link>

              <Link
                href="/benchmarks"
                className="atlas-button-secondary w-full sm:w-auto"
              >
                View benchmarks
              </Link>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <AtlasScore
              score={game.atlas_score}
              variant="large"
              className="h-full"
            />
            <HeroMetric
              label="Best handheld"
              value={game.best_handheld ?? "Not set"}
            />
            <HeroMetric
              label="Recommended TDP"
              value={game.recommended_tdp ?? "Not set"}
            />
            <HeroMetric
              label="Highest tested"
              value={highestTestedFps !== null ? `${highestTestedFps}` : "—"}
              suffix={highestTestedFps !== null ? "FPS" : undefined}
            />
          </div>
        </div>

        <div className="atlas-shell relative pb-6 sm:pb-8">
          <div className="atlas-stat-strip grid grid-cols-2 md:grid-cols-4">
            <StripStat
              label="Published presets"
              value={gamePresets.length.toString()}
            />
            <StripStat
              label="Published benchmarks"
              value={gameBenchmarks.length.toString()}
            />
            <StripStat
              label="Average tested FPS"
              value={
                averageTestedFps !== null
                  ? `${averageTestedFps} FPS`
                  : "No data"
              }
            />
            <StripStat label="Compatibility" value={compatibility.label} />
          </div>
        </div>
      </section>

      <div className="atlas-shell min-w-0 pt-5 sm:pt-6">
        <section className="grid min-w-0 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="atlas-panel min-w-0 p-4 sm:p-5">
            <SectionHeading
              eyebrow="Atlas notes"
              title="Performance overview"
            />

            <p className="mt-5 text-base leading-8 text-slate-400">
              {game.notes ??
                "No detailed performance notes are available yet."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AtlasScore
                score={game.atlas_score}
                variant="card"
                label="Score"
                className="h-full"
              />
              <OverviewStat
                label="Best FPS"
                value={highestTestedFps !== null ? `${highestTestedFps}` : "—"}
              />
              <OverviewStat
                label="Average FPS"
                value={averageTestedFps !== null ? `${averageTestedFps}` : "—"}
              />
              <OverviewStat
                label="TDP"
                value={game.recommended_tdp ?? "Not set"}
              />
            </div>

            <div className="mt-5 border-t border-white/[0.07] pt-5">
              <p className="atlas-section-label">
                Community rating
              </p>

              <h3 className="mt-2 text-xl font-black">
                Rate this game
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Community ratings are separate from the editorial Atlas Score.
              </p>

              <div className="mt-4">
                <GameRatingControl
                  gameId={game.id}
                  initialAverageRating={
                    gameRatings.averageRating
                  }
                  initialRatingCount={
                    gameRatings.ratingCount
                  }
                  initialUserRating={
                    gameRatings.userRating
                  }
                />
              </div>
            </div>
          </article>

          <article className="atlas-panel min-w-0 p-4 sm:p-5">
            <SectionHeading eyebrow="Quick facts" title="Game profile" />

            <dl className="mt-5">
              <OverviewRow
                label="Developer"
                value={game.developer ?? "Not set"}
              />
              <OverviewRow label="Genre" value={game.genre} />
              <OverviewRow
                label="Release year"
                value={game.release_year?.toString() ?? "Not set"}
              />
              <OverviewRow
                label="Best handheld"
                value={game.best_handheld ?? "Not set"}
              />
              <OverviewRow
                label="Recommended TDP"
                value={game.recommended_tdp ?? "Not set"}
                isLast
              />
            </dl>
          </article>
        </section>

        <section className="atlas-panel mt-5 min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              eyebrow="Recommended settings"
              title="Presets"
              noBorder
            />

            <Link
              href="/presets"
              className="text-xs font-black text-cyan-400 transition hover:text-white"
            >
              View all presets →
            </Link>
          </div>

          {gamePresets.length === 0 ? (
            <EmptyState text="No published presets are available for this game." />
          ) : (
            <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
              {gamePresets.map((preset) => {
                const sortedGroups = [
                  ...(preset.preset_setting_groups ?? []),
                ]
                  .sort(
                    (first, second) =>
                      first.sort_order - second.sort_order,
                  )
                  .map((group) => ({
                    ...group,
                    preset_setting_items: [
                      ...(group.preset_setting_items ?? []),
                    ].sort(
                      (first, second) =>
                        first.sort_order - second.sort_order,
                    ),
                  }));

                const settingsCount = sortedGroups.reduce(
                  (total, group) =>
                    total + group.preset_setting_items.length,
                  0,
                );

                return (
                  <details
                    key={preset.id}
                    className="group atlas-card atlas-card-hover min-w-0"
                  >
                    <summary className="cursor-pointer list-none p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] ${getPresetStyle(
                                preset.preset_type,
                              )}`}
                            >
                              {preset.preset_type}
                            </span>

                            <span className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-cyan-400">
                              {preset.handhelds?.name ?? "Unknown handheld"}
                            </span>
                          </div>

                          <h3 className="mt-3 break-words text-xl font-black">
                            {preset.name}
                          </h3>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {preset.summary ??
                              "Detailed recommended settings for this game."}
                          </p>
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 text-lg font-black text-cyan-400 transition group-open:rotate-45">
                          +
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <PresetStat
                          label="Resolution"
                          value={preset.resolution ?? "Not set"}
                        />
                        <PresetStat label="TDP" value={preset.tdp ?? "Not set"} />
                        <PresetStat
                          label="Average"
                          value={
                            preset.fps_average !== null
                              ? `${preset.fps_average} FPS`
                              : "Not set"
                          }
                          highlighted
                        />
                        <PresetStat
                          label="1% Low"
                          value={
                            preset.one_percent_low !== null
                              ? `${preset.one_percent_low} FPS`
                              : "Not set"
                          }
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[0.6rem] text-slate-600 sm:text-[0.62rem]">
                        <span>
                          Upscaler:{" "}
                          <strong className="text-slate-300">
                            {preset.upscaler ?? "Not set"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Battery:{" "}
                          <strong className="text-slate-300">
                            {preset.battery_life ?? "Not set"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>{settingsCount} settings</span>

                        {preset.community_rating !== null && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-400">
                              ★ {preset.community_rating.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </summary>

                    <div className="border-t border-white/[0.07] bg-[#060911] p-4">
                      {sortedGroups.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No detailed settings available.
                        </p>
                      ) : (
                        <div className="grid min-w-0 gap-4 md:grid-cols-2">
                          {sortedGroups.map((group) => (
                            <section
                              key={group.id}
                              className="min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-black/20"
                            >
                              <div className="border-b border-white/[0.07] px-4 py-3">
                                <h4 className="text-sm font-black">
                                  {group.name}
                                </h4>
                              </div>

                              <dl>
                                {group.preset_setting_items.map(
                                  (item, index) => (
                                    <div
                                      key={item.id}
                                      className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 ${
                                        index ===
                                        group.preset_setting_items.length - 1
                                          ? ""
                                          : "border-b border-white/[0.06]"
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <dt className="break-words text-sm font-bold text-slate-300">
                                          {item.label}
                                        </dt>

                                        {item.note && (
                                          <p className="mt-1 break-words text-xs leading-5 text-slate-600">
                                            {item.note}
                                          </p>
                                        )}
                                      </div>

                                      <dd className="max-w-28 break-words text-right text-sm font-black text-cyan-400">
                                        {item.value}
                                      </dd>
                                    </div>
                                  ),
                                )}
                              </dl>
                            </section>
                          ))}
                        </div>
                      )}

                      {preset.handhelds && (
                        <Link
                          href={`/handhelds/${preset.handhelds.slug}`}
                          className="atlas-button-secondary mt-4"
                        >
                          Open handheld profile
                        </Link>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>

        <section className="atlas-panel mt-5 min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              eyebrow="Performance data"
              title="Benchmark wall"
              noBorder
            />

            <Link
              href="/benchmarks"
              className="text-xs font-black text-cyan-400 transition hover:text-white"
            >
              View all benchmarks →
            </Link>
          </div>

          {gameBenchmarks.length === 0 ? (
            <EmptyState text="No published benchmark results are available for this game." />
          ) : (
            <div className="mt-5 max-w-full overflow-hidden rounded-xl border border-white/[0.07]">
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-[48rem] text-left md:min-w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <TableHeading label="Handheld" />
                      <TableHeading label="Preset" />
                      <TableHeading label="Resolution" />
                      <TableHeading label="TDP" />
                      <TableHeading label="Average" />
                      <TableHeading label="1% Low" />
                      <TableHeading label="Battery" />
                    </tr>
                  </thead>

                  <tbody>
                    {gameBenchmarks.map((benchmark) => (
                      <tr
                        key={benchmark.id}
                        className="border-t border-white/[0.06] transition hover:bg-white/[0.025]"
                      >
                        <td className="px-4 py-4">
                          {benchmark.handhelds ? (
                            <Link
                              href={`/handhelds/${benchmark.handhelds.slug}`}
                              className="font-black text-slate-200 transition hover:text-cyan-400"
                            >
                              {benchmark.handhelds.name}
                            </Link>
                          ) : (
                            <span className="text-slate-500">
                              Unknown handheld
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-400">
                          {benchmark.presets
                            ? `${benchmark.presets.preset_type} · ${benchmark.presets.name}`
                            : "Custom"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-400">
                          {benchmark.resolution ?? "Not set"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-400">
                          {benchmark.tdp ?? "Not set"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`font-black ${getFpsStyle(
                              benchmark.average_fps,
                            )}`}
                          >
                            {benchmark.average_fps !== null
                              ? `${benchmark.average_fps} FPS`
                              : "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-black text-slate-300">
                          {benchmark.one_percent_low !== null
                            ? `${benchmark.one_percent_low} FPS`
                            : "—"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-400">
                          {benchmark.battery_life ?? "Not set"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function HeroMetric({
  label,
  value,
  suffix,
  highlighted = false,
}: {
  label: string;
  value: string;
  suffix?: string;
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

      <div className="mt-2 flex items-end gap-1">
        <p
          className={`break-words text-2xl font-black sm:text-3xl ${
            highlighted ? "text-red-400" : "text-white"
          }`}
        >
          {value}
        </p>

        {suffix && (
          <span className="pb-1 text-[0.62rem] font-black uppercase tracking-[0.1em] text-slate-600">
            {suffix}
          </span>
        )}
      </div>
    </article>
  );
}

function StripStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[0.45rem] font-black uppercase leading-tight tracking-[0.1em] text-slate-600 sm:text-[0.52rem] sm:tracking-[0.14em]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-slate-200">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  noBorder = false,
}: {
  eyebrow: string;
  title: string;
  noBorder?: boolean;
}) {
  return (
    <div className={noBorder ? "" : "border-b border-white/[0.07] pb-3"}>
      <p className="atlas-section-label">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black">{title}</h2>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`min-w-0 rounded-xl border p-3 sm:p-4 ${
        highlighted
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-xl font-black ${
          highlighted ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function OverviewRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-5 py-4 ${
        isLast ? "" : "border-b border-white/[0.06]"
      }`}
    >
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="max-w-[65%] break-words text-right text-sm font-black text-slate-300">
        {value}
      </dd>
    </div>
  );
}

function PresetStat({
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
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-xs font-black ${
          highlighted ? "text-red-400" : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function TableHeading({ label }: { label: string }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-600">
      {label}
    </th>
  );
}
