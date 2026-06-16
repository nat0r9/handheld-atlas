import {
  getImpactExplanation,
  getImpactLabel,
} from "../lib/settings-impact";

interface ImpactMeterProps {
  label: string;
  value: number;
  metric: "performance" | "visual" | "vram" | "cpu" | "latency";
  compact?: boolean;
}

export default function ImpactMeter({
  label,
  value,
  metric,
  compact = false,
}: ImpactMeterProps) {
  const safeValue = Math.min(5, Math.max(0, Math.round(value)));
  const level = getImpactLabel(safeValue);

  return (
    <div
      className={`min-w-0 ${compact ? "" : "rounded-xl border border-white/[0.07] bg-black/20 p-3"}`}
      title={getImpactExplanation(metric)}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="truncate text-[0.52rem] font-black uppercase tracking-[0.12em] text-slate-600">
          {label}
        </p>
        <p className="shrink-0 text-[0.62rem] font-black text-slate-300">
          {level}
        </p>
      </div>

      <div
        className="mt-2 flex gap-1"
        aria-label={`${label}: ${level}, ${safeValue} out of 5`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-full ${
              index < safeValue
                ? safeValue >= 4
                  ? "bg-red-400"
                  : safeValue >= 2
                    ? "bg-cyan-400"
                    : "bg-green-400"
                : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
