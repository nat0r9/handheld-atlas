import Link from "next/link";
import { contributorHref, contributorLevelClass, contributorLevelLabel, type PublicContributor } from "../lib/contributors";

export default function ContributorAttribution({ profile, label = "Submitted by", compact = false }: { profile: PublicContributor | null; label?: string; compact?: boolean }) {
  if (!profile) return <p className="text-xs text-slate-500">{label} HandheldAtlas</p>;
  const href = contributorHref(profile);
  const name = profile.display_name?.trim() || "Community Member";
  const body = (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className={`grid shrink-0 place-items-center rounded-full border border-white/10 bg-black/30 font-black text-cyan-300 ${compact ? "h-7 w-7 text-[0.65rem]" : "h-9 w-9 text-xs"}`}>
        {name.slice(0, 2).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.55rem] font-black uppercase tracking-[0.12em] text-slate-600">{label}</span>
        <span className="block truncate text-sm font-black text-slate-200">{name}</span>
      </span>
      {!compact && <span className={`hidden rounded-full border px-2 py-1 text-[0.52rem] font-black uppercase tracking-[0.08em] sm:inline-flex ${contributorLevelClass(profile.contributor_level)}`}>{contributorLevelLabel(profile.contributor_level)}</span>}
    </span>
  );
  return href ? <Link href={href} className="inline-flex rounded-xl transition hover:bg-white/[0.04] hover:ring-1 hover:ring-cyan-500/30">{body}</Link> : body;
}
