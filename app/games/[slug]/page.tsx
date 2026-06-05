import PresetCard from "../../../components/PresetCard";
import { games } from "../../../data/games";
import { handhelds } from "../../../data/handhelds";
import { presets } from "../../../data/presets";

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const game = games.find((item) => item.slug === slug);

  if (!game) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-3xl font-bold">Game not found</h1>
      </main>
    );
  }

  const gamePresets = presets.filter(
    (preset) => preset.gameSlug === game.slug,
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
          Game Profile
        </p>

        <h1 className="mt-3 text-5xl font-black">{game.name}</h1>

        <p className="mt-4 text-slate-400">Genre: {game.genre}</p>

        <div className="mt-8">
          <span className="rounded-full bg-cyan-500/20 px-4 py-2 font-bold text-cyan-400">
            Atlas Score {game.atlasScore}/100
          </span>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Developer</p>

            <h2 className="mt-2 text-xl font-bold">
              {game.developer}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Release Year</p>

            <h2 className="mt-2 text-xl font-bold">
              {game.releaseYear}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">Best Handheld</p>

            <h2 className="mt-2 text-xl font-bold">
              {game.bestHandheld}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Recommended TDP
            </p>

            <h2 className="mt-2 text-xl font-bold">
              {game.recommendedTDP}
            </h2>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">Atlas Notes</p>

          <p className="mt-3 text-slate-300">{game.notes}</p>
        </div>

        <section className="mt-16">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Recommended Settings
          </p>

          <h2 className="mt-2 text-3xl font-black">Presets</h2>

          {gamePresets.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              No presets available yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {gamePresets.map((preset) => {
                const handheld = handhelds.find(
                  (item) => item.slug === preset.handheldSlug,
                );

                return (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    gameName={game.name}
                    handheldName={
                      handheld?.name ?? preset.handheldSlug
                    }
                    manufacturer={
                      handheld?.manufacturer ??
                      "Unknown manufacturer"
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}