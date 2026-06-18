import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contributorLevelClass, contributorLevelLabel, type ContributorLevel } from "../../../lib/contributors";
import { createClient } from "../../../lib/supabase/server";
import { absoluteUrl } from "../../../lib/site";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ slug: string }>; }
interface ProfileRow {
  id: string;
  display_name: string | null;
  public_slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  owned_devices: string[] | null;
  contributor_level: ContributorLevel | null;
  contribution_score: number | null;
  public_profile: boolean;
  created_at: string;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name, bio, public_profile").eq("public_slug", slug).maybeSingle();
  if (!data || !data.public_profile) return { title: "Contributor Not Found" };
  const title = `${data.display_name ?? "Community Contributor"} — HandheldAtlas`;
  const description = data.bio ?? "Handheld gaming presets, benchmarks and community contributions.";
  return { title, description, alternates: { canonical: absoluteUrl(`/contributors/${slug}`) } };
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : new Intl.DateTimeFormat("en", { year: "numeric", month: "long" }).format(date);
}

export default async function ContributorPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profileData } = await supabase.from("profiles").select("id, display_name, public_slug, bio, avatar_url, owned_devices, contributor_level, contribution_score, public_profile, created_at").eq("public_slug", slug).eq("public_profile", true).maybeSingle();
  if (!profileData) notFound();
  const profile = profileData as ProfileRow;

  const [presetResult, benchmarkResult, badgeResult, confirmationResult] = await Promise.all([
    supabase.from("presets").select("id, name, preset_type, published_at, games(name, slug), handhelds(name, slug)").eq("created_by", profile.id).eq("status", "published").order("published_at", { ascending: false }).limit(12),
    supabase.from("benchmarks").select("id, average_fps, one_percent_low, resolution, tdp, published_at, games(name, slug), handhelds(name, slug)").eq("created_by", profile.id).eq("status", "published").order("published_at", { ascending: false }).limit(12),
    supabase.from("user_contributor_badges").select("awarded_at, contributor_badges(slug, name, description, icon, badge_type)").eq("user_id", profile.id).order("awarded_at", { ascending: true }),
    supabase.from("preset_confirmations").select("preset_id, presets!inner(created_by)").eq("presets.created_by", profile.id),
  ]);

  const presets = presetResult.data ?? [];
  const benchmarks = benchmarkResult.data ?? [];
  const badges = badgeResult.data ?? [];
  const confirmationCount = confirmationResult.data?.length ?? 0;
  const name = profile.display_name?.trim() || "Community Contributor";

  return (
    <main className="atlas-page min-h-[calc(100vh-4rem)] pb-16 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-10 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div className="flex min-w-0 items-start gap-4 sm:gap-6">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-cyan-500/25 bg-cyan-500/10 text-2xl font-black text-cyan-300 sm:h-28 sm:w-28 sm:text-4xl">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="atlas-section-label">Contributor profile</p>
                <h1 className="mt-2 break-words text-4xl font-black tracking-[-0.05em] sm:text-6xl">{name}</h1>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] ${contributorLevelClass(profile.contributor_level)}`}>{contributorLevelLabel(profile.contributor_level)}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-black text-slate-300">Member since {formatDate(profile.created_at)}</span>
                </div>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">{profile.bio?.trim() || "Handheld gaming contributor sharing tested presets, benchmarks and practical performance knowledge."}</p>
              </div>
            </div>
            <section className="atlas-panel grid grid-cols-2 gap-3 p-4">
              <Stat label="Published presets" value={presets.length} />
              <Stat label="Benchmarks" value={benchmarks.length} />
              <Stat label="Worked for me" value={confirmationCount} />
              <Stat label="Reputation" value={profile.contribution_score ?? 0} />
            </section>
          </div>
        </div>
      </section>

      <div className="atlas-shell space-y-8 pt-7">
        {(profile.owned_devices?.length ?? 0) > 0 && <section><p className="atlas-section-label">Testing hardware</p><div className="mt-3 flex flex-wrap gap-2">{profile.owned_devices!.map((device) => <span key={device} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-slate-300">{device}</span>)}</div></section>}

        {badges.length > 0 && <section><p className="atlas-section-label">Badges & specialisms</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{badges.map((row, index) => { const badge = Array.isArray(row.contributor_badges) ? row.contributor_badges[0] : row.contributor_badges; if (!badge) return null; return <article key={`${badge.slug}-${index}`} className="atlas-card p-4"><div className="flex gap-3"><span className="text-2xl">{badge.icon}</span><div><h2 className="font-black">{badge.name}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{badge.description}</p></div></div></article>; })}</div></section>}

        <section>
          <div className="flex items-end justify-between gap-4"><div><p className="atlas-section-label">Published work</p><h2 className="mt-2 text-3xl font-black">Presets</h2></div><Link href="/presets" className="text-sm font-black text-cyan-400">Browse all →</Link></div>
          {presets.length === 0 ? <Empty text="No published presets yet." /> : <div className="mt-4 grid gap-4 md:grid-cols-2">{presets.map((preset) => { const game = Array.isArray(preset.games) ? preset.games[0] : preset.games; const handheld = Array.isArray(preset.handhelds) ? preset.handhelds[0] : preset.handhelds; return <Link key={preset.id} href={`/presets/${preset.id}`} className="atlas-card atlas-card-hover p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-400">{game?.name ?? "Unknown game"}</p><h3 className="mt-2 text-xl font-black">{preset.name}</h3><p className="mt-2 text-sm text-slate-500">{handheld?.name ?? "Unknown handheld"} · {preset.preset_type}</p></Link>; })}</div>}
        </section>

        <section>
          <div className="flex items-end justify-between gap-4"><div><p className="atlas-section-label">Measured work</p><h2 className="mt-2 text-3xl font-black">Benchmarks</h2></div><Link href="/benchmarks" className="text-sm font-black text-cyan-400">Browse all →</Link></div>
          {benchmarks.length === 0 ? <Empty text="No published benchmarks yet." /> : <div className="mt-4 grid gap-4 md:grid-cols-2">{benchmarks.map((benchmark) => { const game = Array.isArray(benchmark.games) ? benchmark.games[0] : benchmark.games; const handheld = Array.isArray(benchmark.handhelds) ? benchmark.handhelds[0] : benchmark.handhelds; return <article key={benchmark.id} className="atlas-card p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-red-400">{game?.name ?? "Unknown game"}</p><h3 className="mt-2 text-xl font-black">{benchmark.average_fps ?? "—"} FPS average</h3><p className="mt-2 text-sm text-slate-500">{handheld?.name ?? "Unknown handheld"} · {benchmark.resolution ?? "Resolution unknown"} · {benchmark.tdp ?? "TDP unknown"}</p></article>; })}</div>}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[0.55rem] font-black uppercase tracking-[0.1em] text-slate-600">{label}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="atlas-panel mt-4 p-6 text-sm text-slate-500">{text}</div>; }
