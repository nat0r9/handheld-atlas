import Link from "next/link";
import { games } from "../../data/games";

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h1 className="mb-2 text-5xl font-black">Games</h1>

        <p className="mb-10 text-slate-400">
          Browse games, handheld presets and Atlas Scores.
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500 hover:bg-slate-800"
            >
              <p className="text-sm text-slate-500">{game.genre}</p>

              <h2 className="mt-2 text-2xl font-bold">{game.name}</h2>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">Atlas Score</span>

                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-bold text-cyan-400">
                  {game.atlasScore}/100
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}