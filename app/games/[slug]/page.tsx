import { withBenchmarkContributors } from "../../../lib/benchmark-contributors";
import { SaveGameButton } from "../../../components/PersonalAtlas";
import DataNotice from "../../../components/DataNotice";
import { cache } from "react";
import BenchmarkCard from "../../../components/BenchmarkCard";
import {
  BENCHMARK_SELECT,
  type BenchmarkRecord,
} from "../../../lib/benchmarks";
import { catalogUrl } from "../../../lib/catalog/query";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GameRatingControl from "../../../components/GameRatingControl";
import JsonLd from "../../../components/JsonLd";
import AtlasScore from "../../../components/AtlasScore";
import PresetTrustBadge from "../../../components/PresetTrustBadge";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { getPresetProfileGuide } from "../../../lib/preset-guidance";
import { calculatePresetTrust } from "../../../lib/preset-trust";
import { absoluteUrl, siteConfig } from "../../../lib/site";

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
  publisher: string | null;
  release_date: string | null;
  release_year: number | null;
  platforms: string[];
  steam_app_id: number | null;
  metacritic_critic_score: number | null;
  metacritic_user_score: number | null;
  metacritic_url: string | null;
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
  preset_type: "Performance" | "Balanced" | "Battery" | "Docked" | "Custom";
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  upscaler: string | null;
  battery_life: string | null;
  community_rating: number | null;
  summary: string | null;
  atlas_verified: boolean;
  evidence_exception_approved: boolean;

  handhelds: {
    name: string;
    slug: string;
    manufacturer: string;
  } | null;

  preset_setting_groups: DatabaseSettingGroup[];
  preset_votes: Array<{
    user_id: string;
  }>;
  preset_confirmations: Array<{
    user_id: string;
  }>;
}

type DatabaseBenchmark = BenchmarkRecord;

const getGame = cache(async function getGame(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      "id, name, slug, genre, developer, publisher, release_date, release_year, platforms, steam_app_id, metacritic_critic_score, metacritic_user_score, metacritic_url, best_handheld, recommended_tdp, notes, cover_image_url",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Could not load game:", error.message);
    throw new Error("Could not load the game. Please try again.");
  }

  return data as DatabaseGame | null;
});

async function getGamePresets(gameId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("presets")
    .select(
      `
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
      atlas_verified,
      evidence_exception_approved,
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
      ),
      preset_votes (
        user_id
      ),
      preset_confirmations (
        user_id
      )
    `,
    )
    .eq("game_id", gameId)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error("Could not load game presets:", error.message);
    throw new Error(
      "Performance data is temporarily unavailable. Please try again.",
    );
  }

  return (data ?? []) as unknown as DatabasePreset[];
}

async function getGameBenchmarks(gameId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("benchmarks")
    .select(BENCHMARK_SELECT)
    .eq("game_id", gameId)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error("Could not load game benchmarks:", error.message);
    throw new Error(
      "Performance data is temporarily unavailable. Please try again.",
    );
  }

  return withBenchmarkContributors(
    (data ?? []) as unknown as DatabaseBenchmark[],
  );
}

async function getGameRatings(gameId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [summaryResult, userRatingResult] = await Promise.all([
    supabase.rpc("get_game_rating_summary", {
      p_game_id: gameId,
    }, { get: true }),
    user
      ? supabase
          .from("game_ratings")
          .select("rating")
          .eq("game_id", gameId)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ]);

  if (summaryResult.error) {
    console.error(
      "Could not load game rating summary:",
      summaryResult.error.message,
    );
  }

  if (userRatingResult.error) {
    console.error(
      "Could not load the current user's game rating:",
      userRatingResult.error.message,
    );
  }

  const summaryRow = Array.isArray(summaryResult.data)
    ? summaryResult.data[0]
    : summaryResult.data;

  const averageRating =
    summaryRow?.average_rating !== null &&
    summaryRow?.average_rating !== undefined
      ? Number(summaryRow.average_rating)
      : null;

  const ratingCount = Number(summaryRow?.rating_count ?? 0);
  const userRating = userRatingResult.data?.rating ?? null;

  return {
    unavailable: Boolean(summaryResult.error || userRatingResult.error),
    averageRating:
      averageRating !== null && Number.isFinite(averageRating)
        ? averageRating
        : null,
    ratingCount: Number.isFinite(ratingCount)
      ? Math.max(0, Math.trunc(ratingCount))
      : 0,
    userRating: userRating !== null ? Number(userRating) : null,
    isAuthenticated: user !== null,
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
    alternates: {
      canonical: `/games/${game.slug}`,
    },
    openGraph: {
      url: `/games/${game.slug}`,
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

function getPerformanceStatus(presetCount: number, benchmarkCount: number) {
  if (benchmarkCount > 0) {
    return {
      label: "Benchmark results available",
      style: "border-green-500/30 bg-green-500/10 text-green-400",
    };
  }

  if (presetCount > 0) {
    return {
      label: "Preset available",
      style: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    };
  }

  return {
    label: "Performance not tested",
    style: "border-orange-500/30 bg-orange-500/10 text-orange-300",
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

function getPerformanceOverview({
  gameName,
  presetCount,
  benchmarkCount,
}: {
  gameName: string;
  presetCount: number;
  benchmarkCount: number;
}) {
  if (benchmarkCount)
    return `${gameName} has ${benchmarkCount} published benchmarks. Compare the graphics profile, resolution, power mode and source for each result. Results from different test conditions are not a single performance rating for the game.`;
  if (presetCount)
    return `${gameName} has ${presetCount} published presets. Open a preset to check its settings and supporting evidence.`;
  return `No handheld-specific measurements are available yet for ${gameName}. Check back for documented presets and benchmarks.`;
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGame(slug);

  if (!game) {
    notFound();
  }

  const [gamePresets, gameBenchmarks, gameRatings] = await Promise.all([
    getGamePresets(game.id),
    getGameBenchmarks(game.id),
    getGameRatings(game.id),
  ]);

  const performanceStatus = getPerformanceStatus(
    gamePresets.length,
    gameBenchmarks.length,
  );
  const gameUrl = absoluteUrl(`/games/${game.slug}`);
  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "@id": `${gameUrl}#game`,
    name: game.name,
    url: gameUrl,
    description:
      game.notes ??
      `${game.name} handheld presets, recommended settings and performance information.`,
    genre: game.genre,
    image: game.cover_image_url ? absoluteUrl(game.cover_image_url) : undefined,
    datePublished: game.release_date ?? game.release_year?.toString(),
    author: game.developer
      ? {
          "@type": "Organization",
          name: game.developer,
        }
      : undefined,
    publisher: game.publisher
      ? {
          "@type": "Organization",
          name: game.publisher,
        }
      : {
          "@id": `${siteConfig.url}/#organization`,
        },
    gamePlatform:
      game.platforms.length > 0 ? game.platforms : ["PC", "Handheld gaming PC"],
    aggregateRating:
      gameRatings.averageRating !== null && gameRatings.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: gameRatings.averageRating,
            ratingCount: gameRatings.ratingCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Games",
        item: absoluteUrl("/games"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: game.name,
        item: gameUrl,
      },
    ],
  };

  const testedDevices = new Set(
    gameBenchmarks.map((b) => b.handhelds?.slug).filter(Boolean),
  ).size;
  const performanceOverview = getPerformanceOverview({
    gameName: game.name,
    presetCount: gamePresets.length,
    benchmarkCount: gameBenchmarks.length,
  });

  return (
    <>
      <JsonLd data={[gameJsonLd, breadcrumbJsonLd]} />
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
                  className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] backdrop-blur ${performanceStatus.style}`}
                >
                  {performanceStatus.label}
                </span>

                <span className="atlas-chip">{game.genre}</span>

                {(game.release_date || game.release_year) && (
                  <span className="atlas-chip">
                    {game.release_date ?? game.release_year}
                  </span>
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
                  href={catalogUrl("/presets", { game: game.slug })}
                  className="atlas-button-primary w-full sm:w-auto"
                >
                  Browse presets
                </Link>

                <Link
                  href={catalogUrl("/benchmarks", { game: game.slug })}
                  className="atlas-button-secondary w-full sm:w-auto"
                >
                  View benchmarks
                </Link>
                <SaveGameButton name={game.name} slug={game.slug} />
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <AtlasScore
                score={game.metacritic_critic_score}
                variant="large"
                className="h-full"
              />
              <HeroMetric
                label="Benchmark results"
                value={gameBenchmarks.length.toString()}
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
                label="Tested devices"
                value={testedDevices.toString()}
              />
              <StripStat
                label="Performance status"
                value={performanceStatus.label}
              />
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
                {performanceOverview}
              </p>

              <div className="mt-5 border-t border-white/[0.07] pt-5">
                <p className="atlas-section-label">Community rating</p>

                <h3 className="mt-2 text-xl font-black">Rate this game</h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Community ratings measure player opinion separately from the
                  PC Metacritic score displayed as Atlas Score, with one live
                  vote per account.
                </p>

                <div className="mt-4">
                  {gameRatings.unavailable ? (
                    <DataNotice label="Community ratings are temporarily unavailable." />
                  ) : (
                    <GameRatingControl
                      gameId={game.id}
                      initialAverageRating={gameRatings.averageRating}
                      initialRatingCount={gameRatings.ratingCount}
                      initialUserRating={gameRatings.userRating}
                      isAuthenticated={gameRatings.isAuthenticated}
                    />
                  )}
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
                <OverviewRow
                  label="Publisher"
                  value={game.publisher ?? "Not set"}
                />
                <OverviewRow label="Genre" value={game.genre} />
                <OverviewRow
                  label="Release date"
                  value={
                    game.release_date ??
                    game.release_year?.toString() ??
                    "Not set"
                  }
                />
                <OverviewRow
                  label="Platforms"
                  value={
                    game.platforms.length > 0
                      ? game.platforms.join(", ")
                      : "Not set"
                  }
                />
                <OverviewRow
                  label="Steam App ID"
                  value={game.steam_app_id?.toString() ?? "Not set"}
                />
                {game.metacritic_user_score !== null && (
                  <OverviewRow
                    label="Metacritic users"
                    value={`${game.metacritic_user_score}/10`}
                  />
                )}
                <OverviewRow
                  label="Score source"
                  value={
                    game.metacritic_critic_score !== null
                      ? "Metacritic PC critics"
                      : "Not available"
                  }
                  href={
                    game.metacritic_critic_score !== null
                      ? (game.metacritic_url ?? undefined)
                      : undefined
                  }
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
                href={catalogUrl("/presets", { game: game.slug })}
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
                  const settingsCount = (
                    preset.preset_setting_groups ?? []
                  ).reduce(
                    (total, group) =>
                      total + (group.preset_setting_items ?? []).length,
                    0,
                  );
                  const profileGuide = getPresetProfileGuide(
                    preset.preset_type,
                  );
                  const trustReport = calculatePresetTrust({
                    averageFps: preset.fps_average,
                    onePercentLow: preset.one_percent_low,
                    resolution: preset.resolution,
                    tdp: preset.tdp,
                    upscaler: preset.upscaler,
                    batteryLife: preset.battery_life,
                    summary: preset.summary,
                    communityRating: preset.community_rating,
                    upvoteCount: preset.preset_votes?.length ?? 0,
                    confirmationCount: preset.preset_confirmations?.length ?? 0,
                    atlasVerified: preset.atlas_verified ?? false,
                    groups: (preset.preset_setting_groups ?? []).map(
                      (group) => ({
                        items: group.preset_setting_items ?? [],
                      }),
                    ),
                  });
                  const evidenceBadges = [
                    preset.atlas_verified ? "Atlas Verified" : null,
                    preset.evidence_exception_approved
                      ? "Evidence exception"
                      : null,
                    `Confidence ${trustReport.score}/100`,
                    preset.fps_average !== null &&
                    preset.one_percent_low !== null
                      ? "Measured FPS"
                      : null,
                    preset.resolution && preset.tdp ? "Exact target" : null,
                    settingsCount > 0 ? `${settingsCount} settings` : null,
                    preset.community_rating !== null ? "Community rated" : null,
                  ].filter((value): value is string => Boolean(value));

                  return (
                    <article
                      key={preset.id}
                      className="atlas-card atlas-card-hover flex min-w-0 flex-col overflow-hidden"
                    >
                      <div className="min-w-0 flex-1 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] ${getPresetStyle(
                              preset.preset_type,
                            )}`}
                          >
                            {preset.preset_type}
                          </span>

                          <PresetTrustBadge
                            score={trustReport.score}
                            label={trustReport.label}
                            tone={trustReport.tone}
                            compact
                          />

                          <span className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-cyan-400">
                            {preset.handhelds?.name ?? "Unknown handheld"}
                          </span>
                        </div>

                        <Link
                          href={`/presets/${preset.id}`}
                          className="group mt-3 block w-fit max-w-full"
                        >
                          <h3 className="break-words text-xl font-black transition group-hover:text-red-400 sm:text-2xl">
                            {preset.name}
                          </h3>
                        </Link>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                          {preset.summary ??
                            "Detailed recommended settings for this game."}
                        </p>

                        <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                          <p className="text-[0.52rem] font-black uppercase tracking-[0.13em] text-slate-600">
                            Best for
                          </p>
                          <p className="mt-2 text-xs font-bold leading-5 text-slate-300">
                            {profileGuide.bestFor}
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <PresetStat
                            label="Resolution"
                            value={preset.resolution ?? "Not set"}
                          />
                          <PresetStat
                            label="TDP"
                            value={preset.tdp ?? "Not set"}
                          />
                          <PresetStat
                            label="Average"
                            value={
                              preset.fps_average !== null
                                ? `${preset.fps_average} FPS`
                                : "Not reported"
                            }
                            highlighted
                          />
                          <PresetStat
                            label="1% Low"
                            value={
                              preset.one_percent_low !== null
                                ? `${preset.one_percent_low} FPS`
                                : "Not reported"
                            }
                          />
                        </div>

                        {evidenceBadges.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {evidenceBadges.map((badge) => (
                              <span
                                key={badge}
                                className="rounded-full border border-white/[0.08] bg-black/25 px-2.5 py-1 text-[0.52rem] font-black uppercase tracking-[0.09em] text-slate-500"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2 border-t border-white/[0.06] bg-black/20 p-4 sm:grid-cols-2">
                        <Link
                          href={`/presets/${preset.id}`}
                          className="atlas-button-primary text-center"
                        >
                          View full preset
                        </Link>

                        {preset.handhelds ? (
                          <Link
                            href={`/handhelds/${preset.handhelds.slug}`}
                            className="atlas-button-secondary text-center"
                          >
                            Open handheld
                          </Link>
                        ) : (
                          <span className="atlas-button-secondary cursor-not-allowed text-center opacity-40">
                            Handheld unavailable
                          </span>
                        )}
                      </div>
                    </article>
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
                href={catalogUrl("/benchmarks", { game: game.slug })}
                className="text-xs font-black text-cyan-400 transition hover:text-white"
              >
                View all benchmarks →
              </Link>
            </div>

            {gameBenchmarks.length === 0 ? (
              <EmptyState text="No published benchmark results yet." />
            ) : (
              <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
                {gameBenchmarks.slice(0, 6).map((benchmark) => (
                  <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
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

      <p className="mt-1 truncate text-sm font-black text-slate-200">{value}</p>
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

function OverviewRow({
  label,
  value,
  href,
  isLast = false,
}: {
  label: string;
  value: string;
  href?: string;
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
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 transition hover:text-white"
          >
            {value} ↗
          </a>
        ) : (
          value
        )}
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
