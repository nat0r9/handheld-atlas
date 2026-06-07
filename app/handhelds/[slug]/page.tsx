import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  games: {
    name: string;
    slug: string;
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
  games: {
    name: string;
    slug: string;
  } | null;
  presets: {
    name: string;
    preset_type: string;
  } | null;
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

async function getHandheldPresets(
  handheldId: string,
) {
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
      games (
        name,
        slug
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
    .eq("handheld_id", handheldId)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error(
      "Could not load handheld presets:",
      error.message,
    );

    return [];
  }

  return (data ??
    []) as unknown as DatabasePreset[];
}

async function getHandheldBenchmarks(
  handheldId: string,
) {
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
      games (
        name,
        slug
      ),
      presets (
        name,
        preset_type
      )
    `)
    .eq("handheld_id", handheldId)
    .eq("status", "published")
    .order("average_fps", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error(
      "Could not load handheld benchmarks:",
      error.message,
    );

    return [];
  }

  return (data ??
    []) as unknown as DatabaseBenchmark[];
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

function getPresetStyle(
  type: DatabasePreset["preset_type"],
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

export default async function HandheldPage({
  params,
}: HandheldPageProps) {
  const { slug } = await params;
  const handheld = await getHandheld(slug);

  if (!handheld) {
    notFound();
  }

  const [
    handheldPresets,
    handheldBenchmarks,
  ] = await Promise.all([
    getHandheldPresets(handheld.id),
    getHandheldBenchmarks(handheld.id),
  ]);

  const bestBenchmark =
    handheldBenchmarks.find(
      (benchmark) =>
        benchmark.average_fps !== null,
    );

  const handheldImage =
    handheld.image_url;

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
                  handheld.processor ??
                  "Not set"
                }
              />

              <MetricCard
                label="Memory"
                value={
                  handheld.memory ??
                  "Not set"
                }
              />

              <MetricCard
                label="Battery"
                value={
                  handheld.battery ??
                  "Not set"
                }
              />

              <MetricCard
                label="Published Presets"
                value={handheldPresets.length.toString()}
              />

              {bestBenchmark?.average_fps !==
                null &&
                bestBenchmark?.average_fps !==
                  undefined && (
                  <MetricCard
                    label="Highest Tested FPS"
                    value={`${bestBenchmark.average_fps} FPS`}
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
              value={
                handheld.processor ??
                "Not set"
              }
            />

            <SpecCard
              label="Memory"
              value={
                handheld.memory ??
                "Not set"
              }
            />

            <SpecCard
              label="Storage"
              value={
                handheld.storage ??
                "Not set"
              }
            />

            <SpecCard
              label="Display"
              value={
                handheld.display_size ??
                "Not set"
              }
            />

            <SpecCard
              label="Resolution"
              value={
                handheld.resolution ??
                "Not set"
              }
            />

            <SpecCard
              label="Refresh Rate"
              value={
                handheld.refresh_rate ??
                "Not set"
              }
            />

            <SpecCard
              label="Battery"
              value={
                handheld.battery ??
                "Not set"
              }
            />

            <SpecCard
              label="Weight"
              value={
                handheld.weight ??
                "Not set"
              }
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

            <Link
              href="/presets"
              className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Browse all presets →
            </Link>
          </div>

          {handheldPresets.length === 0 ? (
            <EmptySection
              title="No presets available"
              description="Published presets for this handheld will appear here automatically."
            />
          ) : (
            <div className="mt-8 space-y-6">
              {handheldPresets.map((preset) => {
                const sortedGroups = [
                  ...(preset.preset_setting_groups ??
                    []),
                ]
                  .sort(
                    (first, second) =>
                      first.sort_order -
                      second.sort_order,
                  )
                  .map((group) => ({
                    ...group,

                    preset_setting_items: [
                      ...(group.preset_setting_items ??
                        []),
                    ].sort(
                      (first, second) =>
                        first.sort_order -
                        second.sort_order,
                    ),
                  }));

                const settingsCount =
                  sortedGroups.reduce(
                    (total, group) =>
                      total +
                      group
                        .preset_setting_items
                        .length,
                    0,
                  );

                return (
                  <details
                    key={preset.id}
                    className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                  >
                    <summary className="cursor-pointer list-none p-6 transition hover:bg-slate-800/40 md:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getPresetStyle(
                                preset.preset_type,
                              )}`}
                            >
                              {preset.preset_type}
                            </span>

                            <span className="text-sm font-bold text-cyan-400">
                              {preset.games?.name ??
                                "Unknown game"}
                            </span>
                          </div>

                          <h3 className="mt-5 text-3xl font-black">
                            {preset.name}
                          </h3>

                          <p className="mt-2 text-lg text-slate-400">
                            {preset.games?.name ??
                              "Unknown game"}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {preset.community_rating !==
                            null && (
                            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-right">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                                Rating
                              </p>

                              <p className="mt-1 font-black text-yellow-300">
                                ★{" "}
                                {preset.community_rating.toFixed(
                                  1,
                                )}
                              </p>
                            </div>
                          )}

                          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xl font-black text-cyan-400 transition group-open:rotate-45">
                            +
                          </span>
                        </div>
                      </div>

                      {preset.summary && (
                        <p className="mt-5 max-w-4xl leading-7 text-slate-400">
                          {preset.summary}
                        </p>
                      )}

                      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                        <PresetStat
                          label="Resolution"
                          value={
                            preset.resolution ??
                            "Not set"
                          }
                        />

                        <PresetStat
                          label="TDP"
                          value={
                            preset.tdp ??
                            "Not set"
                          }
                        />

                        <PresetStat
                          label="Average FPS"
                          value={
                            preset.fps_average !==
                            null
                              ? `${preset.fps_average} FPS`
                              : "Not set"
                          }
                          highlighted
                        />

                        <PresetStat
                          label="1% Low"
                          value={
                            preset.one_percent_low !==
                            null
                              ? `${preset.one_percent_low} FPS`
                              : "Not set"
                          }
                        />

                        <PresetStat
                          label="Upscaler"
                          value={
                            preset.upscaler ??
                            "Not set"
                          }
                        />

                        <PresetStat
                          label="Battery"
                          value={
                            preset.battery_life ??
                            "Not set"
                          }
                        />

                        <PresetStat
                          label="Settings"
                          value={`${settingsCount} values`}
                        />
                      </div>
                    </summary>

                    <div className="border-t border-slate-800 bg-slate-950/70 p-6 md:p-8">
                      <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                        Complete Configuration
                      </p>

                      <h4 className="mt-2 text-3xl font-black">
                        Full settings
                      </h4>

                      {sortedGroups.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                          <p className="font-bold text-slate-300">
                            No detailed settings available
                          </p>
                        </div>
                      ) : (
                        <div className="mt-7 grid gap-6 lg:grid-cols-2">
                          {sortedGroups.map(
                            (group) => (
                              <section
                                key={group.id}
                                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                              >
                                <div className="border-b border-slate-800 bg-slate-950 px-5 py-4">
                                  <h5 className="text-xl font-black">
                                    {group.name}
                                  </h5>
                                </div>

                                <dl>
                                  {group.preset_setting_items.map(
                                    (
                                      item,
                                      itemIndex,
                                    ) => (
                                      <div
                                        key={item.id}
                                        className={`grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] ${
                                          itemIndex ===
                                          group
                                            .preset_setting_items
                                            .length -
                                            1
                                            ? ""
                                            : "border-b border-slate-800"
                                        }`}
                                      >
                                        <div>
                                          <dt className="font-semibold text-slate-300">
                                            {item.label}
                                          </dt>

                                          {item.note && (
                                            <p className="mt-1 text-sm text-slate-500">
                                              {item.note}
                                            </p>
                                          )}
                                        </div>

                                        <dd className="font-black text-cyan-400">
                                          {item.value}
                                        </dd>
                                      </div>
                                    ),
                                  )}
                                </dl>
                              </section>
                            ),
                          )}
                        </div>
                      )}

                      {preset.games && (
                        <Link
                          href={`/games/${preset.games.slug}`}
                          className="mt-7 inline-flex rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                        >
                          View {preset.games.name} →
                        </Link>
                      )}
                    </div>
                  </details>
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

          {handheldBenchmarks.length === 0 ? (
            <EmptySection
              title="No benchmarks available"
              description="Published benchmark results for this handheld will appear here automatically."
            />
          ) : (
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <TableHeading label="Game" />
                      <TableHeading label="Preset" />
                      <TableHeading label="Resolution" />
                      <TableHeading label="TDP" />
                      <TableHeading label="Average FPS" />
                      <TableHeading label="1% Low" />
                      <TableHeading label="Battery" />
                    </tr>
                  </thead>

                  <tbody>
                    {handheldBenchmarks.map(
                      (benchmark) => (
                        <tr
                          key={benchmark.id}
                          className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5">
                            {benchmark.games ? (
                              <Link
                                href={`/games/${benchmark.games.slug}`}
                                className="font-semibold transition hover:text-cyan-400"
                              >
                                {benchmark.games.name}
                              </Link>
                            ) : (
                              "Unknown game"
                            )}
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.presets
                              ? `${benchmark.presets.preset_type} · ${benchmark.presets.name}`
                              : "Not linked"}
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.resolution ??
                              "Not set"}
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.tdp ??
                              "Not set"}
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-bold text-cyan-400">
                              {benchmark.average_fps !==
                              null
                                ? `${benchmark.average_fps} FPS`
                                : "Not set"}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.one_percent_low !==
                            null
                              ? `${benchmark.one_percent_low} FPS`
                              : "Not set"}
                          </td>

                          <td className="px-6 py-5 text-slate-300">
                            {benchmark.battery_life ??
                              "Not set"}
                          </td>
                        </tr>
                      ),
                    )}
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
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
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

interface PresetStatProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function PresetStat({
  label,
  value,
  highlighted = false,
}: PresetStatProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 font-black ${
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
    <th className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-500">
      {label}
    </th>
  );
}