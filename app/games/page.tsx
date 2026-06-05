"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { games } from "../../data/games";

type RatingFilter = "All" | "Excellent" | "Great" | "Playable";
type GenreFilter = "All" | string;
type HandheldFilter = "All" | string;
type TdpFilter = "All" | string;

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
  const [ratingFilter, setRatingFilter] =
    useState<RatingFilter>("All");
  const [genreFilter, setGenreFilter] =
    useState<GenreFilter>("All");
  const [handheldFilter, setHandheldFilter] =
    useState<HandheldFilter>("All");
  const [tdpFilter, setTdpFilter] =
    useState<TdpFilter>("All");

  const genres = useMemo(
    () => ["All", ...Array.from(new Set(games.map((game) => game.genre)))],
    [],
  );

  const handheldOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(games.map((game) => game.bestHandheld)),
      ),
    ],
    [],
  );

  const tdpOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(games.map((game) => game.recommendedTDP)),
      ),
    ],
    [],
  );

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return games.filter((game) => {
      const rating = getRatingLabel(game.atlasScore);

      const searchableText = [
        game.name,
        game.genre,
        game.developer,
        game.bestHandheld,
        game.recommendedTDP,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      const matchesRating =
        ratingFilter === "All" ||
        rating.label === ratingFilter;

      const matchesGenre =
        genreFilter === "All" ||
        game.genre === genreFilter;

      const matchesHandheld =
        handheldFilter === "All" ||
        game.bestHandheld === handheldFilter;

      const matchesTdp =
        tdpFilter === "All" ||
        game.recommendedTDP === tdpFilter;

      return (
        matchesSearch &&
        matchesRating &&
        matchesGenre &&
        matchesHandheld &&
        matchesTdp
      );
    });
  }, [
    searchQuery,
    ratingFilter,
    genreFilter,
    handheldFilter,
    tdpFilter,
  ]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    ratingFilter !== "All" ||
    genreFilter !== "All" ||
    handheldFilter !== "All" ||
    tdpFilter !== "All";

  function resetFilters() {
    setSearchQuery("");
    setRatingFilter("All");
    setGenreFilter("All");
    setHandheldFilter("All");
    setTdpFilter("All");
  }

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
            settings.
          </p>

          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
              <div className="xl:col-span-2">
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
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search games, developers, handhelds..."
                  className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <FilterSelect
                label="Rating"
                value={ratingFilter}
                options={[
                  "All",
                  "Excellent",
                  "Great",
                  "Playable",
                ]}
                onChange={(value) =>
                  setRatingFilter(value as RatingFilter)
                }
              />

              <FilterSelect
                label="Genre"
                value={genreFilter}
                options={genres}
                onChange={setGenreFilter}
              />

              <FilterSelect
                label="TDP"
                value={tdpFilter}
                options={tdpOptions}
                onChange={setTdpFilter}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <FilterSelect
                label="Best Handheld"
                value={handheldFilter}
                options={handheldOptions}
                onChange={setHandheldFilter}
              />

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="self-end rounded-xl bg-red-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset Filters
              </button>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-black uppercase tracking-[0.18em]">
              {filteredGames.length}{" "}
              {filteredGames.length === 1 ? "Game" : "Games"}
            </h2>

            {hasActiveFilters && (
              <p className="text-sm text-slate-500">
                Filters active
              </p>
            )}
          </div>

          {filteredGames.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center">
              <h3 className="text-2xl font-black">
                No games found
              </h3>

              <p className="mt-3 text-slate-400">
                Try changing or resetting the active filters.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Reset filters
              </button>
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

                        <div className="mt-4 border-t border-slate-800 pt-4">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-500">
                              Best Handheld
                            </span>

                            <span className="text-right font-bold text-slate-300">
                              {game.bestHandheld}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-500">
                              Recommended TDP
                            </span>

                            <span className="font-bold text-cyan-400">
                              {game.recommendedTDP}
                            </span>
                          </div>
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

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}