import Link from "next/link";
import SettingsImpactCatalog from "../../components/SettingsImpactCatalog";
import type { SettingImpactEntry } from "../../lib/settings-impact";
import { createClient } from "../../lib/supabase/server";

export const revalidate = 3600;

export default async function SettingsImpactPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
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
      )
    `)
    .eq("status", "published")
    .order("name", { ascending: true });

  const entries = (data ?? []) as unknown as SettingImpactEntry[];

  return (
    <main className="atlas-page pb-16 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <p className="atlas-section-label">Settings knowledge base</p>
              <h1 className="mt-3 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                Know what to lower before you murder the whole image.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
                A plain-English guide to FPS cost, visual trade-offs and VRAM pressure. Start with common options, then reveal advanced and specialized settings only when you need them.
              </p>
            </div>

            <aside className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.055] p-5">
              <p className="text-sm font-black text-cyan-300">Start simple</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Copy a preset first. Come back here only when you want more FPS, fewer stutters or a better-looking image.
              </p>
              <Link href="/presets" className="mt-4 inline-flex text-sm font-black text-white transition hover:text-cyan-300">
                Browse ready-made presets →
              </Link>
            </aside>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <GuideLegend label="FPS impact" text="How much performance may improve when the option is lowered." />
            <GuideLegend label="Visual impact" text="How noticeable the quality loss may be when it is lowered." />
            <GuideLegend label="VRAM impact" text="How strongly it can affect video-memory use and texture stutter." />
          </div>

          <p className="mt-5 max-w-4xl text-xs leading-5 text-slate-600">
            The catalog currently contains {entries.length} canonical setting guides. Alternate menu names map to those guides instead of creating duplicate pages.
          </p>
        </div>
      </section>

      <div className="atlas-shell">
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-5 text-red-200">
            <p className="font-black">The settings guide could not be loaded.</p>
            <p className="mt-2 break-words text-sm text-red-200/70">{error.message}</p>
          </div>
        )}

        <SettingsImpactCatalog entries={entries} />

        <section className="atlas-panel mt-8 p-5 sm:p-6">
          <p className="atlas-section-label">Important caveat</p>
          <h2 className="mt-2 text-2xl font-black">General guidance, not fake universal math</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
            The same setting can behave differently across engines, patches, handhelds and bottlenecks. General scores are HandheldAtlas editorial estimates informed by official engine and GPU-vendor documentation; they are not measured game results. Game-specific evidence is shown separately with its device, test target and source.
          </p>
        </section>
      </div>
    </main>
  );
}

function GuideLegend({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <p className="text-sm font-black text-white">{label}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
