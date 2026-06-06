import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PresetCard from "../../../components/PresetCard";
import { benchmarks } from "../../../data/benchmarks";
import { games as legacyGames } from "../../../data/games";
import { handhelds } from "../../../data/handhelds";
import { presets } from "../../../data/presets";
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
        ? [
            {
              url: game.cover_image_url,
              alt: game.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.name} Handheld Settings | HandheldAtlas`,
      description,
      images: game.cover_image_url
        ? [game.cover_image_url]
        : [],
    },
  };
}

function getCompatibilityStyle(score: number | null) {
  if (score === null) {
    return {
      label: "Unrated",
      className:
        "border-slate-500/30 bg-slate-500/15 text-slate-300",
    };
  }

  if (score >= 90) {
    return {
      label: "Excellent",
      className:
        "border-green-400/30 bg-green-500/20 text-green-400",
    };
  }

  if (score >= 85) {
    return {
      label: "Great",
      className:
        "border-cyan-400/30 bg-cyan-500/20 text-cyan-400",
    };
  }

  if (score >= 75) {
    return {
      label: "Playable",
      className:
        "border-orange-400/30 bg-orange-500/20 text-orange-400",
    };
  }

  return {
    label: "Tweaks Required",
    className:
      "border-red-400/30 bg-red-500/20 text-red-400",
  };
}

export default async function GamePage({
  params,
}: GamePageProps) {
  const { slug } = await params;
  const game = await getGame(slug);

  if (!game) {
    notFound();
  }

  const legacyGame = legacyGames.find(
    (item) => item.slug === game.slug,
  );

  const gamePresets = presets.filter(
    (preset) => preset.gameSlug === game.slug,
  );

  const gameBenchmarks = benchmarks.filter(
    (benchmark) => benchmark.gameSlug === game.slug,
  );

  const compatibility = getCompatibilityStyle(
    game.atlas_score,
  );

  const bestBenchmark =
    gameBenchmarks.length > 0
      ? [...gameBenchmarks].sort(
          (first, second) =>
            second.averageFps - first.averageFps,
        )[0]
      : undefined;

  const coverImage =
    game.cover_image_url ??
    legacyGame?.coverImage ??
    null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-[34rem] overflow-hidden border-b border-slate-800 bg-slate-950">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={game.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
        )}

        <div className="absolute inset-0 bg-slate-950/45" />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30" />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />

        <div className="relative mx-auto flex min-h-[34rem] max-w-7xl items-end px-6 py-14">
          <div className="max-w-3xl">
            <Link
              href="/games"
              className="inline-flex text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to games
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide backdrop-blur ${compatibility.className}`}
              >
                {compatibility.label}
              </span>

              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-200 backdrop-blur">
                {game.genre}
              </span>

              {game.release_year && (
                <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-200 backdrop-blur">
                  {game.release_year}
                </span>
              )}
            </div>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              {game.name}
            </h1>

            <p className="mt-4 text-lg text-slate-300">
              {game.developer ?? "Unknown developer"}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <MetricCard
                label="Atlas Score"
                value={
                  game.atlas_score !== null
                    ? `${game.atlas_score}/100`
                    : "Unrated"
                }
                highlighted
              />

              <MetricCard
                label="Best Handheld"
                value={game.best_handheld ?? "Not set"}
              />

              <MetricCard
                label="Recommended TDP"
                value={game.recommended_tdp ?? "Not set"}
              />

              {bestBenchmark && (
                <MetricCard
                  label="Highest Tested FPS"
                  value={`${bestBenchmark.averageFps} FPS`}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Atlas Notes
            </p>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              {game.notes ??
                "Detailed handheld notes for this game will be added soon."}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Quick Overview
            </p>

            <dl className="mt-5 space-y-4">
              <OverviewRow
                label="Developer"
                value={game.developer ?? "Not set"}
              />

              <OverviewRow
                label="Release year"
                value={
                  game.release_year?.toString() ?? "Not set"
                }
              />

              <OverviewRow
                label="Available presets"
                value={gamePresets.length.toString()}
              />

              <OverviewRow
                label="Benchmarks"
                value={gameBenchmarks.length.toString()}
                isLast
              />
            </dl>
          </article>
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Recommended Settings
              </p>

              <h2 className="mt-2 text-4xl font-black">
                Presets
              </h2>
            </div>

            <Link
              href="/presets"
              className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Browse all presets →
            </Link>
          </div>

          {gamePresets.length === 0 ? (
            <EmptySection
              title="No presets available"
              description="Detailed presets for this game will be added through the HandheldAtlas admin dashboard."
            />
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {gamePresets.map((preset) => {
                const handheld = handhelds.find(
                  (item) =>
                    item.slug === preset.handheldSlug,
                );

                return (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    gameName={game.name}
                    handheldName={
                      handheld?.name ?? preset.handheldSlug
                    }
                    manufacturer={
                      handheld?.manufacturer ??
                      "Unknown manufacturer"
                    }
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Performance Data
              </p>

              <h2 className="mt-2 text-4xl font-black">
                Benchmarks
              </h2>
            </div>

            <Link
              href="/benchmarks"
              className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Browse all benchmarks →
            </Link>
          </div>

          {gameBenchmarks.length === 0 ? (
            <EmptySection
              title="No benchmarks available"
              description="Verified benchmark results for this game will be added later."
            />
          ) : (
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <TableHeading label="Handheld" />
                      <TableHeading label="Resolution" />
                      <TableHeading label="TDP" />
                      <TableHeading label="Average FPS" />
                      <TableHeading label="1% Low" />
                      <TableHeading label="Battery" />
                    </tr>
                  </thead>

                  <tbody>
                    {gameBenchmarks.map((benchmark) => {
                      const handheld = handhelds.find(
                        (item) =>
                          item.slug ===
                          benchmark.handheldSlug,
                      );

                      return (
                        <tr
                          key={benchmark.id}
                          className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5 font-semibold">
                            {handheld?.name ??
                              benchmark.handheldSlug}
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.resolution}
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.tdp}
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-bold text-cyan-400">
                              {benchmark.averageFps}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.onePercentLow}
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.batteryLife}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <div className="mt-10 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold text-yellow-300">
            Preset migration in progress
          </p>

          <p className="mt-2 text-sm text-yellow-100/70">
            Game profiles now load from Supabase. Existing presets and
            benchmark results still use the legacy data files until
            their admin modules are completed.
          </p>
        </div>
      </div>
    </main>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function MetricCard({
  label,
  value,
  highlighted = false,
}: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 backdrop-blur ${
        highlighted
          ? "border border-cyan-500/30 bg-cyan-500/15"
          : "border border-white/10 bg-black/30"
      }`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-[0.2em] ${
          highlighted
            ? "text-cyan-300"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

interface OverviewRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function OverviewRow({
  label,
  value,
  isLast = false,
}: OverviewRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        isLast
          ? ""
          : "border-b border-slate-800 pb-4"
      }`}
    >
      <dt className="text-sm text-slate-500">{label}</dt>

      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}

interface EmptySectionProps {
  title: string;
  description: string;
}

function EmptySection({
  title,
  description,
}: EmptySectionProps) {
  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
      <h3 className="text-xl font-bold">{title}</h3>

      <p className="mt-2 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function TableHeading({ label }: { label: string }) {
  return (
    <th className="px-6 py-4 text-sm font-semibold text-slate-500">
      {label}
    </th>
  );
}