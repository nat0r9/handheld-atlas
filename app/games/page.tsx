"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { games } from "../../data/games";

function getRatingLabel(score: number) {
  if (score >= 90) {
    return {
      label: "Excellent",
      badgeClass: "bg-green-500 text-white",
      starCount: 5,
    };
  }

  if (score >= 85) {
    return {
      label: "Great",
      badgeClass: "bg-cyan-500 text-slate-950",
      starCount: 4,
    };
  }

  if (score >= 75) {
    return {
      label: "Playable",
      badgeClass: "bg-orange-500 text-white",
      starCount: 3,
    };
  }

  return {
    label: "Mixed",
    badgeClass: "bg-red-500 text-white",
    starCount: 2,
  };
}

function renderStars(starCount: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const isFilled = index < starCount;

    return (
      <span
        key={index}
        className={isFilled ? "text-yellow-400" : "text-slate-600"}
      >
        ★
      </span>
    );
  });
}

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return games;
    }

    return games.filter((game) => {
      const searchableText = [
        game.name,
        game.genre,
        game.developer,
        game.bestHandheld,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            HandheldAtlas Game Settings
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-5xl">
            Games
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Browse supported games, ratings and recommended handheld
            settings in a cleaner poster-style database.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:col-span-2">
              <label
                htmlFor="game-search"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Search
              </label>

              <input
                id="game-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search games, developers, genres..."
                className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Results
              </p>

              <div className="flex h-[52px] items-center rounded-xl border border-slate-800 bg-black/40 px-4 text-lg font-bold text-cyan-400">
                {filteredGames.length} games
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="font-bold uppercase tracking-[0.15em] text-slate-500">
              Quick filters:
            </span>

            <span className="rounded-full border border-slate-700 px-3 py-1">
              Best games
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Great games
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              RPG
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              ARPG
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Steam Deck
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              ROG Ally X
            </span>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            <h2 className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-white">
              {filteredGames.length} Game Settings
            </h2>
          </div>

          {filteredGames.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center">
              <h3 className="text-2xl font-black">No games found</h3>

              <p className="mt-3 text-slate-400">
                Try another search query.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredGames.map((game) => {
                const rating = getRatingLabel(game.atlasScore);

                return (
                  <Link
                    key={game.slug}
                    href={`/games/${game.slug}`}
                    className="group"
                  >
                    <article className="overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                      <div className="relative aspect-[3/4] overflow-hidden bg-slate-900">
                        <Image
                          src={game.coverImage}
                          alt={game.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        <div className="absolute right-3 top-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide shadow-lg ${rating.badgeClass}`}
                          >
                            {rating.label}
                          </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                            {game.genre}
                          </p>

                          <h3 className="mt-2 text-3xl font-black leading-tight text-white">
                            {game.name}
                          </h3>

                          <p className="mt-2 text-sm text-slate-300">
                            {game.developer} · {game.releaseYear}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-950 px-4 pb-4 pt-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Atlas Score
                          </p>

                          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-black text-cyan-400">
                            {game.atlasScore}/100
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-xl">
                          {renderStars(rating.starCount)}
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}