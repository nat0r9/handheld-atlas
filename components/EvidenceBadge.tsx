export type EvidenceTier =
  | "atlas_verified"
  | "community_verified"
  | "external_source"
  | "estimated"
  | "legacy_unclassified";

const evidenceLabels: Record<EvidenceTier, string> = {
  atlas_verified: "Atlas Verified",
  community_verified: "Community Verified",
  external_source: "External Source",
  estimated: "Estimated",
  legacy_unclassified: "Unclassified",
};

const evidenceStyles: Record<EvidenceTier, string> = {
  atlas_verified: "border-green-500/35 bg-green-500/10 text-green-300",
  community_verified: "border-cyan-500/35 bg-cyan-500/10 text-cyan-300",
  external_source: "border-purple-500/35 bg-purple-500/10 text-purple-300",
  estimated: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  legacy_unclassified: "border-slate-700 bg-slate-900 text-slate-400",
};

export default function EvidenceBadge({ tier }: { tier: EvidenceTier }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-[0.58rem] font-black uppercase tracking-[0.12em] ${evidenceStyles[tier]}`}>
      {evidenceLabels[tier]}
    </span>
  );
}
