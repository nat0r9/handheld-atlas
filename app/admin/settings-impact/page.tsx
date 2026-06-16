import Link from "next/link";
import { CONTENT_EDITOR_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

interface AdminSettingsImpactPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

interface AdminSettingImpact {
  id: string;
  slug: string;
  name: string;
  category: string;
  commonness: "common" | "advanced" | "specialized";
  performance_impact: number;
  visual_impact: number;
  vram_impact: number;
  atlas_verified: boolean;
  status: "draft" | "published" | "archived";
  updated_at: string | null;
  setting_impact_aliases: Array<{ id: string }>;
  game_setting_impacts: Array<{ id: string }>;
}

export default async function AdminSettingsImpactPage({
  searchParams,
}: AdminSettingsImpactPageProps) {
  const { error, success } = await searchParams;
  const { supabase } = await requireRole(CONTENT_EDITOR_ROLES, "/");
  const { data, error: databaseError } = await supabase
    .from("setting_impact_entries")
    .select(`
      id,
      slug,
      name,
      category,
      commonness,
      performance_impact,
      visual_impact,
      vram_impact,
      atlas_verified,
      status,
      updated_at,
      setting_impact_aliases (id),
      game_setting_impacts (id)
    `)
    .order("name", { ascending: true });

  const entries = (data ?? []) as unknown as AdminSettingImpact[];

  return (
    <main className="atlas-page pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Link href="/admin" className="text-sm font-black text-cyan-400 transition hover:text-white">
              ← Back to dashboard
            </Link>
            <p className="atlas-section-label mt-7">Settings knowledge base</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">Settings Guide</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
              Maintain one canonical explanation per graphics setting. Aliases automatically connect different in-game names without creating duplicate public pages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/settings-impact" className="atlas-button-secondary">Open public guide</Link>
            <Link href="/admin/settings-impact/new" className="atlas-button-primary">Add setting</Link>
          </div>
        </div>

        {(error || databaseError) && (
          <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-5 text-red-200">
            <p className="font-black">Could not load Settings Guide.</p>
            <p className="mt-2 break-words text-sm">{error ?? databaseError?.message}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-green-500/25 bg-green-500/[0.07] p-5 text-green-200">
            {success}
          </div>
        )}

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Total entries" value={entries.length} />
          <Stat label="Published" value={entries.filter((entry) => entry.status === "published").length} />
          <Stat label="Atlas reviewed" value={entries.filter((entry) => entry.atlas_verified).length} />
        </section>

        <section className="mt-6 space-y-3">
          {entries.length === 0 ? (
            <div className="atlas-panel border-dashed p-10 text-center text-slate-500">
              No settings have been added yet.
            </div>
          ) : (
            entries.map((entry) => (
              <article key={entry.id} className="atlas-panel p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] px-2.5 py-1 text-[0.52rem] font-black uppercase tracking-[0.1em] text-cyan-300">
                        {entry.category}
                      </span>
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[0.52rem] font-black uppercase tracking-[0.1em] text-slate-400">
                        {entry.commonness}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[0.52rem] font-black uppercase tracking-[0.1em] ${entry.status === "published" ? "border-green-500/20 bg-green-500/[0.06] text-green-300" : entry.status === "archived" ? "border-red-500/20 bg-red-500/[0.06] text-red-300" : "border-orange-500/20 bg-orange-500/[0.06] text-orange-300"}`}>
                        {entry.status}
                      </span>
                      {entry.atlas_verified && <span className="text-[0.55rem] font-black uppercase tracking-[0.1em] text-green-400">Atlas reviewed</span>}
                    </div>
                    <h2 className="mt-2 break-words text-xl font-black">{entry.name}</h2>
                    <p className="mt-1 text-xs text-slate-600">/{entry.slug}</p>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center">
                    <Mini label="FPS" value={entry.performance_impact} />
                    <Mini label="Visual" value={entry.visual_impact} />
                    <Mini label="VRAM" value={entry.vram_impact} />
                    <Mini label="Aliases" value={entry.setting_impact_aliases?.length ?? 0} />
                    <Mini label="Tests" value={entry.game_setting_impacts?.length ?? 0} />
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link href={`/settings-impact/${entry.slug}`} className="atlas-button-secondary">View</Link>
                    <Link href={`/admin/settings-impact/${entry.id}/edit`} className="atlas-button-secondary">Edit</Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="atlas-panel p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2"><p className="text-[0.46rem] font-black uppercase tracking-[0.1em] text-slate-600">{label}</p><p className="mt-1 text-sm font-black text-white">{value}</p></div>;
}
