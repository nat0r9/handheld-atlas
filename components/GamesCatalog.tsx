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
  | "Mixed"
  | "Unrated";

type SortOption = "Score" | "Name" | "Newest" | "Oldest";

interface GamesCatalogProps {
  games: PublicGame[];
  databaseError: string | null;
}

interface RatingData {
  label: "Excellent" | "Great" | "Playable" | "Mixed" | "Unrated";
  className: string;
  scoreClassName: string;
}

function getRatingData(score: number | null): RatingData {
  if (score === null) {
    return {
      label: "Unrated",
      className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
      scoreClassName: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    };
  }

  if (score >= 90) {
    return {
      label: "Excellent",
      className: "border-green-500/30 bg-green-500/10 text-green-400",
      scoreClassName: "border-green-500/30 bg-green-500/15 text-green-300",
    };
  }

  if (score >= 85) {
    return {
      label: "Great",
      className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
      scoreClassName: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
    };
  }

  if (score >= 75) {
    return {
      label: "Playable",
      className: "border-orange-500/30 bg-orange-500/10 text-orange-400",
      scoreClassName: "border-orange-500/30 bg-orange-500/15 text-orange-300",
    };
  }

  return {
    label: "Mixed",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    scoreClassName: "border-red-500/30 bg-red-500/15 text-red-300",
  };
}

function getScoreWidth(score: number | null) {
  return score === null ? 0 : Math.max(0, Math.min(100, score));
}

export default function GamesCatalog({ games, databaseError }: GamesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>("Score");

  const genreOptions = useMemo(
    () => ["All", ...Array.from(new Set(games.map((game) => game.genre).filter(Boolean))).sort()],
    [games],
  );

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchingGames = games.filter((game) => {
      const rating = getRatingData(game.atlasScore);
      const searchableText = [
        game.name,
        game.genre,
        game.developer ?? "",
        game.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        (normalizedQuery.length === 0 || searchableText.includes(normalizedQuery)) &&
        (ratingFilter === "All" || rating.label === ratingFilter) &&
        (genreFilter === "All" || game.genre === genreFilter)
      );
    });

    return [...matchingGames].sort((first, second) => {
      switch (sortOption) {
        case "Name":
          return first.name.localeCompare(second.name);
        case "Newest":
          return (second.releaseYear ?? 0) - (first.releaseYear ?? 0);
        case "Oldest":
          return (
            (first.releaseYear ?? Number.MAX_SAFE_INTEGER) -
            (second.releaseYear ?? Number.MAX_SAFE_INTEGER)
          );
        default:
          return (second.atlasScore ?? -1) - (first.atlasScore ?? -1);
      }
    });
  }, [
    games,
    searchQuery,
    ratingFilter,
    genreFilter,
    sortOption,
  ]);

  const ratedGames = games.filter((game) => game.atlasScore !== null);
  const averageScore =
    ratedGames.length > 0
      ? Math.round(
          ratedGames.reduce((total, game) => total + (game.atlasScore ?? 0), 0) /
            ratedGames.length,
        )
      : null;
  const excellentGames = games.filter((game) => (game.atlasScore ?? 0) >= 90).length;

  const hasActiveFilters =
    searchQuery.length > 0 ||
    ratingFilter !== "All" ||
    genreFilter !== "All" ||
    sortOption !== "Score";

  function resetFilters() {
    setSearchQuery("");
    setRatingFilter("All");
    setGenreFilter("All");
    setSortOption("Score");
  }

  return (
    <main className="atlas-page overflow-x-hidden pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-8 sm:py-12">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="atlas-section-label">Game database</p>

              <h1 className="mt-4 text-4xl font-black leading-[0.94] tracking-[-0.055em] min-[390px]:text-[2.7rem] sm:text-6xl">
                Find the best way
                <span className="block">
                  to play <span className="atlas-text-red">every game.</span>
                </span>
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:leading-8">
                Browse published games, Atlas Scores and recommended handheld settings backed by live
                database data.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <HeroStat label="Published" value={games.length.toString()} />
              <HeroStat
                label="Average score"
                value={averageScore !== null ? averageScore.toString() : "—"}
                highlighted
              />
              <HeroStat label="Excellent" value={excellentGames.toString()} />
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-5 sm:pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">Could not load the game database.</p>
            <p className="mt-2 break-words">{databaseError}</p>
          </div>
        )}

        <section className="atlas-panel p-4 md:p-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-[1.7fr_repeat(5,minmax(0,1fr))_auto]">
            <div className="col-span-2 xl:col-span-1">
              <FilterLabel htmlFor="game-search" label="Search" />
              <div className="relative">
                <input
                  id="game-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search games, studios, devices..."
                  className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3 pr-10 text-sm"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <SearchIcon />
                </span>
              </div>
            </div>

            <FilterSelect
              label="Rating"
              value={ratingFilter}
              options={["All", "Excellent", "Great", "Playable", "Mixed", "Unrated"]}
              onChange={(value) => setRatingFilter(value as RatingFilter)}
            />
            <FilterSelect label="Genre" value={genreFilter} options={genreOptions} onChange={setGenreFilter} />
            <FilterSelect
              label="Sort"
              value={sortOption}
              options={["Score", "Name", "Newest", "Oldest"]}
              onChange={(value) => setSortOption(value as SortOption)}
            />

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="atlas-button-primary col-span-2 mt-1 w-full self-end xl:col-span-1 xl:mt-0 xl:w-auto disabled:cursor-not-allowed disabled:opacity-35"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div>
              <p className="atlas-section-label">Published library</p>
              <h2 className="mt-1 text-xl font-black">
                {filteredGames.length} {filteredGames.length === 1 ? "game" : "games"}
              </h2>
            </div>

            <p className="w-full text-[0.58rem] font-bold uppercase tracking-[0.13em] text-slate-600 sm:w-auto sm:text-xs sm:tracking-[0.15em]">
              Live from HandheldAtlas database
            </p>
          </div>

          {filteredGames.length === 0 ? (
            <div className="atlas-panel mt-5 p-10 text-center">
              <p className="atlas-section-label">No matches</p>
              <h3 className="mt-3 text-3xl font-black">No games found</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Change the filters or publish another game through the admin dashboard.
              </p>
              {hasActiveFilters && (
                <button type="button" onClick={resetFilters} className="atlas-button-primary mt-6">
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredGames.map((game) => {
                const rating = getRatingData(game.atlasScore);
                const scoreWidth = getScoreWidth(game.atlasScore);

                return (
                  <Link key={game.id} href={`/games/${game.slug}`} className="group min-w-0">
                    <article className="atlas-card atlas-card-hover flex h-full min-w-0 flex-col">
                      <div className="relative aspect-[16/11] overflow-hidden sm:aspect-[4/5]">
                        {game.coverImageUrl ? (
                          <Image
                            src={game.coverImageUrl}
                            alt={game.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                            className="object-cover object-center transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-950 to-black" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />

                        <div className="absolute left-3 top-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] backdrop-blur ${rating.className}`}
                          >
                            {rating.label}
                          </span>
                        </div>

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
                        <div>
                          <div className="flex items-center justify-between text-[0.58rem] font-black uppercase tracking-[0.12em] text-slate-600 sm:text-[0.62rem]">
                            <span>Compatibility</span>
                            <span>{game.atlasScore !== null ? `${game.atlasScore}%` : "Unrated"}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-cyan-400 transition-all duration-500"
                              style={{ width: `${scoreWidth}%` }}
                            />
                          </div>
                        </div>


                        <p className="mt-auto pt-4 text-xs font-black text-cyan-400 transition group-hover:text-white">
                          Open game profile →
                        </p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function HeroStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`min-w-0 rounded-xl border p-3 sm:p-4 ${
        highlighted ? "border-red-500/30 bg-red-500/10" : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[0.45rem] font-black uppercase leading-tight tracking-[0.1em] text-slate-600 sm:text-[0.52rem] sm:tracking-[0.14em]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black sm:text-3xl ${highlighted ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
    </article>
  );
}

function FilterLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-600 sm:text-[0.58rem] sm:tracking-[0.15em]"
    >
      {label}
    </label>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const id = `filter-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <div className="min-w-0">
      <FilterLabel htmlFor={id} label={label} />
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-lg border border-white/[0.08] bg-black/30 px-3 py-3 text-sm"
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

function InfoTile({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border p-3 ${
        highlighted ? "border-red-500/25 bg-red-500/[0.07]" : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">{label}</p>
      <p
        className={`mt-1 line-clamp-2 break-words text-xs font-black leading-5 ${
          highlighted ? "text-red-400" : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
