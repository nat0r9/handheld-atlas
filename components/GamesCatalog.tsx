"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PublicGame, PublicGameTopPreset } from "../app/games/page";
import Pagination from "./catalog/Pagination";
import { Field, Select } from "./catalog/Filters";
export default function GamesCatalog({
  games,
  total,
  page,
  values,
  genreOptions,
  handheldOptions,
}: {
  games: PublicGame[];
  total: number;
  page: number;
  values: Record<string, string>;
  genreOptions: string[];
  handheldOptions: { value: string; label: string }[];
}) {
  return (
    <main className="atlas-page pb-14">
      <header className="atlas-shell py-8">
        <p className="atlas-section-label">Game database</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">
          Find something <span className="atlas-text-red">to play.</span>
        </h1>
        <p className="mt-4 text-slate-300">
          Find games with documented benchmarks or presets for your handheld.
          Atlas Score is the PC Metacritic critic score, not a performance or
          compatibility rating.
        </p>
      </header>
      <div className="atlas-shell">
        <form
          key={JSON.stringify(values)}
          action="/games"
          method="get"
          className="atlas-panel p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Search games" name="q">
              <input
                id="catalog-q"
                name="q"
                type="search"
                defaultValue={values.q}
                placeholder="Game name"
                className="w-full rounded-lg px-3 py-3 text-sm"
              />
            </Field>
            <Select
              label="Available data"
              name="coverage"
              value={values.coverage}
              options={[
                { value: "benchmarks", label: "Has benchmarks" },
                { value: "presets", label: "Has presets" },
                { value: "any", label: "Has either" },
              ]}
            />
            <Select
              label="Tested / configured for"
              name="handheld"
              value={values.handheld}
              options={handheldOptions}
            />
            <Select
              label="Genre"
              name="genre"
              value={values.genre}
              options={genreOptions.map((value) => ({ value, label: value }))}
            />
            <Select
              label="Sort"
              name="sort"
              value={values.sort}
              options={[
                { value: "score", label: "PC critic score" },
                { value: "name", label: "Name" },
                { value: "newest", label: "Newest release" },
                { value: "community", label: "Community rating" },
              ]}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="atlas-button-primary">
              Show games
            </button>
            <Link className="atlas-button-secondary" href="/games">
              Reset filters
            </Link>
          </div>
        </form>
        <h2 className="my-5 text-xl">{total} games</h2>
        {games.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <section className="atlas-panel p-8">
            <h2 className="text-2xl">No matching games</h2>
            <p className="mt-3 text-slate-300">
              Try a different title or remove a filter. A game without
              measurements may still be in the full catalogue.
            </p>
            <Link href="/games" className="atlas-button-primary mt-5">
              Browse all games
            </Link>
          </section>
        )}
        <Pagination path="/games" values={values} page={page} total={total} />
      </div>
    </main>
  );
}
function GameCard({ game }: { game: PublicGame }) {
  const [imageFailed, setImageFailed] = useState(false);
  const rating = {
    scoreClassName: "border-cyan-400/30 bg-black/60 text-cyan-200",
  };
  const showImage = Boolean(game.coverImageUrl) && !imageFailed;

  return (
    <Link href={`/games/${game.slug}`} className="group min-w-0">
      <article className="atlas-card atlas-card-hover flex h-full min-w-0 flex-col">
        <div className="relative aspect-[16/10] overflow-hidden">
          {showImage ? (
            <Image
              src={game.coverImageUrl ?? ""}
              alt={game.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
              onError={() => setImageFailed(true)}
              className="object-cover object-center transition duration-500 group-hover:scale-105"
            />
          ) : (
            <GameImageFallback name={game.name} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          <div className="absolute right-3 top-3">
            <div
              className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl border backdrop-blur sm:h-14 sm:w-14 ${rating.scoreClassName}`}
            >
              <span className="text-[0.42rem] font-black uppercase tracking-[0.1em] sm:text-[0.45rem]">
                Atlas
              </span>
              <strong className="mt-0.5 text-lg leading-none sm:text-xl">
                {game.atlasScore ?? "—"}
              </strong>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.15em] text-red-400 sm:text-[0.62rem]">
              {game.genre}
            </p>
            <h3 className="mt-1.5 line-clamp-2 text-2xl font-black leading-[1.05] sm:text-2xl">
              {game.name}
            </h3>
            <p className="mt-2 truncate text-xs text-slate-400">
              {game.developer ?? "Unknown developer"}
              {game.releaseYear ? ` · ${game.releaseYear}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="mb-3 text-sm font-bold text-cyan-300">
            {game.benchmarkCount} benchmarks · {game.presetCount} presets
          </p>
          <TopPresetSummary preset={game.topPreset} />

          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
            <span className="text-[0.52rem] font-black uppercase tracking-[0.1em] text-slate-600">
              Community
            </span>
            <span className="text-xs font-black text-yellow-300">
              {game.communityRating !== null
                ? `★ ${game.communityRating.toFixed(1)} · ${game.ratingCount}`
                : "No ratings yet"}
            </span>
          </div>

          <p className="mt-auto pt-4 text-xs font-black text-cyan-400 transition group-hover:text-white">
            Open game profile →
          </p>
        </div>
      </article>
    </Link>
  );
}

function TopPresetSummary({ preset }: { preset: PublicGameTopPreset | null }) {
  return (
    <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.045] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.52rem] font-black uppercase tracking-[0.1em] text-cyan-400">
          Top preset
        </span>
        {preset?.atlasVerified && (
          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[0.48rem] font-black uppercase tracking-[0.1em] text-green-300">
            Verified
          </span>
        )}
      </div>

      {preset ? (
        <div className="mt-2 min-w-0">
          <p className="truncate text-sm font-black text-slate-200">
            {preset.handheldName ?? "Unknown handheld"} · {preset.type}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {preset.averageFps !== null
              ? `${preset.averageFps} FPS avg`
              : "FPS not set"}
            {preset.confirmationCount > 0
              ? ` · ${preset.confirmationCount} confirmed`
              : " · awaiting confirmations"}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm font-black text-slate-500">No preset yet</p>
      )}
    </div>
  );
}

function GameImageFallback({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(239,68,68,0.12),transparent_35%),linear-gradient(135deg,#121826,#05070d)] p-5 text-center">
      <div>
        <p className="text-[0.56rem] font-black uppercase tracking-[0.18em] text-red-400">
          HandheldAtlas
        </p>
        <p className="mt-2 line-clamp-3 text-sm font-black text-slate-500">
          {name}
        </p>
        <p className="mt-3 text-[0.55rem] font-black uppercase tracking-[0.14em] text-slate-700">
          Cover unavailable
        </p>
      </div>
    </div>
  );
}
