import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PresetTrustBadge from "../../../components/PresetTrustBadge";
import JsonLd from "../../../components/JsonLd";
import { calculatePresetTrust } from "../../../lib/preset-trust";
import { absoluteUrl, siteConfig } from "../../../lib/site";
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
  atlas_verified: boolean;
  games: {
    name: string;
    slug: string;
  } | null;
  preset_setting_groups: DatabaseSettingGroup[];
  preset_votes: Array<{
    user_id: string;
  }>;
  preset_confirmations: Array<{
    user_id: string;
  }>;
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
      atlas_verified,
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
      ),
      preset_votes (
        user_id
      ),
      preset_confirmations (
        user_id
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
    alternates: {
      canonical: `/handhelds/${handheld.slug}`,
    },

    openGraph: {
      url: `/handhelds/${handheld.slug}`,
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
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "upcoming":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "discontinued":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

function getPresetStyle(
  type: DatabasePreset["preset_type"],
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

  const benchmarkScores =
    handheldBenchmarks
      .map(
        (benchmark) =>
          benchmark.average_fps,
      )
      .filter(
        (value): value is number =>
          value !== null,
      );

  const bestAverageFps =
    benchmarkScores.length > 0
      ? Math.max(...benchmarkScores)
      : null;

  const averageBenchmarkFps =
    benchmarkScores.length > 0
      ? Math.round(
          benchmarkScores.reduce(
            (total, value) =>
              total + value,
            0,
          ) /
            benchmarkScores.length,
        )
      : null;

  const handheldImage =
    handheld.image_url;
  const handheldUrl = absoluteUrl(`/handhelds/${handheld.slug}`);
  const additionalProperties = [
    ["Operating system", handheld.operating_system],
    ["Processor", handheld.processor],
    ["Memory", handheld.memory],
    ["Storage", handheld.storage],
    ["Display size", handheld.display_size],
    ["Resolution", handheld.resolution],
    ["Refresh rate", handheld.refresh_rate],
    ["Battery", handheld.battery],
    ["Weight", handheld.weight],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => ({
      "@type": "PropertyValue",
      name,
      value,
    }));
  const handheldJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${handheldUrl}#product`,
    name: handheld.name,
    url: handheldUrl,
    image: handheld.image_url ?? undefined,
    description:
      handheld.tagline ??
      `${handheld.name} specifications, presets and handheld gaming benchmarks.`,
    model: handheld.name,
    category: "Handheld gaming PC",
    brand: {
      "@type": "Brand",
      name: handheld.manufacturer,
    },
    manufacturer: {
      "@type": "Organization",
      name: handheld.manufacturer,
    },
    additionalProperty: additionalProperties,
    subjectOf: {
      "@type": "WebPage",
      "@id": handheldUrl,
      publisher: {
        "@id": `${siteConfig.url}/#organization`,
      },
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Handhelds",
        item: absoluteUrl("/handhelds"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: handheld.name,
        item: handheldUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[handheldJsonLd, breadcrumbJsonLd]} />
      <main className="atlas-page min-w-0 overflow-x-hidden pb-14 text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(24,215,255,0.14),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(239,35,60,0.13),transparent_26%),linear-gradient(135deg,#05070d,#090d16_55%,#120810)]" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/92 to-transparent" />

        <div className="atlas-shell relative grid min-h-0 items-center gap-7 py-9 sm:min-h-[35rem] sm:gap-10 sm:py-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Link
              href="/handhelds"
              className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 transition hover:text-white"
            >
              ← Back to handhelds
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
              <span
                className={`rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.15em] ${getDeviceStatusStyle(
                  handheld.device_status,
                )}`}
              >
                {handheld.device_status}
              </span>

              <span className="atlas-chip">
                {handheld.manufacturer}
              </span>
            </div>

            <h1 className="mt-4 break-words text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:mt-5 sm:text-6xl lg:text-7xl">
              {handheld.name}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:leading-8">
              {handheld.tagline ??
                "Detailed handheld specifications, presets and performance data."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link
                href="/presets"
                className="atlas-button-primary w-full sm:w-auto"
              >
                Browse presets
              </Link>

              <Link
                href="/compare"
                className="atlas-button-secondary w-full sm:w-auto"
              >
                Compare devices
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroMetric
                label="Presets"
                value={handheldPresets.length.toString()}
              />

              <HeroMetric
                label="Benchmarks"
                value={handheldBenchmarks.length.toString()}
              />

              <HeroMetric
                label="Best FPS"
                value={
                  bestAverageFps !== null
                    ? bestAverageFps.toString()
                    : "—"
                }
                highlighted
              />

              <HeroMetric
                label="Avg FPS"
                value={
                  averageBenchmarkFps !== null
                    ? averageBenchmarkFps.toString()
                    : "—"
                }
              />
            </div>
          </div>

          <div className="relative flex min-h-[15rem] items-center justify-center sm:min-h-[25rem]">
            <div className="absolute h-64 w-64 rounded-full bg-cyan-500/15 blur-[90px]" />

            <div className="absolute h-44 w-44 translate-x-24 translate-y-12 rounded-full bg-red-500/12 blur-[80px]" />

            {handheldImage ? (
              <div className="relative h-56 w-full max-w-3xl atlas-float sm:h-80 md:h-[26rem]">
                <Image
                  src={handheldImage}
                  alt={handheld.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-center drop-shadow-[0_40px_55px_rgba(0,0,0,0.8)]"
                />
              </div>
            ) : (
              <div className="atlas-panel-soft flex h-52 w-full max-w-2xl items-center justify-center sm:h-72">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">
                  Device image coming soon
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="atlas-shell relative pb-6 sm:pb-8">
          <div className="atlas-stat-strip grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <StripStat
              label="Operating system"
              value={
                handheld.operating_system ??
                "Not set"
              }
            />

            <StripStat
              label="Processor"
              value={
                handheld.processor ??
                "Not set"
              }
            />

            <StripStat
              label="Memory"
              value={
                handheld.memory ??
                "Not set"
              }
            />

            <StripStat
              label="Display"
              value={
                handheld.display_size ??
                "Not set"
              }
            />

            <StripStat
              label="Battery"
              value={
                handheld.battery ??
                "Not set"
              }
            />

            <StripStat
              label="Weight"
              value={
                handheld.weight ??
                "Not set"
              }
            />
          </div>
        </div>
      </section>

      <div className="atlas-shell min-w-0 pt-5 sm:pt-6">
        <section className="grid min-w-0 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="atlas-panel min-w-0 p-4 sm:p-5">
            <SectionHeader
              title="Technical specifications"
              eyebrow="Hardware"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SpecCard
                label="Operating system"
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
                highlighted
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
                label="Display size"
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
                label="Refresh rate"
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
          </div>

          <div className="atlas-panel min-w-0 p-4 sm:p-5">
            <SectionHeader
              title="Performance overview"
              eyebrow="Atlas data"
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <PerformanceCard
                label="Highest tested"
                value={
                  bestAverageFps !== null
                    ? `${bestAverageFps} FPS`
                    : "No data"
                }
                accent="red"
              />

              <PerformanceCard
                label="Average tested"
                value={
                  averageBenchmarkFps !== null
                    ? `${averageBenchmarkFps} FPS`
                    : "No data"
                }
                accent="cyan"
              />

              <PerformanceCard
                label="Published presets"
                value={handheldPresets.length.toString()}
              />

              <PerformanceCard
                label="Published benchmarks"
                value={handheldBenchmarks.length.toString()}
              />
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-600">
                Device profile
              </p>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                Performance data and presets shown below
                are loaded directly from the live
                HandheldAtlas database.
              </p>
            </div>
          </div>
        </section>

        <section className="atlas-panel mt-5 min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeader
              title="Recommended presets"
              eyebrow="Game settings"
              noBorder
            />

            <Link
              href="/presets"
              className="text-xs font-black text-cyan-400 transition hover:text-white"
            >
              View all presets →
            </Link>
          </div>

          {handheldPresets.length === 0 ? (
            <EmptyState text="No published presets available for this handheld." />
          ) : (
            <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
              {handheldPresets.map(
                (preset) => {
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

                  const trustReport =
                    calculatePresetTrust({
                      averageFps:
                        preset.fps_average,
                      onePercentLow:
                        preset.one_percent_low,
                      resolution:
                        preset.resolution,
                      tdp: preset.tdp,
                      upscaler:
                        preset.upscaler,
                      batteryLife:
                        preset.battery_life,
                      summary:
                        preset.summary,
                      communityRating:
                        preset.community_rating,
                      upvoteCount:
                        preset.preset_votes
                          ?.length ?? 0,
                      confirmationCount:
                        preset
                          .preset_confirmations
                          ?.length ?? 0,
                      atlasVerified:
                        preset.atlas_verified ??
                        false,
                      groups:
                        sortedGroups.map(
                          (group) => ({
                            items:
                              group.preset_setting_items,
                          }),
                        ),
                    });

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

                              <PresetTrustBadge
                                score={trustReport.score}
                                label={trustReport.label}
                                tone={trustReport.tone}
                                compact
                              />

                              <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-cyan-400">
                                {preset.games?.name ??
                                  "Unknown game"}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black">
                              {preset.name}
                            </h3>

                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {preset.summary ??
                                "Detailed recommended settings for this handheld."}
                            </p>

                            <p className="mt-3 text-[0.62rem] font-black uppercase tracking-[0.11em] text-slate-600">
                              Confidence {trustReport.score}/100 · {preset.preset_confirmations?.length ?? 0} confirmed
                            </p>
                          </div>

                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 text-lg font-black text-cyan-400 transition group-open:rotate-45">
                            +
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                            label="Average"
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
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[0.62rem] text-slate-600">
                          <span>
                            Upscaler:{" "}
                            <strong className="text-slate-300">
                              {preset.upscaler ??
                                "Not set"}
                            </strong>
                          </span>

                          <span>•</span>

                          <span>
                            Battery:{" "}
                            <strong className="text-slate-300">
                              {preset.battery_life ??
                                "Not set"}
                            </strong>
                          </span>

                          <span>•</span>

                          <span>
                            {settingsCount} settings
                          </span>
                        </div>
                      </summary>

                      <div className="border-t border-white/[0.07] bg-black/20 p-4">
                        {sortedGroups.length ===
                        0 ? (
                          <p className="text-sm text-slate-500">
                            No detailed settings
                            available.
                          </p>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {sortedGroups.map(
                              (group) => (
                                <section
                                  key={group.id}
                                  className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20"
                                >
                                  <div className="border-b border-white/[0.07] px-4 py-3">
                                    <h4 className="text-sm font-black">
                                      {group.name}
                                    </h4>
                                  </div>

                                  <dl>
                                    {group.preset_setting_items.map(
                                      (
                                        item,
                                        index,
                                      ) => (
                                        <div
                                          key={
                                            item.id
                                          }
                                          className={`grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-sm ${
                                            index ===
                                            group
                                              .preset_setting_items
                                              .length -
                                              1
                                              ? ""
                                              : "border-b border-white/[0.06]"
                                          }`}
                                        >
                                          <div>
                                            <dt className="font-bold text-slate-300">
                                              {
                                                item.label
                                              }
                                            </dt>

                                            {item.note && (
                                              <p className="mt-1 text-xs text-slate-600">
                                                {
                                                  item.note
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <dd className="font-black text-cyan-400">
                                            {
                                              item.value
                                            }
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
                            className="atlas-button-secondary mt-4"
                          >
                            Open game profile
                          </Link>
                        )}
                      </div>
                    </details>
                  );
                },
              )}
            </div>
          )}
        </section>

        <section className="atlas-panel mt-5 min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeader
              title="Benchmark wall"
              eyebrow="Performance data"
              noBorder
            />

            <Link
              href="/benchmarks"
              className="text-xs font-black text-cyan-400 transition hover:text-white"
            >
              View all benchmarks →
            </Link>
          </div>

          {handheldBenchmarks.length === 0 ? (
            <EmptyState text="No published benchmarks available for this handheld." />
          ) : (
            <div className="mt-5 max-w-full overflow-hidden rounded-xl border border-white/[0.07]">
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-[48rem] text-left md:min-w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <TableHeading label="Game" />
                      <TableHeading label="Preset" />
                      <TableHeading label="Resolution" />
                      <TableHeading label="TDP" />
                      <TableHeading label="Average" />
                      <TableHeading label="1% Low" />
                      <TableHeading label="Battery" />
                    </tr>
                  </thead>

                  <tbody>
                    {handheldBenchmarks.map(
                      (benchmark) => (
                        <tr
                          key={benchmark.id}
                          className="border-t border-white/[0.06] transition hover:bg-white/[0.025]"
                        >
                          <td className="px-4 py-4">
                            {benchmark.games ? (
                              <Link
                                href={`/games/${benchmark.games.slug}`}
                                className="font-black text-slate-200 transition hover:text-cyan-400"
                              >
                                {benchmark.games.name}
                              </Link>
                            ) : (
                              <span className="text-slate-500">
                                Unknown game
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-400">
                            {benchmark.presets
                              ? `${benchmark.presets.preset_type} · ${benchmark.presets.name}`
                              : "Custom"}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-400">
                            {benchmark.resolution ??
                              "Not set"}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-400">
                            {benchmark.tdp ??
                              "Not set"}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-1.5 font-black text-red-400">
                              {benchmark.average_fps !==
                              null
                                ? `${benchmark.average_fps} FPS`
                                : "—"}
                            </span>
                          </td>

                          <td className="px-4 py-4 font-black text-slate-300">
                            {benchmark.one_percent_low !==
                            null
                              ? `${benchmark.one_percent_low} FPS`
                              : "—"}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-400">
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
    </>
  );
}

function HeroMetric({
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
      className={`rounded-xl border p-3 ${
        highlighted
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black ${
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

function StripStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 px-4 py-4">
      <p className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-slate-200">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  eyebrow,
  noBorder = false,
}: {
  title: string;
  eyebrow: string;
  noBorder?: boolean;
}) {
  return (
    <div
      className={
        noBorder
          ? ""
          : "border-b border-white/[0.07] pb-3"
      }
    >
      <p className="atlas-section-label">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-black">
        {title}
      </h2>
    </div>
  );
}

function SpecCard({
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
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-cyan-500/25 bg-cyan-500/[0.06]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-black leading-6 ${
          highlighted
            ? "text-cyan-400"
            : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function PerformanceCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "red" | "cyan";
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        accent === "red"
          ? "border-red-500/25 bg-red-500/[0.06]"
          : accent === "cyan"
            ? "border-cyan-500/25 bg-cyan-500/[0.06]"
            : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          accent === "red"
            ? "text-red-400"
            : accent === "cyan"
              ? "text-cyan-400"
              : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
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
        className={`mt-1 text-xs font-black ${
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

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function TableHeading({
  label,
}: {
  label: string;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-600">
      {label}
    </th>
  );
}