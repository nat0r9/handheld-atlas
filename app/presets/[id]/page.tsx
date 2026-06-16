import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import JsonLd from "../../../components/JsonLd";
import PresetDetailConfirmation from "../../../components/PresetDetailConfirmation";
import PresetDetailVote from "../../../components/PresetDetailVote";
import PresetTrustBadge from "../../../components/PresetTrustBadge";
import {
  buildSettingImpactLookup,
  findSettingImpact,
  getImpactLabel,
  type GameSettingImpact,
  type SettingImpactEntry,
} from "../../../lib/settings-impact";
import { calculatePresetTrust } from "../../../lib/preset-trust";
import { createClient } from "../../../lib/supabase/server";
import { absoluteUrl, siteConfig } from "../../../lib/site";
import {
  getPresetProfileGuide,
  parseSettingNote,
} from "../../../lib/preset-guidance";

export const dynamic = "force-dynamic";

type PresetType =
  | "Performance"
  | "Balanced"
  | "Battery"
  | "Docked"
  | "Custom";

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
  preset_type: PresetType;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  upscaler: string | null;
  battery_life: string | null;
  community_rating: number | null;
  summary: string | null;
  published_at: string | null;
  atlas_verified: boolean;
  verified_at: string | null;
  games: {
    id: string;
    name: string;
    slug: string;
  } | null;
  handhelds: {
    id: string;
    name: string;
    slug: string;
    manufacturer: string;
  } | null;
  preset_setting_groups: DatabaseSettingGroup[];
  preset_votes: Array<{ user_id: string }>;
  preset_confirmations: Array<{ user_id: string }>;
}

interface PresetPageProps {
  params: Promise<{ id: string }>;
}

interface MetadataPreset {
  name: string;
  summary: string | null;
  preset_type: PresetType;
  games: { name: string } | null;
  handhelds: { name: string } | null;
}

export async function generateMetadata({
  params,
}: PresetPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("presets")
    .select(`
      name,
      summary,
      preset_type,
      games (name),
      handhelds (name)
    `)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    return {
      title: "Preset Not Found",
      description: "The requested HandheldAtlas preset is not available.",
    };
  }

  const preset = data as unknown as MetadataPreset;
  const description =
    preset.summary ??
    `${preset.preset_type} settings for ${preset.games?.name ?? "a handheld game"} on ${preset.handhelds?.name ?? "a handheld PC"}.`;

  return {
    title: `${preset.name} | Handheld Preset`,
    description,
    alternates: { canonical: `/presets/${id}` },
    openGraph: {
      title: `${preset.name} | HandheldAtlas`,
      description,
      type: "article",
      url: `/presets/${id}`,
    },
    twitter: {
      card: "summary",
      title: `${preset.name} | HandheldAtlas`,
      description,
    },
  };
}

function getPresetStyle(type: PresetType) {
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

function formatDate(value: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s]+)/gi);

  return parts.map((part, index) => {
    const isUrl = /^(?:https?:\/\/|www\.)/i.test(part);
    if (!isUrl) return <Fragment key={index}>{part}</Fragment>;

    const trailingMatch = part.match(/^(.*?)([),.;!?]*)$/);
    const cleanUrl = trailingMatch?.[1] ?? part;
    const trailingText = trailingMatch?.[2] ?? "";
    const href = cleanUrl.startsWith("www.") ? `https://${cleanUrl}` : cleanUrl;

    return (
      <Fragment key={index}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="break-all font-bold text-cyan-400 underline decoration-cyan-500/35 underline-offset-4 transition hover:text-white"
        >
          {cleanUrl}
        </a>
        {trailingText}
      </Fragment>
    );
  });
}

function selectGameEvidence(
  entry: SettingImpactEntry,
  gameId: string | null,
  handheldId: string | null,
) {
  if (!gameId) return null;
  const evidence = entry.game_setting_impacts ?? [];

  return (
    evidence.find(
      (item) =>
        item.game_id === gameId &&
        item.handheld_id !== null &&
        item.handheld_id === handheldId,
    ) ??
    evidence.find(
      (item) => item.game_id === gameId && item.handheld_id === null,
    ) ??
    null
  );
}

export default async function PresetDetailPage({
  params,
}: PresetPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [presetResult, guidesResult] = await Promise.all([
    supabase
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
        published_at,
        atlas_verified,
        verified_at,
        games (id, name, slug),
        handhelds (id, name, slug, manufacturer),
        preset_setting_groups (
          id,
          name,
          sort_order,
          preset_setting_items (id, label, value, note, sort_order)
        ),
        preset_votes (user_id),
        preset_confirmations (user_id)
      `)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("setting_impact_entries")
      .select(`
        id,
        slug,
        name,
        category,
        commonness,
        summary,
        description,
        performance_impact,
        visual_impact,
        vram_impact,
        cpu_impact,
        latency_impact,
        restart_required,
        when_to_lower,
        when_to_keep_high,
        handheld_advice,
        caveat,
        confidence,
        atlas_verified,
        status,
        updated_at,
        setting_impact_aliases (alias, normalized_alias),
        game_setting_impacts (
          id,
          game_id,
          handheld_id,
          recommended_value,
          performance_change,
          visual_note,
          resolution,
          tdp,
          test_note,
          source_url,
          confidence,
          atlas_verified
        )
      `)
      .eq("status", "published")
      .order("name"),
  ]);

  if (presetResult.error || !presetResult.data) {
    notFound();
  }

  const preset = presetResult.data as unknown as DatabasePreset;
  const settingGuides = guidesResult.error
    ? []
    : ((guidesResult.data ?? []) as unknown as SettingImpactEntry[]);
  const impactLookup = buildSettingImpactLookup(settingGuides);

  const groups = [...(preset.preset_setting_groups ?? [])]
    .sort((first, second) => first.sort_order - second.sort_order)
    .map((group) => ({
      id: group.id,
      name: group.name,
      items: [...(group.preset_setting_items ?? [])]
        .sort((first, second) => first.sort_order - second.sort_order)
        .map((item) => {
          const guide = findSettingImpact(item.label, impactLookup);
          return {
            ...item,
            parsedNote: parseSettingNote(item.note),
            guide,
            gameEvidence: guide
              ? selectGameEvidence(
                  guide,
                  preset.games?.id ?? null,
                  preset.handhelds?.id ?? null,
                )
              : null,
          };
        }),
    }));

  const settingsCount = groups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const explainedCount = groups.reduce(
    (total, group) =>
      total +
      group.items.filter((item) => {
        const note = item.parsedNote;
        return Boolean(
          note.defaultValue ||
            note.problem ||
            note.why ||
            note.description ||
            note.performanceImpact ||
            note.visualImpact ||
            item.guide,
        );
      }).length,
    0,
  );
  const linkedGuideCount = groups.reduce(
    (total, group) => total + group.items.filter((item) => item.guide).length,
    0,
  );

  const upvoteCount = preset.preset_votes?.length ?? 0;
  const hasUpvoted =
    user !== null &&
    (preset.preset_votes ?? []).some((vote) => vote.user_id === user.id);
  const confirmationCount = preset.preset_confirmations?.length ?? 0;
  const hasConfirmed =
    user !== null &&
    (preset.preset_confirmations ?? []).some(
      (confirmation) => confirmation.user_id === user.id,
    );

  const summaryText = preset.summary ?? "Tested handheld performance configuration.";
  const profileGuide = getPresetProfileGuide(preset.preset_type);
  const atlasVerified = preset.atlas_verified ?? false;
  const trustReport = calculatePresetTrust({
    averageFps: preset.fps_average,
    onePercentLow: preset.one_percent_low,
    resolution: preset.resolution,
    tdp: preset.tdp,
    upscaler: preset.upscaler,
    batteryLife: preset.battery_life,
    summary: preset.summary,
    communityRating: preset.community_rating,
    upvoteCount,
    confirmationCount,
    atlasVerified,
    groups,
  });

  const presetUrl = absoluteUrl(`/presets/${preset.id}`);
  const presetJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${presetUrl}#preset`,
    headline: preset.name,
    description: summaryText,
    url: presetUrl,
    mainEntityOfPage: presetUrl,
    datePublished: preset.published_at ?? undefined,
    author: { "@id": `${siteConfig.url}/#organization` },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    about: [
      preset.games
        ? {
            "@type": "VideoGame",
            name: preset.games.name,
            url: absoluteUrl(`/games/${preset.games.slug}`),
          }
        : null,
      preset.handhelds
        ? {
            "@type": "Product",
            name: preset.handhelds.name,
            brand: { "@type": "Brand", name: preset.handhelds.manufacturer },
            url: absoluteUrl(`/handhelds/${preset.handhelds.slug}`),
          }
        : null,
    ].filter(Boolean),
    additionalProperty: [
      ["Profile", preset.preset_type],
      ["Resolution", preset.resolution],
      ["TDP", preset.tdp],
      ["Average FPS", preset.fps_average !== null ? `${preset.fps_average} FPS` : null],
      ["1% Low", preset.one_percent_low !== null ? `${preset.one_percent_low} FPS` : null],
      ["Upscaler", preset.upscaler],
      ["Atlas Confidence", `${trustReport.score}/100`],
    ]
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Presets",
        item: absoluteUrl("/presets"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: preset.name,
        item: presetUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[presetJsonLd, breadcrumbJsonLd]} />
      <main className="atlas-page min-w-0 overflow-x-hidden pb-16 text-white">
        <section className="border-b border-white/[0.06]">
          <div className="atlas-shell py-7 sm:py-10">
            <Link
              href="/presets"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500 transition hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back to preset library
            </Link>

            <div className="mt-6 grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.1em] ${getPresetStyle(preset.preset_type)}`}
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
                    {preset.games?.name ?? "Unknown game"}
                  </span>
                  <span className="text-[0.62rem] text-slate-600">
                    {formatDate(preset.published_at)}
                  </span>
                </div>

                <h1 className="mt-4 max-w-5xl break-words text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                  {preset.name}
                </h1>
                <p className="mt-3 text-base font-bold text-slate-400 sm:text-lg">
                  {preset.handhelds?.manufacturer ?? "Unknown manufacturer"}
                  {" · "}
                  {preset.handhelds?.name ?? "Unknown handheld"}
                </p>
                <p className="mt-5 max-w-5xl whitespace-pre-line break-words text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                  {renderTextWithLinks(summaryText)}
                </p>
              </div>

              <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] p-4 text-center">
                  <p className="text-[0.54rem] font-black uppercase tracking-[0.14em] text-cyan-500">
                    Atlas confidence
                  </p>
                  <p className="mt-2 text-4xl font-black text-white">
                    {trustReport.score}
                    <span className="text-base text-slate-600">/100</span>
                  </p>
                  <p className="mt-1 text-sm font-black text-cyan-300">
                    {trustReport.label}
                  </p>
                </div>

                <PresetDetailVote
                  presetId={preset.id}
                  initialCount={upvoteCount}
                  initialHasUpvoted={hasUpvoted}
                />
                <PresetDetailConfirmation
                  presetId={preset.id}
                  initialCount={confirmationCount}
                  initialHasConfirmed={hasConfirmed}
                />

                <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
                  {preset.games && (
                    <Link href={`/games/${preset.games.slug}`} className="atlas-button-secondary text-center">
                      Open game
                    </Link>
                  )}
                  {preset.handhelds && (
                    <Link href={`/handhelds/${preset.handhelds.slug}`} className="atlas-button-secondary text-center">
                      Open handheld
                    </Link>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="atlas-shell min-w-0 pt-5 sm:pt-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PresetStat label="Resolution" value={preset.resolution ?? "Not set"} />
            <PresetStat label="TDP" value={preset.tdp ?? "Not set"} />
            <PresetStat
              label="Average FPS"
              value={preset.fps_average !== null ? `${preset.fps_average} FPS` : "Not set"}
              highlighted
            />
            <PresetStat
              label="1% Low"
              value={preset.one_percent_low !== null ? `${preset.one_percent_low} FPS` : "Not set"}
            />
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetaPanel label="Upscaler" value={preset.upscaler ?? "Not set"} />
            <MetaPanel label="Battery" value={preset.battery_life ?? "Not set"} />
            <MetaPanel label="Profile goal" value={profileGuide.shortLabel} />
            <MetaPanel label="Settings" value={`${settingsCount} values`} />
          </section>

          <section className="atlas-panel mt-5 p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="atlas-section-label">Before you copy anything</p>
                <h2 className="mt-2 text-2xl font-black">Match the test target</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  This profile is built for <strong className="text-white">{profileGuide.bestFor}</strong>. {profileGuide.goal}
                </p>
                <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-4">
                  <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-orange-400">Expected trade-off</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{profileGuide.tradeoff}</p>
                </div>
              </div>

              <ol className="grid gap-3 sm:grid-cols-3">
                <ApplyStep
                  number="01"
                  title="Match device"
                  text={preset.handhelds?.name ?? "Use the listed handheld."}
                />
                <ApplyStep
                  number="02"
                  title="Match power"
                  text={`${preset.tdp ?? "Use the listed TDP"} at ${preset.resolution ?? "the listed resolution"}.`}
                />
                <ApplyStep
                  number="03"
                  title="Copy, then test"
                  text="Apply all values first. Tune further only after the same demanding area stays stable."
                />
              </ol>
            </div>
          </section>

          <section className="mt-8 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <p className="atlas-section-label">Use this preset</p>
                <h2 className="mt-2 text-3xl font-black">Settings to copy</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  The exact value is always visible. Explanations stay tucked underneath, so a first-time visitor can copy the preset without reading a bloody thesis.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                  {groups.length} {groups.length === 1 ? "group" : "groups"} · {settingsCount} settings
                </p>
                <Link href="/settings-impact" className="mt-2 inline-flex text-sm font-black text-cyan-400 transition hover:text-white">
                  Open full Settings Guide →
                </Link>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="atlas-panel mt-5 border-dashed p-10 text-center text-sm text-slate-500">
                No detailed settings are available for this preset yet.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {groups.map((group, groupIndex) => (
                  <details
                    key={group.id}
                    open={groupIndex === 0}
                    className="group min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 open:border-cyan-500/25 open:bg-cyan-500/[0.025]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 transition hover:bg-white/[0.025] sm:px-5">
                      <div>
                        <h3 className="text-base font-black text-white sm:text-lg">{group.name}</h3>
                        <p className="mt-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-slate-600">
                          {group.items.length} {group.items.length === 1 ? "setting" : "settings"}
                        </p>
                      </div>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-black/30 text-lg font-black text-cyan-400 transition group-open:rotate-45">+</span>
                    </summary>

                    <dl className="border-t border-white/[0.07]">
                      {group.items.map((item, itemIndex) => {
                        const note = item.parsedNote;
                        const hasKnowHow = Boolean(
                          note.defaultValue ||
                            note.problem ||
                            note.why ||
                            note.description ||
                            note.performanceImpact ||
                            note.visualImpact ||
                            note.restart ||
                            item.guide ||
                            item.gameEvidence,
                        );

                        return (
                          <div
                            key={item.id}
                            className={`grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,32%)] sm:gap-6 sm:px-5 ${
                              itemIndex === group.items.length - 1 ? "" : "border-b border-white/[0.06]"
                            }`}
                          >
                            <div className="min-w-0">
                              <dt className="break-words text-sm font-bold text-slate-200">{item.label}</dt>

                              {item.guide && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <ImpactPill label="FPS" value={item.guide.performance_impact} />
                                  <ImpactPill label="Visual" value={item.guide.visual_impact} />
                                  <ImpactPill label="VRAM" value={item.guide.vram_impact} />
                                  <Link
                                    href={`/settings-impact/${item.guide.slug}`}
                                    className="ml-1 text-[0.62rem] font-black text-cyan-400 transition hover:text-white"
                                  >
                                    Learn what it does →
                                  </Link>
                                </div>
                              )}

                              {hasKnowHow && (
                                <details className="mt-3 rounded-lg border border-white/[0.06] bg-black/20">
                                  <summary className="cursor-pointer px-3 py-2 text-xs font-black text-slate-400 transition hover:text-white">
                                    Why this value?
                                  </summary>
                                  <div className="space-y-3 border-t border-white/[0.06] px-3 py-3 text-xs leading-5 text-slate-400">
                                    {note.defaultValue && (
                                      <p><strong className="text-white">Game default:</strong> {note.defaultValue} → <strong className="text-cyan-300">{item.value}</strong></p>
                                    )}
                                    {note.problem && (
                                      <p><strong className="text-red-300">Problem:</strong> {note.problem}</p>
                                    )}
                                    {(note.why || note.description) && (
                                      <p><strong className="text-white">Reason:</strong> {renderTextWithLinks(note.why ?? note.description ?? "")}</p>
                                    )}
                                    {item.gameEvidence && (
                                      <EvidenceNote evidence={item.gameEvidence} />
                                    )}
                                    {!item.gameEvidence && item.guide && (
                                      <p><strong className="text-white">General guidance:</strong> {item.guide.summary}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      {note.performanceImpact && <NoteBadge label="Performance" value={note.performanceImpact} />}
                                      {note.visualImpact && <NoteBadge label="Visual" value={note.visualImpact} />}
                                      {note.restart && <NoteBadge label="Restart" value={note.restart} />}
                                    </div>
                                  </div>
                                </details>
                              )}
                            </div>

                            <dd className="min-w-0 whitespace-pre-line break-words text-left text-sm font-black leading-5 text-cyan-400 sm:text-right">
                              {renderTextWithLinks(item.value)}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </details>
                ))}
              </div>
            )}
          </section>

          <details className="atlas-panel mt-8 overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
              <div>
                <p className="atlas-section-label">Trust & evidence</p>
                <h2 className="mt-2 text-2xl font-black">Why this preset scored {trustReport.score}/100</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Optional proof for people who want to inspect the data instead of just copying the values.
                </p>
              </div>
              <span className="text-2xl font-black text-cyan-400">+</span>
            </summary>

            <div className="border-t border-white/[0.07] p-5 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-sm leading-6 text-slate-400">{trustReport.summary}</p>
                  <div className="mt-5 space-y-4">
                    {trustReport.components.map((component) => {
                      const width = Math.round((component.score / component.maximum) * 100);
                      return (
                        <div key={component.key}>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <p className="font-black text-slate-300">{component.label}</p>
                            <p className="font-black text-slate-500">{component.score}/{component.maximum}</p>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="h-full rounded-full bg-cyan-400" style={{ width: `${width}%` }} />
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-600">{component.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ProofMetric label="Worked for me" value={confirmationCount.toString()} detail="Matching setup confirmations" highlighted />
                  <ProofMetric label="Upvotes" value={upvoteCount.toString()} detail="Found useful" />
                  <ProofMetric label="Rating" value={preset.community_rating !== null ? preset.community_rating.toFixed(1) : "—"} detail="Community score" />
                  <ProofMetric label="Editorial" value={atlasVerified ? "Yes" : "No"} detail={atlasVerified ? "Atlas Verified" : "Awaiting review"} />
                  <ProofMetric label="Explained" value={`${explainedCount}/${settingsCount}`} detail="Settings with know-how" />
                  <ProofMetric label="Guide linked" value={`${linkedGuideCount}/${settingsCount}`} detail="Knowledge-base matches" />
                </div>
              </div>
            </div>
          </details>

          <section className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-xs leading-6 text-slate-600">
            Results can change with game patches, drivers, silicon variance, background tasks and the tested scene. “Worked for me” should only be used when the listed handheld, TDP and resolution match.
          </section>
        </div>
      </main>
    </>
  );
}

function EvidenceNote({ evidence }: { evidence: GameSettingImpact }) {
  return (
    <div className="rounded-lg border border-green-500/20 bg-green-500/[0.05] p-3">
      <p className="font-black text-green-300">Game-specific evidence</p>
      {evidence.recommended_value && <p className="mt-1">Recommended: {evidence.recommended_value}</p>}
      {evidence.performance_change && <p className="mt-1">Measured change: {evidence.performance_change}</p>}
      {evidence.visual_note && <p className="mt-1">Visual note: {evidence.visual_note}</p>}
      {evidence.test_note && <p className="mt-1">{evidence.test_note}</p>}
    </div>
  );
}

function ImpactPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-black/25 px-2 py-1 text-[0.52rem] font-bold text-slate-500">
      <strong className="text-slate-300">{label}:</strong> {getImpactLabel(value)}
    </span>
  );
}

function NoteBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-black/25 px-2 py-1 text-[0.5rem] font-bold text-slate-500">
      <strong className="text-slate-400">{label}:</strong> {value}
    </span>
  );
}

function ApplyStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <p className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-red-400">{number}</p>
      <h3 className="mt-2 text-sm font-black text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
    </li>
  );
}

function ProofMetric({ label, value, detail, highlighted = false }: { label: string; value: string; detail: string; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlighted ? "border-green-500/25 bg-green-500/[0.06]" : "border-white/[0.07] bg-black/20"}`}>
      <p className="text-[0.48rem] font-black uppercase tracking-[0.12em] text-slate-600">{label}</p>
      <p className={`mt-2 text-2xl font-black ${highlighted ? "text-green-300" : "text-white"}`}>{value}</p>
      <p className="mt-1 text-[0.62rem] leading-4 text-slate-600">{detail}</p>
    </div>
  );
}

function PresetStat({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlighted ? "border-red-500/25 bg-red-500/[0.07]" : "border-white/[0.07] bg-black/20"}`}>
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">{label}</p>
      <p className={`mt-2 break-words text-lg font-black sm:text-xl ${highlighted ? "text-red-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function MetaPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
      <p className="text-[0.48rem] font-black uppercase tracking-[0.12em] text-slate-600">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-slate-300">{value}</p>
    </div>
  );
}
