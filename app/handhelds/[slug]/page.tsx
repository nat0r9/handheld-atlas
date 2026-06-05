import PresetCard from "../../../components/PresetCard";
import { benchmarks } from "../../../data/benchmarks";
import { games } from "../../../data/games";
import { handhelds } from "../../../data/handhelds";
import { presets } from "../../../data/presets";

export default async function HandheldPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const handheld = handhelds.find((item) => item.slug === slug);

  if (!handheld) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-black">Handheld not found</h1>

          <p className="mt-3 text-slate-400">
            The requested handheld does not exist in the database.
          </p>
        </div>
      </main>
    );
  }

  const handheldPresets = presets.filter(
    (preset) => preset.handheldSlug === handheld.slug,
  );

  const handheldBenchmarks = benchmarks.filter(
    (benchmark) => benchmark.handheldSlug === handheld.slug,
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
            Handheld Profile
          </p>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm text-slate-500">
                {handheld.manufacturer}
              </p>

              <h1 className="mt-2 text-5xl font-black">
                {handheld.name}
              </h1>

              <p className="mt-4 text-slate-400">
                {handheld.operatingSystem}
              </p>
            </div>

            <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm font-bold text-cyan-400">
              {handheld.status}
            </span>
          </div>
        </section>

        <section className="mt-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Hardware
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Specifications
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SpecCard
              label="Processor"
              value={handheld.processor}
            />

            <SpecCard
              label="Memory"
              value={handheld.memory}
            />

            <SpecCard
              label="Storage"
              value={handheld.storage}
            />

            <SpecCard
              label="Display"
              value={handheld.displaySize}
            />

            <SpecCard
              label="Resolution"
              value={handheld.resolution}
            />

            <SpecCard
              label="Refresh Rate"
              value={handheld.refreshRate}
            />

            <SpecCard
              label="Battery"
              value={handheld.battery}
            />

            <SpecCard
              label="Weight"
              value={handheld.weight}
            />

            <SpecCard
              label="Operating System"
              value={handheld.operatingSystem}
            />
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Recommended Settings
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Available Presets
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {handheldPresets.length}{" "}
              {handheldPresets.length === 1 ? "preset" : "presets"}
            </p>
          </div>

          {handheldPresets.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-bold">
                No presets available
              </h3>

              <p className="mt-2 text-slate-400">
                Presets for this handheld will be added later.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {handheldPresets.map((preset) => {
                const game = games.find(
                  (item) => item.slug === preset.gameSlug,
                );

                return (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    gameName={game?.name ?? preset.gameSlug}
                    handheldName={handheld.name}
                    manufacturer={handheld.manufacturer}
                    showGameLink
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Performance Data
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Benchmarks
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {handheldBenchmarks.length}{" "}
              {handheldBenchmarks.length === 1
                ? "benchmark"
                : "benchmarks"}
            </p>
          </div>

          {handheldBenchmarks.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-bold">
                No benchmarks available
              </h3>

              <p className="mt-2 text-slate-400">
                Verified benchmark results will be added later.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/60">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Game
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Resolution
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        TDP
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Average FPS
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        1% Low
                      </th>

                      <th className="px-6 py-4 text-sm font-semibold text-slate-500">
                        Battery
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {handheldBenchmarks.map((benchmark) => {
                      const game = games.find(
                        (item) =>
                          item.slug === benchmark.gameSlug,
                      );

                      return (
                        <tr
                          key={benchmark.id}
                          className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5 font-semibold">
                            {game?.name ?? benchmark.gameSlug}
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
          )}
        </section>

        <div className="mt-10 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold text-yellow-300">
            Development data
          </p>

          <p className="mt-2 text-sm text-yellow-100/70">
            Device specifications and benchmark values are currently
            development data. Every value will be verified before the
            public launch.
          </p>
        </div>
      </div>
    </main>
  );
}

interface SpecCardProps {
  label: string;
  value: string;
}

function SpecCard({ label, value }: SpecCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-lg font-bold text-slate-100">
        {value}
      </p>
    </article>
  );
}