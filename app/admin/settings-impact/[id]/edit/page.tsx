import Link from "next/link";
import { notFound } from "next/navigation";
import SettingImpactForm from "../../../../../components/admin/SettingImpactForm";
import { CONTENT_EDITOR_ROLES } from "../../../../../lib/auth/roles";
import { requireRole } from "../../../../../lib/auth/require-role";
import {
  addGameSettingImpact,
  deleteGameSettingImpact,
  deleteSettingImpact,
  updateSettingImpact,
} from "../../actions";

interface EditSettingImpactPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}

interface EditEntry {
  id: string;
  name: string;
  slug: string;
  category: string;
  commonness: string;
  summary: string;
  description: string | null;
  performance_impact: number;
  visual_impact: number;
  vram_impact: number;
  cpu_impact: number;
  latency_impact: number;
  restart_required: boolean;
  when_to_lower: string | null;
  when_to_keep_high: string | null;
  handheld_advice: string | null;
  caveat: string | null;
  confidence: number;
  atlas_verified: boolean;
  status: "draft" | "published" | "archived";
  setting_impact_aliases: Array<{ alias: string }>;
  game_setting_impacts: Array<{
    id: string;
    recommended_value: string | null;
    performance_change: string | null;
    resolution: string | null;
    tdp: string | null;
    atlas_verified: boolean;
    games: { name: string } | null;
    handhelds: { name: string } | null;
  }>;
}

export default async function EditSettingImpactPage({
  params,
  searchParams,
}: EditSettingImpactPageProps) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const { supabase, role } = await requireRole(CONTENT_EDITOR_ROLES, "/");
  const [entryResult, gamesResult, handheldsResult] = await Promise.all([
    supabase
      .from("setting_impact_entries")
      .select(`
        id,
        name,
        slug,
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
        setting_impact_aliases (alias),
        game_setting_impacts (
          id,
          recommended_value,
          performance_change,
          resolution,
          tdp,
          atlas_verified,
          games (name),
          handhelds (name)
        )
      `)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("games").select("id, name").order("name"),
    supabase.from("handhelds").select("id, name").order("name"),
  ]);

  if (!entryResult.data) {
    notFound();
  }

  const entry = entryResult.data as unknown as EditEntry;
  const aliases = (entry.setting_impact_aliases ?? [])
    .map((alias) => alias.alias)
    .filter((alias) => alias.toLowerCase() !== entry.name.toLowerCase())
    .join(", ");

  return (
    <main className="atlas-page pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/admin/settings-impact" className="text-sm font-black text-cyan-400 transition hover:text-white">← Back to Settings Guide</Link>
            <p className="atlas-section-label mt-7">Edit canonical setting</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">{entry.name}</h1>
          </div>
          <Link href={`/settings-impact/${entry.slug}`} className="atlas-button-secondary">Open public page</Link>
        </div>

        {(error || gamesResult.error || handheldsResult.error) && (
          <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-5 text-red-200">
            {error ?? gamesResult.error?.message ?? handheldsResult.error?.message}
          </div>
        )}
        {success && <div className="mt-6 rounded-2xl border border-green-500/25 bg-green-500/[0.07] p-5 text-green-200">{success}</div>}

        <div className="mt-7">
          <SettingImpactForm
            action={updateSettingImpact.bind(null, id)}
            canVerify={role === "atlas_editor" || role === "admin"}
            submitLabel="Save setting guide"
            values={{
              name: entry.name,
              slug: entry.slug,
              category: entry.category,
              commonness: entry.commonness,
              summary: entry.summary,
              description: entry.description ?? "",
              performanceImpact: entry.performance_impact,
              visualImpact: entry.visual_impact,
              vramImpact: entry.vram_impact,
              cpuImpact: entry.cpu_impact,
              latencyImpact: entry.latency_impact,
              restartRequired: entry.restart_required,
              whenToLower: entry.when_to_lower ?? "",
              whenToKeepHigh: entry.when_to_keep_high ?? "",
              handheldAdvice: entry.handheld_advice ?? "",
              caveat: entry.caveat ?? "",
              confidence: entry.confidence,
              aliases,
              atlasVerified: entry.atlas_verified,
              status: entry.status,
            }}
          />
        </div>

        <section className="mt-10 border-t border-white/[0.07] pt-8">
          <p className="atlas-section-label">Game-specific evidence</p>
          <h2 className="mt-2 text-3xl font-black">Add measured context</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            This does not create another generic page. It adds a specific result underneath the same canonical setting.
          </p>

          <form action={addGameSettingImpact.bind(null, id)} className="atlas-panel mt-5 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SelectField label="Game" name="gameId" options={(gamesResult.data ?? []).map((game) => ({ value: game.id, label: game.name }))} required />
              <SelectField label="Handheld" name="handheldId" options={(handheldsResult.data ?? []).map((handheld) => ({ value: handheld.id, label: handheld.name }))} optional />
              <InputField label="Recommended value" name="recommendedValue" placeholder="Medium" />
              <InputField label="Measured change" name="performanceChange" placeholder="+4–7 FPS" />
              <InputField label="Resolution" name="resolution" placeholder="1920×1080" />
              <InputField label="TDP" name="tdp" placeholder="25 W" />
              <InputField label="Visual note" name="visualNote" placeholder="Minor loss in distant shadows" />
              <InputField label="Source URL" name="sourceUrl" placeholder="https://…" />
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Test note</span>
              <textarea name="testNote" rows={4} className="mt-2 w-full rounded-xl px-4 py-3" placeholder="Test route, patch version, bottleneck and anything needed to reproduce it." />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <label className="text-sm font-bold text-slate-300">Confidence <select name="evidenceConfidence" defaultValue="3" className="ml-2 rounded-lg px-2 py-1.5"><option value="1">1/5</option><option value="2">2/5</option><option value="3">3/5</option><option value="4">4/5</option><option value="5">5/5</option></select></label>
              {(role === "atlas_editor" || role === "admin") && <label className="flex items-center gap-2 text-sm font-bold text-slate-300"><input type="checkbox" name="evidenceVerified" /> Atlas verified test</label>}
              <button type="submit" className="atlas-button-primary ml-auto">Add evidence</button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {(entry.game_setting_impacts ?? []).length === 0 ? (
              <div className="atlas-panel border-dashed p-8 text-center text-sm text-slate-500">No game-specific evidence yet.</div>
            ) : (
              entry.game_setting_impacts.map((item) => (
                <article key={item.id} className="atlas-panel p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-black">{item.games?.name ?? "Unknown game"}{item.handhelds?.name ? ` · ${item.handhelds.name}` : ""}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.recommended_value ?? "No value"} · {item.performance_change ?? "No measured change"} · {item.resolution ?? "No resolution"} · {item.tdp ?? "No TDP"}</p>
                    </div>
                    <form action={deleteGameSettingImpact.bind(null, id, item.id)}>
                      <button type="submit" className="rounded-xl border border-red-500/25 px-4 py-2 text-sm font-black text-red-300">Remove</button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-red-400">Danger zone</p>
          <h2 className="mt-2 text-2xl font-black">Delete this canonical setting</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            This also removes its aliases and game-specific evidence. Existing presets remain intact, but their automatic Learn why link disappears.
          </p>
          <form action={deleteSettingImpact.bind(null, id)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
              <input type="checkbox" required className="h-4 w-4" />
              I understand this removes the guide and its evidence.
            </label>
            <button type="submit" className="rounded-xl border border-red-500/30 bg-red-500/[0.08] px-5 py-3 text-sm font-black text-red-300 transition hover:border-red-400/60 hover:bg-red-500/[0.14]">
              Delete setting guide
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function InputField({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  return <label><span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span><input name={name} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl px-3" /></label>;
}

function SelectField({ label, name, options, required = false, optional = false }: { label: string; name: string; options: Array<{ value: string; label: string }>; required?: boolean; optional?: boolean }) {
  return <label><span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span><select name={name} required={required} className="mt-2 h-11 w-full rounded-xl px-3">{optional && <option value="">All handhelds</option>} {!optional && <option value="">Choose…</option>}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
