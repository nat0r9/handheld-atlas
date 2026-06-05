import { benchmarks } from "../../data/benchmarks";
import { games } from "../../data/games";
import { handhelds } from "../../data/handhelds";
import { presets } from "../../data/presets";

export default function BenchmarksPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Performance Data
        </p>

        <h1 className="mt-3 text-5xl font-black">Benchmarks</h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Compare average FPS, 1% lows, power usage and battery life
          across handheld gaming devices.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    Game
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    Handheld
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    Preset
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    Resolution
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    TDP
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    Avg FPS
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    1% Low
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-400">
                    Battery
                  </th>
                </tr>
              </thead>

              <tbody>
                {benchmarks.map((benchmark) => {
                  const game = games.find(
                    (item) => item.slug === benchmark.gameSlug,
                  );

                  const handheld = handhelds.find(
                    (item) => item.slug === benchmark.handheldSlug,
                  );

                  const preset = presets.find(
                    (item) => item.id === benchmark.presetId,
                  );

                  return (
                    <tr
                      key={benchmark.id}
                      className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-5 font-semibold">
                        {game?.name ?? benchmark.gameSlug}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {handheld?.name ?? benchmark.handheldSlug}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {preset?.name ?? benchmark.presetId}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {benchmark.resolution}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {benchmark.tdp}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-bold text-cyan-400">
                          {benchmark.averageFps}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {benchmark.onePercentLow}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {benchmark.batteryLife}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold text-yellow-300">
            Development data
          </p>

          <p className="mt-2 text-sm text-yellow-100/70">
            Current benchmark values are sample data used to build the
            HandheldAtlas interface. They will later be replaced with
            verified test results.
          </p>
        </div>
      </div>
    </main>
  );
}