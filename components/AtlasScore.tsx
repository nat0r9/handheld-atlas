"use client";

interface AtlasScoreProps {
  score: number | null;
  variant?: "compact" | "card" | "large";
  label?: string;
  className?: string;
}

function getScoreAccent(score: number | null) {
  if (score === null) {
    return {
      border: "border-white/[0.08]",
      glow: "shadow-[0_0_24px_rgba(148,163,184,0.06)]",
      number: "text-slate-300",
      flare: "bg-slate-400/5",
      bar: "bg-slate-600",
    };
  }

  if (score >= 90) {
    return {
      border: "border-red-500/35",
      glow: "shadow-[0_0_34px_rgba(239,35,60,0.2)]",
      number: "text-white",
      flare: "bg-red-500/12",
      bar: "bg-red-400",
    };
  }

  if (score >= 80) {
    return {
      border: "border-red-500/25",
      glow: "shadow-[0_0_28px_rgba(239,35,60,0.14)]",
      number: "text-white",
      flare: "bg-red-500/[0.09]",
      bar: "bg-red-500",
    };
  }

  if (score >= 70) {
    return {
      border: "border-red-500/20",
      glow: "shadow-[0_0_24px_rgba(239,35,60,0.1)]",
      number: "text-slate-100",
      flare: "bg-red-500/[0.06]",
      bar: "bg-red-600",
    };
  }

  return {
    border: "border-red-500/15",
    glow: "shadow-[0_0_20px_rgba(239,35,60,0.07)]",
    number: "text-slate-200",
    flare: "bg-red-500/[0.04]",
    bar: "bg-red-800",
  };
}

function ScoreBackground({ flare }: { flare: string }) {
  return (
    <>
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl ${flare}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.025),transparent_34%,rgba(239,35,60,0.025))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/35 to-transparent" />
    </>
  );
}

export default function AtlasScore({
  score,
  variant = "card",
  label = "Atlas Score",
  className = "",
}: AtlasScoreProps) {
  const accent = getScoreAccent(score);
  const scoreWidth = score === null ? 0 : Math.max(0, Math.min(100, score));

  if (variant === "compact") {
    return (
      <div
        title={`${label}: ${score ?? "not rated"}`}
        className={`relative flex h-12 w-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border bg-[#020306]/95 backdrop-blur sm:h-14 sm:w-14 ${accent.border} ${accent.glow} ${className}`}
      >
        <ScoreBackground flare={accent.flare} />
        <span className="relative text-[0.42rem] font-black uppercase tracking-[0.1em] text-slate-600 sm:text-[0.45rem]">
          Atlas
        </span>
        <strong
          className={`relative mt-0.5 text-lg leading-none tracking-[-0.04em] sm:text-xl ${accent.number}`}
        >
          {score ?? "—"}
        </strong>
      </div>
    );
  }

  const isLarge = variant === "large";

  return (
    <article
      className={`relative min-w-0 overflow-hidden border bg-[#020306]/95 ${
        isLarge ? "rounded-2xl p-4 sm:p-5" : "rounded-xl p-3 sm:p-4"
      } ${accent.border} ${accent.glow} ${className}`}
    >
      <ScoreBackground flare={accent.flare} />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p
            className={`font-black uppercase text-slate-600 ${
              isLarge
                ? "text-[0.5rem] tracking-[0.14em]"
                : "text-[0.48rem] tracking-[0.12em]"
            }`}
          >
            {label}
          </p>
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_9px_rgba(239,35,60,0.8)]" />
        </div>

        <div className={`flex items-end gap-1.5 ${isLarge ? "mt-2" : "mt-2"}`}>
          <span
            className={`font-black leading-none tracking-[-0.06em] ${
              isLarge ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
            } ${accent.number}`}
          >
            {score ?? "—"}
          </span>
          <span
            className={`font-black uppercase tracking-[0.08em] text-red-400 ${
              isLarge ? "pb-1 text-xs" : "pb-0.5 text-[0.58rem]"
            }`}
          >
            /100
          </span>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
            style={{ width: `${scoreWidth}%` }}
          />
        </div>
      </div>
    </article>
  );
}
