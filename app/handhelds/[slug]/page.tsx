import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PresetCard from "../../../components/PresetCard";
import { benchmarks } from "../../../data/benchmarks";
import { games } from "../../../data/games";
import { handhelds } from "../../../data/handhelds";
import { presets } from "../../../data/presets";

interface HandheldPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: HandheldPageProps): Promise<Metadata> {
  const { slug } = await params;

  const handheld = handhelds.find((item) => item.slug === slug);

  if (!handheld) {
    return {
      title: "Handheld Not Found",
      description:
        "The requested handheld does not exist in the HandheldAtlas database.",
    };
  }

  return {
    title: `${handheld.name} Specs and Benchmarks`,
    description: `${handheld.name} specifications, presets, supported games and performance benchmarks. ${handheld.tagline}`,
    openGraph: {
      title: `${handheld.name} | HandheldAtlas`,
      description: `${handheld.name} specifications, presets and handheld gaming benchmarks.`,
      images: [
        {
          url: handheld.image,
          alt: handheld.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${handheld.name} | HandheldAtlas`,
      description: `${handheld.name} specifications, presets and handheld gaming benchmarks.`,
      images: [handheld.image],
    },
  };
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Current":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "Upcoming":
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";

    case "Discontinued":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}

export default async function HandheldPage({
  params,
}: HandheldPageProps) {
  const { slug } = await params;

  const handheld = handhelds.find((item) => item.slug === slug);

  if (!handheld) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-black">Handheld not found</h1>

          <p className="mt-3 text-slate-400">
            This device does not exist in the HandheldAtlas database.
          </p>

          <Link
            href="/handhelds"
            className="mt-8 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Back to handhelds
          </Link>
        </div>
      </main>
    );
  }

  const handheldPresets = presets.filter(
    (preset) => preset.handheldSlug === handheld.slug,
  );

  const handheldBenchmarks = benchmarks.filter(
    (benchmark) => benchmark.handheldSlug === handheld.slug,
  );

  const bestBenchmark =
    handheldBenchmarks.length > 0
      ? [...handheldBenchmarks].sort(
          (first, second) =>
            second.averageFps - first.averageFps,
        )[0]
      : undefined;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(6,182,212,0.16),transparent_35%)]" />

        <div className="relative mx-auto grid min-h-[34rem] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Link
              href="/handhelds"
              className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to handhelds
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
                  handheld.status,
                )}`}
              >
                {handheld.status}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300 backdrop-blur">
                {handheld.manufacturer}
              </span>
            </div>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              {handheld.name}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              {handheld.tagline}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Processor
                </p>

                <p className="mt-1 text-lg font-bold">
                  {handheld.processor}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Memory
                </p>

                <p className="mt-1 text-lg font-bold">
                  {handheld.memory}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Battery
                </p>

                <p className="mt-1 text-lg font-bold">
                  {handheld.battery}
                </p>
              </div>

              {bestBenchmark && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Highest Tested FPS
                  </p>

                  <p className="mt-1 text-lg font-bold">
                    {bestBenchmark.averageFps} FPS
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex min-h-[24rem] items-center justify-center">
            <div className="absolute h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative h-72 w-full max-w-2xl md:h-96">
              <Image
                src={handheld.image}
                alt={handheld.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain object-center drop-shadow-[0_35px_45px_rgba(0,0,0,0.75)]"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Hardware
          </p>

          <h2 className="mt-2 text-4xl font-black">Specifications</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SpecCard
              label="Operating System"
              value={handheld.operatingSystem}
            />

            <SpecCard
              label="Processor"
              value={handheld.processor}
            />

            <SpecCard
              label="Memory"
              value={handheld.memory}
            />

            <SpecCard
              label="Storage"
              value={handheld.storage}
            />

            <SpecCard
              label="Display"
              value={handheld.displaySize}
            />

            <SpecCard
              label="Resolution"
              value={handheld.resolution}
            />

            <SpecCard
              label="Refresh Rate"
              value={handheld.refreshRate}
            />

            <SpecCard
              label="Battery"
              value={handheld.battery}
            />

            <SpecCard
              label="Weight"
              value={handheld.weight}
            />
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Recommended Settings
              </p>

              <h2 className="mt-2 text-4xl font-black">Presets</h2>
            </div>

            <p className="text-sm text-slate-500">
              {handheldPresets.length}{" "}
              {handheldPresets.length === 1 ? "preset" : "presets"}
            </p>
          </div>

          {handheldPresets.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-bold">No presets available</h3>

              <p className="mt-2 text-slate-400">
                Presets for this handheld will be added later.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {handheldPresets.map((preset) => {
                const game = games.find(
                  (item) => item.slug === preset.gameSlug,
                );

                return (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    gameName={game?.name ?? preset.gameSlug}
                    handheldName={handheld.name}
                    manufacturer={handheld.manufacturer}
                    showGameLink
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

            <p className="text-sm text-slate-500">
              {handheldBenchmarks.length}{" "}
              {handheldBenchmarks.length === 1
                ? "benchmark"
                : "benchmarks"}
            </p>
          </div>

          {handheldBenchmarks.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8">
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
                        Game
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
                    {handheldBenchmarks.map((benchmark) => {
                      const game = games.find(
                        (item) =>
                          item.slug === benchmark.gameSlug,
                      );

                      return (
                        <tr
                          key={benchmark.id}
                          className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5 font-semibold">
                            {game?.name ?? benchmark.gameSlug}
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

interface SpecCardProps {
  label: string;
  value: string;
}

function SpecCard({ label, value }: SpecCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-lg font-bold text-slate-100">
        {value}
      </p>
    </article>
  );
}