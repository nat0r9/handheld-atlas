"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicGame } from "../app/games/page";

type RatingFilter =
  | "All"
  | "Excellent"
  | "Great"
  | "Playable"
  | "Mixed";

interface GamesCatalogProps {
  games: PublicGame[];
  databaseError: string | null;
}

function getRatingData(score: number | null) {
  if (score === null) {
    return {
      label: "Unrated",
      badgeClass:
        "border-slate-500/30 bg-slate-500/15 text-slate-300",
      starCount: 0,
    };
  }

  if (score >= 90) {
    return {
      label: "Excellent",
      badgeClass:
        "border-green-400/30 bg-green-500/20 text-green-400",
      starCount: 5,
    };
  }

  if (score >= 85) {
    return {
      label: "Great",
      badgeClass:
        "border-cyan-400/30 bg-cyan-500/20 text-cyan-400",
      starCount: 4,
    };
  }

  if (score >= 75) {
    return {
      label: "Playable",
      badgeClass:
        "border-orange-400/30 bg-orange-500/20 text-orange-400",
      starCount: 3,
    };
  }

  return {
    label: "Mixed",
    badgeClass:
      "border-red-400/30 bg-red-500/20 text-red-400",
    starCount: 2,
  };
}

function renderStars(starCount: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span
      key={index}
      className={
        index < starCount
          ? "text-yellow-400"
          : "text-slate-700"
      }
    >
      ★
    </span>
  ));
}

export default function GamesCatalog({
  games,
  databaseError,
}: GamesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] =
    useState<RatingFilter>("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [handheldFilter, setHandheldFilter] = useState("All");
  const [tdpFilter, setTdpFilter] = useState("All");

  const genreOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(games.map((game) => game.genre)),
      ).sort(),
    ],
    [games],
  );

  const handheldOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          games
            .map((game) => game.bestHandheld)
            .filter(
              (value): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [games],
  );

  const tdpOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          games
            .map((game) => game.recommendedTdp)
            .filter(
              (value): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [games],
  );

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return games.filter((game) => {
      const rating = getRatingData(game.atlasScore);

      const searchableText = [
        game.name,
        game.genre,
        game.developer ?? "",
        game.bestHandheld ?? "",
        game.recommendedTdp ?? "",
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
        game.recommendedTdp === tdpFilter;

      return (
        matchesSearch &&
        matchesRating &&
        matchesGenre &&
        matchesHandheld &&
        matchesTdp
      );
    });
  }, [
    games,
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
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            HandheldAtlas Game Settings
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-5xl">
            Games
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Browse published games, Atlas Scores and recommended
            handheld settings.
          </p>

          {databaseError && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              <p className="font-black">
                Could not load the game database.
              </p>

              <p className="mt-2 break-words text-sm">
                {databaseError}
              </p>
            </div>
          )}

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
                  "Mixed",
                ]}
                onChange={(value) =>
                  setRatingFilter(value as RatingFilter)
                }
              />

              <FilterSelect
                label="Genre"
                value={genreFilter}
                options={genreOptions}
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

            <p className="text-sm text-slate-500">
              Loaded from HandheldAtlas database
            </p>
          </div>

          {filteredGames.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center">
              <h3 className="text-2xl font-black">
                No games found
              </h3>

              <p className="mt-3 text-slate-400">
                Try changing the active filters or publish a game
                from the admin dashboard.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filteredGames.map((game) => {
                const rating = getRatingData(game.atlasScore);

                return (
                  <Link
                    key={game.id}
                    href={`/games/${game.slug}`}
                    className="group"
                  >
                    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-slate-900 to-black">
                        {game.coverImageUrl ? (
                          <Image
                            src={game.coverImageUrl}
                            alt={game.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            className="object-cover object-center transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-6 text-center">
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-700">
                              Cover coming soon
                            </p>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                        <div className="absolute right-3 top-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide backdrop-blur ${rating.badgeClass}`}
                          >
                            {rating.label}
                          </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">
                            {game.genre}
                          </p>

                          <h3 className="mt-2 text-3xl font-black leading-tight">
                            {game.name}
                          </h3>

                          <p className="mt-2 text-sm text-slate-300">
                            {game.developer ?? "Unknown developer"}
                            {game.releaseYear
                              ? ` · ${game.releaseYear}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm text-slate-500">
                            Atlas Score
                          </p>

                          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-black text-cyan-400">
                            {game.atlasScore !== null
                              ? `${game.atlasScore}/100`
                              : "Unrated"}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-xl">
                          {renderStars(rating.starCount)}
                        </div>

                        <div className="mt-auto border-t border-slate-800 pt-4">
                          <div className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-slate-500">
                              Best Handheld
                            </span>

                            <span className="text-right font-bold text-slate-300">
                              {game.bestHandheld ?? "Not set"}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-500">
                              Recommended TDP
                            </span>

                            <span className="font-bold text-cyan-400">
                              {game.recommendedTdp ?? "Not set"}
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