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
      glow:
        "shadow-[0_0_24px_rgba(148,163,184,0.08)]",
      border:
        "border-slate-600/30",
      number:
        "text-slate-300",
      flare:
        "from-slate-400/10",
    };
  }

  if (score >= 90) {
    return {
      glow:
        "shadow-[0_0_30px_rgba(239,35,60,0.18)]",
      border:
        "border-red-500/35",
      number:
        "text-white",
      flare:
        "from-red-500/18",
    };
  }

  if (score >= 80) {
    return {
      glow:
        "shadow-[0_0_26px_rgba(239,35,60,0.12)]",
      border:
        "border-red-500/25",
      number:
        "text-white",
      flare:
        "from-red-500/12",
    };
  }

  if (score >= 70) {
    return {
      glow:
        "shadow-[0_0_24px_rgba(168,85,247,0.1)]",
      border:
        "border-purple-500/25",
      number:
        "text-slate-100",
      flare:
        "from-purple-500/10",
    };
  }

  return {
    glow:
      "shadow-[0_0_22px_rgba(24,215,255,0.08)]",
    border:
      "border-cyan-500/20",
    number:
      "text-slate-200",
    flare:
      "from-cyan-500/10",
  };
}

export default function AtlasScore({
  score,
  variant = "card",
  label = "Atlas Score",
  className = "",
}: AtlasScoreProps) {
  const accent =
    getScoreAccent(score);

  if (variant === "compact") {
    return (
      <div
        className={`relative flex h-12 w-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border bg-[#03050a]/95 backdrop-blur sm:h-14 sm:w-14 ${accent.border} ${accent.glow} ${className}`}
      >
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.flare} via-transparent to-transparent`}
        />

        <span className="relative text-[0.42rem] font-black uppercase tracking-[0.1em] text-slate-600 sm:text-[0.45rem]">
          Atlas
        </span>

        <strong
          className={`relative mt-0.5 text-lg leading-none sm:text-xl ${accent.number}`}
        >
          {score ?? "—"}
        </strong>
      </div>
    );
  }

  if (variant === "large") {
    return (
      <article
        className={`relative min-w-0 overflow-hidden rounded-2xl border bg-[#03050a]/95 p-4 sm:p-5 ${accent.border} ${accent.glow} ${className}`}
      >
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.flare} via-transparent to-transparent`}
        />

        <div className="relative">
          <p className="text-[0.5rem] font-black uppercase tracking-[0.14em] text-slate-600">
            {label}
          </p>

          <div className="mt-2 flex items-end gap-1.5">
            <span
              className={`text-3xl font-black leading-none tracking-[-0.05em] sm:text-4xl ${accent.number}`}
            >
              {score ?? "—"}
            </span>

            <span className="pb-1 text-xs font-black uppercase tracking-[0.1em] text-red-400">
              /100
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`relative min-w-0 overflow-hidden rounded-xl border bg-[#03050a]/95 p-3 sm:p-4 ${accent.border} ${accent.glow} ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.flare} via-transparent to-transparent`}
      />

      <div className="relative">
        <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
          {label}
        </p>

        <div className="mt-2 flex items-end gap-1">
          <span
            className={`text-xl font-black leading-none sm:text-2xl ${accent.number}`}
          >
            {score ?? "—"}
          </span>

          <span className="pb-0.5 text-[0.58rem] font-black uppercase tracking-[0.08em] text-red-400">
            /100
          </span>
        </div>
      </div>
    </article>
  );
}
