import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImpactMeter from "../../../components/ImpactMeter";
import JsonLd from "../../../components/JsonLd";
import type { SettingImpactEntry } from "../../../lib/settings-impact";
import { absoluteUrl } from "../../../lib/site";
import { createClient } from "../../../lib/supabase/server";

export const revalidate = 3600;

interface SettingsImpactDetailProps {
  params: Promise<{ slug: string }>;
}

async function loadEntry(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
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
      setting_impact_aliases (
        alias,
        normalized_alias
      ),
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
        atlas_verified,
        games (
          name,
          slug
        ),
        handhelds (
          name,
          slug
        )
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data as unknown as SettingImpactEntry | null;
}

export async function generateMetadata({
  params,
}: SettingsImpactDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await loadEntry(slug);

  if (!entry) {
    return {
      title: "Setting Guide Not Found",
      description: "The requested graphics setting guide is not available.",
    };
  }

  return {
    title: `${entry.name} Impact Guide`,
    description: entry.summary,
    alternates: {
      canonical: `/settings-impact/${entry.slug}`,
    },
    openGraph: {
      title: `${entry.name} Impact Guide | HandheldAtlas`,
      description: entry.summary,
      type: "article",
      url: `/settings-impact/${entry.slug}`,
    },
  };
}

export default async function SettingsImpactDetailPage({
  params,
}: SettingsImpactDetailProps) {
  const { slug } = await params;
  const entry = await loadEntry(slug);

  if (!entry) {
    notFound();
  }

  const evidence = [...(entry.game_setting_impacts ?? [])].sort((first, second) => {
    const firstVerified = first.atlas_verified ? 1 : 0;
    const secondVerified = second.atlas_verified ? 1 : 0;
    return secondVerified - firstVerified;
  });
  const entryUrl = absoluteUrl(`/settings-impact/${entry.slug}`);
  const aliases = (entry.setting_impact_aliases ?? [])
    .map((alias) => alias.alias)
    .filter((alias) => alias.toLowerCase() !== entry.name.toLowerCase());

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${entry.name} graphics setting impact`,
    description: entry.summary,
    url: entryUrl,
    mainEntityOfPage: entryUrl,
    dateModified: entry.updated_at ?? undefined,
    about: {
      "@type": "Thing",
      name: entry.name,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Settings Guide",
        item: absoluteUrl("/settings-impact"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: entry.name,
        item: entryUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <main className="atlas-page pb-16 text-white">
        <section className="border-b border-white/[0.06]">
          <div className="atlas-shell py-8 sm:py-12">
            <Link href="/settings-impact" className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 transition hover:text-white">
              ← Back to Settings Guide
            </Link>

            <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/[0.07] px-2.5 py-1 text-[0.55rem] font-black uppercase tracking-[0.1em] text-cyan-300">
                    {entry.category}
                  </span>
                  <span className="rounded-full border border-white/[0.09] bg-white/[0.035] px-2.5 py-1 text-[0.55rem] font-black uppercase tracking-[0.1em] text-slate-400">
                    {entry.commonness === "specialized"
                      ? "Specialized"
                      : entry.commonness === "advanced"
                        ? "Advanced"
                        : "Common"}
                  </span>
                  {entry.atlas_verified && (
                    <span className="rounded-full border border-green-500/25 bg-green-500/[0.07] px-2.5 py-1 text-[0.55rem] font-black uppercase tracking-[0.1em] text-green-300">
                      Atlas reviewed
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                  {entry.name}
                </h1>
                <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300 sm:text-lg">
                  {entry.summary}
                </p>
              </div>

              <aside className="atlas-panel p-5">
                <p className="atlas-section-label">Quick verdict</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {entry.performance_impact >= 4 && entry.visual_impact <= 3
                    ? "A strong first candidate when you need more FPS."
                    : entry.vram_impact >= 4
                      ? "Keep an eye on this when VRAM is tight or textures stutter."
                      : entry.visual_impact >= 4 && entry.performance_impact <= 2
                        ? "Usually worth keeping high because it buys image quality cheaply."
                        : "Tune this after the biggest performance settings are already under control."}
                </p>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Confidence: {entry.confidence}/5. Editorial estimate — not measured for a specific game. A matching game-specific test takes priority.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <div className="atlas-shell pt-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ImpactMeter label="FPS" value={entry.performance_impact} metric="performance" />
            <ImpactMeter label="Visual" value={entry.visual_impact} metric="visual" />
            <ImpactMeter label="VRAM" value={entry.vram_impact} metric="vram" />
            <ImpactMeter label="CPU" value={entry.cpu_impact} metric="cpu" />
            <ImpactMeter label="Latency" value={entry.latency_impact} metric="latency" />
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className="atlas-panel p-5 sm:p-6">
              <p className="atlas-section-label">What it does</p>
              <h2 className="mt-2 text-2xl font-black">The plain-English version</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-400">
                {entry.description ?? entry.summary}
              </p>
              {aliases.length > 0 && (
                <p className="mt-5 text-xs leading-5 text-slate-600">
                  Games may also call it: <strong className="text-slate-400">{aliases.join(", ")}</strong>
                </p>
              )}
            </article>

            <article className="atlas-panel p-5 sm:p-6">
              <p className="atlas-section-label">Decision guide</p>
              <h2 className="mt-2 text-2xl font-black">Should you lower it?</h2>
              <div className="mt-4 space-y-3">
                <DecisionRow label="Lower it when" text={entry.when_to_lower ?? "You have already matched the preset target and this option is one of the heavier remaining costs."} tone="red" />
                <DecisionRow label="Keep it high when" text={entry.when_to_keep_high ?? "Performance is already stable and the visual improvement matters more than a small FPS gain."} tone="green" />
              </div>
            </article>
          </section>

          <section className="atlas-panel mt-4 p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <div>
                <p className="atlas-section-label">Handheld advice</p>
                <h2 className="mt-2 text-2xl font-black">Tune for a small power budget</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-400">
                  {entry.handheld_advice ?? "Use the setting as part of a complete preset. Handheld results depend on resolution, TDP, upscaling and whether the game is limited by the CPU or GPU."}
                </p>
              </div>

              <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-4">
                <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-orange-400">Restart</p>
                <p className="mt-2 text-sm font-black text-white">
                  {entry.restart_required ? "May be required" : "Usually not required"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Some games still apply changes only after reloading a scene or restarting.
                </p>
              </div>
            </div>
          </section>

          {evidence.length > 0 && (
            <section className="mt-8">
              <div className="border-b border-white/[0.07] pb-4">
                <p className="atlas-section-label">Game-specific evidence</p>
                <h2 className="mt-2 text-3xl font-black">Measured context beats generic advice</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  These notes apply only to the listed game, device and test target. They override the general guidance when the setup matches.
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {evidence.map((item) => (
                  <article key={item.id} className="atlas-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-cyan-500">
                          {item.handhelds?.name ?? "General handheld test"}
                        </p>
                        <h3 className="mt-2 text-xl font-black">
                          {item.games?.name ?? "Game-specific result"}
                        </h3>
                      </div>
                      {item.atlas_verified && (
                        <span className="rounded-full border border-green-500/25 bg-green-500/[0.07] px-2.5 py-1 text-[0.52rem] font-black uppercase tracking-[0.1em] text-green-300">
                          Verified
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <EvidenceValue label="Recommended" value={item.recommended_value ?? "Not specified"} />
                      <EvidenceValue label="Performance" value={item.performance_change ?? "Not measured"} highlighted />
                      <EvidenceValue label="Resolution" value={item.resolution ?? "Not specified"} />
                      <EvidenceValue label="TDP" value={item.tdp ?? "Not specified"} />
                    </div>

                    {(item.visual_note || item.test_note) && (
                      <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm leading-6 text-slate-400">
                        {item.visual_note && <p><strong className="text-white">Visual note:</strong> {item.visual_note}</p>}
                        {item.test_note && <p className={item.visual_note ? "mt-2" : ""}>{item.test_note}</p>}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {item.games && (
                        <Link href={`/games/${item.games.slug}`} className="text-sm font-black text-cyan-400 transition hover:text-white">
                          Open game →
                        </Link>
                      )}
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noreferrer noopener" className="text-sm font-black text-slate-400 transition hover:text-white">
                          View source ↗
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="atlas-panel mt-8 border-dashed p-5 sm:p-6">
            <p className="atlas-section-label">Do not overread the meter</p>
            <h2 className="mt-2 text-2xl font-black">The engine still gets the final word</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
              {entry.caveat ?? "The impact can shift with patches, engines, ray tracing, upscaling and the current bottleneck. Treat this page as a tuning map, not a magical guarantee carved into silicon."}
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

function DecisionRow({ label, text, tone }: { label: string; text: string; tone: "red" | "green" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "red" ? "border-red-500/20 bg-red-500/[0.05]" : "border-green-500/20 bg-green-500/[0.05]"}`}>
      <p className={`text-[0.52rem] font-black uppercase tracking-[0.12em] ${tone === "red" ? "text-red-400" : "text-green-400"}`}>{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function EvidenceValue({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlighted ? "border-cyan-500/20 bg-cyan-500/[0.06]" : "border-white/[0.07] bg-black/20"}`}>
      <p className="text-[0.48rem] font-black uppercase tracking-[0.12em] text-slate-600">{label}</p>
      <p className={`mt-2 break-words text-sm font-black ${highlighted ? "text-cyan-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
