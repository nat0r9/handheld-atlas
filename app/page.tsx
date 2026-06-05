"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { games } from "../data/games";
import { handhelds } from "../data/handhelds";
import { presets } from "../data/presets";
import { benchmarks } from "../data/benchmarks";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const gameResults = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return [];
    }

    return games
      .filter((game) => {
        const searchableText = [
          game.name,
          game.genre,
          game.developer,
          game.bestHandheld,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 5);
  }, [normalizedQuery]);

  const handheldResults = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return [];
    }

    return handhelds
      .filter((handheld) => {
        const searchableText = [
          handheld.name,
          handheld.manufacturer,
          handheld.processor,
          handheld.operatingSystem,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 5);
  }, [normalizedQuery]);

  const hasResults =
    gameResults.length > 0 || handheldResults.length > 0;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
          Handheld Gaming Database
        </p>

        <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl">
          HandheldAtlas
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-slate-400 md:text-xl">
          Find the best settings, benchmarks, TDP profiles and
          battery presets for every handheld gaming device.
        </p>

        <div className="relative max-w-2xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-2xl">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search HandheldAtlas"
              className="w-full rounded-xl bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
              placeholder="Search Cyberpunk 2077, ROG Ally X, Steam Deck..."
            />
          </div>

          {normalizedQuery.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              {!hasResults ? (
                <div className="p-6">
                  <h2 className="font-bold">No results found</h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Try another game, handheld or manufacturer.
                  </p>
                </div>
              ) : (
                <div className="max-h-[32rem] overflow-y-auto">
                  {gameResults.length > 0 && (
                    <section className="border-b border-slate-800 p-3">
                      <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Games
                      </p>

                      {gameResults.map((game) => (
                        <Link
                          key={game.slug}
                          href={`/games/${game.slug}`}
                          className="block rounded-xl px-3 py-3 transition hover:bg-slate-800"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-bold">{game.name}</p>

                              <p className="mt-1 text-sm text-slate-500">
                                {game.genre} · {game.developer}
                              </p>
                            </div>

                            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-400">
                              {game.atlasScore}/100
                            </span>
                          </div>
                        </Link>
                      ))}
                    </section>
                  )}

                  {handheldResults.length > 0 && (
                    <section className="p-3">
                      <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Handhelds
                      </p>

                      {handheldResults.map((handheld) => (
                        <Link
                          key={handheld.slug}
                          href={`/handhelds/${handheld.slug}`}
                          className="block rounded-xl px-3 py-3 transition hover:bg-slate-800"
                        >
                          <div>
                            <p className="font-bold">
                              {handheld.name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {handheld.manufacturer} ·{" "}
                              {handheld.processor}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Link
            href="/games"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500"
          >
            <p className="text-sm text-slate-500">Games</p>

            <h2 className="mt-2 text-2xl font-bold">
              {games.length}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Game profiles
            </p>
          </Link>

          <Link
            href="/handhelds"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500"
          >
            <p className="text-sm text-slate-500">Handhelds</p>

            <h2 className="mt-2 text-2xl font-bold">
              {handhelds.length}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Supported devices
            </p>
          </Link>

          <Link
            href="/presets"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500"
          >
            <p className="text-sm text-slate-500">Presets</p>

            <h2 className="mt-2 text-2xl font-bold">
              {presets.length}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Performance profiles
            </p>
          </Link>

          <Link
            href="/benchmarks"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500"
          >
            <p className="text-sm text-slate-500">Benchmarks</p>

            <h2 className="mt-2 text-2xl font-bold">
              {benchmarks.length}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Performance tests
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}