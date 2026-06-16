import type {
  PresetTrustTone,
} from "../lib/preset-trust";

interface PresetTrustBadgeProps {
  score: number;
  label: string;
  tone: PresetTrustTone;
  compact?: boolean;
}

function getToneStyle(
  tone: PresetTrustTone,
) {
  switch (tone) {
    case "green":
      return "border-green-500/35 bg-green-500/[0.1] text-green-300";
    case "cyan":
      return "border-cyan-500/35 bg-cyan-500/[0.1] text-cyan-300";
    case "orange":
      return "border-orange-500/35 bg-orange-500/[0.1] text-orange-300";
    default:
      return "border-white/[0.1] bg-black/25 text-slate-400";
  }
}

export default function PresetTrustBadge({
  score,
  label,
  tone,
  compact = false,
}: PresetTrustBadgeProps) {
  return (
    <div
      className={`inline-flex min-w-0 items-center gap-2 rounded-full border font-black ${getToneStyle(
        tone,
      )} ${
        compact
          ? "px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.09em]"
          : "px-3 py-2 text-xs"
      }`}
      title="Atlas Confidence measures evidence completeness, documentation, community proof and editorial review."
    >
      <span
        aria-hidden="true"
        className="text-current"
      >
        ◈
      </span>
      <span className="truncate">
        {label}
      </span>
      <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[0.9em] text-white">
        {score}
      </span>
    </div>
  );
}
