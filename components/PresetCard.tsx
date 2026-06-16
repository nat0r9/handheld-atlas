import Link from "next/link";
import type { Preset, PresetType } from "../types/presets";

interface PresetCardProps {
  preset: Preset;
  gameName: string;
  handheldName: string;
  manufacturer: string;
  showGameLink?: boolean;
}

function getPresetStyle(type: PresetType) {
  switch (type) {
    case "Performance":
      return {
        badge: "bg-orange-500/20 text-orange-400",
        border: "hover:border-orange-500",
        glow: "hover:shadow-orange-500/10",
        accent: "text-orange-400",
      };

    case "Balanced":
      return {
        badge: "bg-cyan-500/20 text-cyan-400",
        border: "hover:border-cyan-500",
        glow: "hover:shadow-cyan-500/10",
        accent: "text-cyan-400",
      };

    case "Battery":
      return {
        badge: "bg-green-500/20 text-green-400",
        border: "hover:border-green-500",
        glow: "hover:shadow-green-500/10",
        accent: "text-green-400",
      };

    case "Docked":
      return {
        badge: "bg-red-500/20 text-red-400",
        border: "hover:border-red-500",
        glow: "hover:shadow-red-500/10",
        accent: "text-red-400",
      };

    case "Custom":
      return {
        badge: "bg-purple-500/20 text-purple-400",
        border: "hover:border-purple-500",
        glow: "hover:shadow-purple-500/10",
        accent: "text-purple-400",
      };
  }
}

export default function PresetCard({
  preset,
  gameName,
  handheldName,
  manufacturer,
  showGameLink = false,
}: PresetCardProps) {
  const style = getPresetStyle(preset.type);

  return (
    <article
      className={`rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition duration-200 ${style.border} ${style.glow}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{gameName}</p>

          <h3 className="mt-2 text-2xl font-bold">{preset.name}</h3>

          <p className="mt-1 text-sm text-slate-400">
            {manufacturer} · {handheldName}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}
        >
          {preset.type}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Resolution
          </p>

          <p className="mt-1 font-semibold">{preset.resolution}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            TDP
          </p>

          <p className="mt-1 font-semibold">{preset.tdp}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Average FPS
          </p>

          <p className="mt-1 font-semibold">{preset.fpsAverage}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Upscaler
          </p>

          <p className="mt-1 font-semibold">{preset.upscaler}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Battery
          </p>

          <p className="mt-1 font-semibold">{preset.batteryLife}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Rating
          </p>

          <p className={`mt-1 font-semibold ${style.accent}`}>
            ★ {preset.communityRating}/5
          </p>
        </div>
      </div>

      {showGameLink && (
        <Link
          href={`/games/${preset.gameSlug}`}
          className="mt-6 inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-white"
        >
          View game profile
        </Link>
      )}
    </article>
  );
}