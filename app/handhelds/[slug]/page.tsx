import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PresetCard from "../../../components/PresetCard";
import { benchmarks } from "../../../data/benchmarks";
import { games } from "../../../data/games";
import { handhelds as legacyHandhelds } from "../../../data/handhelds";
import { presets } from "../../../data/presets";
import { createClient } from "../../../lib/supabase/server";

interface HandheldPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface DatabaseHandheld {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  device_status: string;
  operating_system: string | null;
  processor: string | null;
  memory: string | null;
  storage: string | null;
  display_size: string | null;
  resolution: string | null;
  refresh_rate: string | null;
  battery: string | null;
  weight: string | null;
  image_url: string | null;
  tagline: string | null;
}

async function getHandheld(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("handhelds")
    .select(
      "id, name, slug, manufacturer, device_status, operating_system, processor, memory, storage, display_size, resolution, refresh_rate, battery, weight, image_url, tagline",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(
      "Could not load handheld:",
      error.message,
    );

    return null;
  }

  return data as DatabaseHandheld | null;
}

export async function generateMetadata({
  params,
}: HandheldPageProps): Promise<Metadata> {
  const { slug } = await params;
  const handheld = await getHandheld(slug);

  if (!handheld) {
    return {
      title: "Handheld Not Found",
      description:
        "The requested handheld does not exist in the HandheldAtlas database.",
    };
  }

  const description =
    handheld.tagline ??
    `${handheld.name} specifications, presets and handheld gaming benchmarks.`;

  return {
    title: `${handheld.name} Specs and Benchmarks`,
    description,
    openGraph: {
      title: `${handheld.name} | HandheldAtlas`,
      description,
      images: handheld.image_url
        ? [
            {
              url: handheld.image_url,
              alt: handheld.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${handheld.name} | HandheldAtlas`,
      description,
      images: handheld.image_url
        ? [handheld.image_url]
        : [],
    },
  };
}

function getDeviceStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "current":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "upcoming":
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";

    case "discontinued":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}

export default async function HandheldPage({
  params,
}: HandheldPageProps) {
  const { slug } = await params;
  const handheld = await getHandheld(slug);

  if (!handheld) {
    notFound();
  }

  const legacyHandheld = legacyHandhelds.find(
    (item) => item.slug === handheld.slug,
  );

  const handheldPresets = presets.filter(
    (preset) =>
      preset.handheldSlug === handheld.slug,
  );

  const handheldBenchmarks = benchmarks.filter(
    (benchmark) =>
      benchmark.handheldSlug === handheld.slug,
  );

  const bestBenchmark =
    handheldBenchmarks.length > 0
      ? [...handheldBenchmarks].sort(
          (first, second) =>
            second.averageFps - first.averageFps,
        )[0]
      : undefined;

  const handheldImage =
    handheld.image_url ??
    legacyHandheld?.image ??
    null;

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
                className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getDeviceStatusStyle(
                  handheld.device_status,
                )}`}
              >
                {handheld.device_status}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300 backdrop-blur">
                {handheld.manufacturer}
              </span>
            </div>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              {handheld.name}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              {handheld.tagline ??
                "Detailed information about this handheld will be added soon."}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <MetricCard
                label="Processor"
                value={
                  handheld.processor ?? "Not set"
                }
              />

              <MetricCard
                label="Memory"
                value={handheld.memory ?? "Not set"}
              />

              <MetricCard
                label="Battery"
                value={handheld.battery ?? "Not set"}
              />

              {bestBenchmark && (
                <MetricCard
                  label="Highest Tested FPS"
                  value={`${bestBenchmark.averageFps} FPS`}
                  highlighted
                />
              )}
            </div>
          </div>

          <div className="relative flex min-h-[24rem] items-center justify-center">
            <div className="absolute h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

            {handheldImage ? (
              <div className="relative h-72 w-full max-w-2xl md:h-96">
                <Image
                  src={handheldImage}
                  alt={handheld.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-center drop-shadow-[0_35px_45px_rgba(0,0,0,0.75)]"
                />
              </div>
            ) : (
              <div className="flex h-72 w-full max-w-2xl items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/50">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                  Device image coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Hardware
          </p>

          <h2 className="mt-2 text-4xl font-black">
            Specifications
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SpecCard
              label="Operating System"
              value={
                handheld.operating_system ??
                "Not set"
              }
            />

            <SpecCard
              label="Processor"
              value={handheld.processor ?? "Not set"}
            />

            <SpecCard
              label="Memory"
              value={handheld.memory ?? "Not set"}
            />

            <SpecCard
              label="Storage"
              value={handheld.storage ?? "Not set"}
            />

            <SpecCard
              label="Display"
              value={
                handheld.display_size ?? "Not set"
              }
            />

            <SpecCard
              label="Resolution"
              value={
                handheld.resolution ?? "Not set"
              }
            />

            <SpecCard
              label="Refresh Rate"
              value={
                handheld.refresh_rate ?? "Not set"
              }
            />

            <SpecCard
              label="Battery"
              value={handheld.battery ?? "Not set"}
            />

            <SpecCard
              label="Weight"
              value={handheld.weight ?? "Not set"}
            />
          </div>
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

            <p className="text-sm text-slate-500">
              {handheldPresets.length}{" "}
              {handheldPresets.length === 1
                ? "preset"
                : "presets"}
            </p>
          </div>

          {handheldPresets.length === 0 ? (
            <EmptySection
              title="No presets available"
              description="Detailed presets for this handheld will be added through the HandheldAtlas admin dashboard."
            />
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {handheldPresets.map((preset) => {
                const game = games.find(
                  (item) =>
                    item.slug === preset.gameSlug,
                );

                return (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    gameName={
                      game?.name ?? preset.gameSlug
                    }
                    handheldName={handheld.name}
                    manufacturer={
                      handheld.manufacturer
                    }
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

              <h2 className="mt-2 text-4xl font-black">
                Benchmarks
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {handheldBenchmarks.length}{" "}
              {handheldBenchmarks.length === 1
                ? "benchmark"
                : "benchmarks"}
            </p>
          </div>

          {handheldBenchmarks.length === 0 ? (
            <EmptySection
              title="No benchmarks available"
              description="Verified benchmark results for this handheld will be added later."
            />
          ) : (
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <TableHeading label="Game" />
                      <TableHeading label="Resolution" />
                      <TableHeading label="TDP" />
                      <TableHeading label="Average FPS" />
                      <TableHeading label="1% Low" />
                      <TableHeading label="Battery" />
                    </tr>
                  </thead>

                  <tbody>
                    {handheldBenchmarks.map(
                      (benchmark) => {
                        const game = games.find(
                          (item) =>
                            item.slug ===
                            benchmark.gameSlug,
                        );

                        return (
                          <tr
                            key={benchmark.id}
                            className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                          >
                            <td className="px-6 py-5 font-semibold">
                              {game?.name ??
                                benchmark.gameSlug}
                            </td>

                            <td className="px-6 py-5 text-slate-300">
                              {benchmark.resolution}
                            </td>

                            <td className="px-6 py-5 text-slate-300">
                              {benchmark.tdp}
                            </td>

                            <td className="px-6 py-5">
                              <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-bold text-cyan-400">
                                {
                                  benchmark.averageFps
                                }
                              </span>
                            </td>

                            <td className="px-6 py-5 text-slate-300">
                              {
                                benchmark.onePercentLow
                              }
                            </td>

                            <td className="px-6 py-5 text-slate-300">
                              {
                                benchmark.batteryLife
                              }
                            </td>
                          </tr>
                        );
                      },
                    )}
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
            Handheld profiles now load from Supabase.
            Existing presets and benchmark results still
            use legacy data until their admin modules are
            completed.
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
          : "border border-white/10 bg-white/5"
      }`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-[0.2em] ${
          highlighted
            ? "text-cyan-300"
            : "text-slate-500"
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

interface SpecCardProps {
  label: string;
  value: string;
}

function SpecCard({
  label,
  value,
}: SpecCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500/50">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold text-slate-100">
        {value}
      </p>
    </article>
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
      <h3 className="text-xl font-bold">
        {title}
      </h3>

      <p className="mt-2 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function TableHeading({
  label,
}: {
  label: string;
}) {
  return (
    <th className="px-6 py-4 text-sm font-semibold text-slate-500">
      {label}
    </th>
  );
}