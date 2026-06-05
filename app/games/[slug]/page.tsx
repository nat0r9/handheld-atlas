import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PresetCard from "../../../components/PresetCard";
import { benchmarks } from "../../../data/benchmarks";
import { games } from "../../../data/games";
import { handhelds } from "../../../data/handhelds";
import { presets } from "../../../data/presets";

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;

  const game = games.find((item) => item.slug === slug);

  if (!game) {
    return {
      title: "Game Not Found",
      description:
        "The requested game does not exist in the HandheldAtlas database.",
    };
  }

  return {
    title: `${game.name} Handheld Settings`,
    description: `${game.name} handheld presets, recommended TDP, performance benchmarks and Atlas Score. Best handheld: ${game.bestHandheld}.`,
    openGraph: {
      title: `${game.name} Handheld Settings | HandheldAtlas`,
      description: `${game.name} presets, benchmarks and recommended handheld settings.`,
      images: [
        {
          url: game.coverImage,
          alt: game.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.name} Handheld Settings | HandheldAtlas`,
      description: `${game.name} presets, benchmarks and recommended handheld settings.`,
      images: [game.coverImage],
    },
  };
}

function getCompatibilityStyle(score: number) {
  if (score >= 90) {
    return {
      label: "Excellent",
      className: "bg-green-500 text-white",
    };
  }

  if (score >= 85) {
    return {
      label: "Great",
      className: "bg-cyan-500 text-slate-950",
    };
  }

  if (score >= 75) {
    return {
      label: "Playable",
      className: "bg-orange-500 text-white",
    };
  }

  return {
    label: "Tweaks Required",
    className: "bg-red-500 text-white",
  };
}

export default async function GamePage({
  params,
}: GamePageProps) {
  const { slug } = await params;

  const game = games.find((item) => item.slug === slug);

  if (!game) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black">Game not found</h1>

          <p className="mt-3 text-slate-400">
            The requested game does not exist in the database.
          </p>

          <Link
            href="/games"
            className="mt-8 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Back to games
          </Link>
        </div>
      </main>
    );
  }

  const gamePresets = presets.filter(
    (preset) => preset.gameSlug === game.slug,
  );

  const gameBenchmarks = benchmarks.filter(
    (benchmark) => benchmark.gameSlug === game.slug,
  );

  const compatibility = getCompatibilityStyle(game.atlasScore);

  const bestBenchmark =
    gameBenchmarks.length > 0
      ? [...gameBenchmarks].sort(
          (first, second) =>
            second.averageFps - first.averageFps,
        )[0]
      : undefined;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-[34rem] overflow-hidden border-b border-slate-800">
        <Image
          src={game.coverImage}
          alt={game.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

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
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${compatibility.className}`}
              >
                {compatibility.label}
              </span>

              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-200 backdrop-blur">
                {game.genre}
              </span>

              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-200 backdrop-blur">
                {game.releaseYear}
              </span>
            </div>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              {game.name}
            </h1>

            <p className="mt-4 text-lg text-slate-300">
              {game.developer}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/15 px-5 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Atlas Score
                </p>

                <p className="mt-1 text-3xl font-black text-white">
                  {game.atlasScore}
                  <span className="text-lg text-slate-400">/100</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Best Handheld
                </p>

                <p className="mt-1 text-lg font-bold text-white">
                  {game.bestHandheld}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Recommended TDP
                </p>

                <p className="mt-1 text-lg font-bold text-white">
                  {game.recommendedTDP}
                </p>
              </div>

              {bestBenchmark && (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Highest Tested FPS
                  </p>

                  <p className="mt-1 text-lg font-bold text-white">
                    {bestBenchmark.averageFps} FPS
                  </p>
                </div>
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
              {game.notes}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Quick Overview
            </p>

            <dl className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <dt className="text-sm text-slate-500">Developer</dt>
                <dd className="text-right font-bold">{game.developer}</dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <dt className="text-sm text-slate-500">Release year</dt>
                <dd className="font-bold">{game.releaseYear}</dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <dt className="text-sm text-slate-500">Available presets</dt>
                <dd className="font-bold">{gamePresets.length}</dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-slate-500">Benchmarks</dt>
                <dd className="font-bold">{gameBenchmarks.length}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Recommended Settings
              </p>

              <h2 className="mt-2 text-4xl font-black">Presets</h2>
            </div>

            <Link
              href="/presets"
              className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Browse all presets →
            </Link>
          </div>

          {gamePresets.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-bold">No presets available</h3>

              <p className="mt-2 text-slate-400">
                Presets for this game will be added later.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {gamePresets.map((preset) => {
                const handheld = handhelds.find(
                  (item) => item.slug === preset.handheldSlug,
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

              <h2 className="mt-2 text-4xl font-black">Benchmarks</h2>
            </div>

            <Link
              href="/benchmarks"
              className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Browse all benchmarks →
            </Link>
          </div>

          {gameBenchmarks.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-bold">No benchmarks available</h3>

              <p className="mt-2 text-slate-400">
                Verified benchmark results will be added later.
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Handheld
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Resolution
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        TDP
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Average FPS
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        1% Low
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Battery
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {gameBenchmarks.map((benchmark) => {
                      const handheld = handhelds.find(
                        (item) =>
                          item.slug === benchmark.handheldSlug,
                      );

                      return (
                        <tr
                          key={benchmark.id}
                          className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5 font-semibold">
                            {handheld?.name ?? benchmark.handheldSlug}
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
      </div>
    </main>
  );
}