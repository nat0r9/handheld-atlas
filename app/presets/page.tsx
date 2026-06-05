import Link from "next/link";
import { games } from "../../data/games";
import { handhelds } from "../../data/handhelds";
import { presets } from "../../data/presets";

export default function PresetsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Performance Profiles
        </p>

        <h1 className="mt-3 text-5xl font-black">Presets</h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Browse performance, balanced, battery and docked settings for
          supported handheld gaming devices.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {presets.map((preset) => {
            const game = games.find(
              (item) => item.slug === preset.gameSlug,
            );

            const handheld = handhelds.find(
              (item) => item.slug === preset.handheldSlug,
            );

            return (
              <article
                key={preset.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {game?.name ?? preset.gameSlug}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      {preset.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {handheld?.name ?? preset.handheldSlug}
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-400">
                    {preset.type}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Resolution
                    </p>
                    <p className="mt-1 font-semibold">
                      {preset.resolution}
                    </p>
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
                    <p className="mt-1 font-semibold">
                      {preset.fpsAverage}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Upscaler
                    </p>
                    <p className="mt-1 font-semibold">
                      {preset.upscaler}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Battery
                    </p>
                    <p className="mt-1 font-semibold">
                      {preset.batteryLife}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Rating
                    </p>
                    <p className="mt-1 font-semibold text-cyan-400">
                      ★ {preset.communityRating}/5
                    </p>
                  </div>
                </div>

                <Link
                  href={`/games/${preset.gameSlug}`}
                  className="mt-6 inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-white"
                >
                  View game profile
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}