"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface PublicGuide {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  readingTime: number | null;
  difficulty: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;

  relatedGame: {
    name: string;
    slug: string;
  } | null;

  relatedHandheld: {
    name: string;
    slug: string;
  } | null;
}

interface GuidesCatalogProps {
  guides: PublicGuide[];
  databaseError: string | null;
}

function getDifficultyStyle(
  difficulty: string | null,
) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "border-green-400/30 bg-green-500/20 text-green-400";

    case "intermediate":
      return "border-orange-400/30 bg-orange-500/20 text-orange-400";

    case "advanced":
      return "border-red-400/30 bg-red-500/20 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/20 text-slate-300";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function GuidesCatalog({
  guides,
  databaseError,
}: GuidesCatalogProps) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [
    difficultyFilter,
    setDifficultyFilter,
  ] = useState("All");

  const [gameFilter, setGameFilter] =
    useState("All");

  const [
    handheldFilter,
    setHandheldFilter,
  ] = useState("All");

  const categoryOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          guides.map(
            (guide) => guide.category,
          ),
        ),
      ).sort(),
    ],
    [guides],
  );

  const difficultyOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          guides
            .map(
              (guide) =>
                guide.difficulty,
            )
            .filter(
              (
                difficulty,
              ): difficulty is string =>
                typeof difficulty ===
                  "string" &&
                difficulty.length > 0,
            ),
        ),
      ).sort(),
    ],
    [guides],
  );

  const gameOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          guides
            .map(
              (guide) =>
                guide.relatedGame?.name,
            )
            .filter(
              (name): name is string =>
                typeof name === "string" &&
                name.length > 0,
            ),
        ),
      ).sort(),
    ],
    [guides],
  );

  const handheldOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          guides
            .map(
              (guide) =>
                guide.relatedHandheld
                  ?.name,
            )
            .filter(
              (name): name is string =>
                typeof name === "string" &&
                name.length > 0,
            ),
        ),
      ).sort(),
    ],
    [guides],
  );

  const filteredGuides = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return guides.filter((guide) => {
      const searchableText = [
        guide.title,
        guide.category,
        guide.excerpt,
        guide.difficulty ?? "",
        guide.relatedGame?.name ?? "",
        guide.relatedHandheld?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableText.includes(
          normalizedQuery,
        );

      const matchesCategory =
        categoryFilter === "All" ||
        guide.category === categoryFilter;

      const matchesDifficulty =
        difficultyFilter === "All" ||
        guide.difficulty ===
          difficultyFilter;

      const matchesGame =
        gameFilter === "All" ||
        guide.relatedGame?.name ===
          gameFilter;

      const matchesHandheld =
        handheldFilter === "All" ||
        guide.relatedHandheld?.name ===
          handheldFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty &&
        matchesGame &&
        matchesHandheld
      );
    });
  }, [
    guides,
    searchQuery,
    categoryFilter,
    difficultyFilter,
    gameFilter,
    handheldFilter,
  ]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    categoryFilter !== "All" ||
    difficultyFilter !== "All" ||
    gameFilter !== "All" ||
    handheldFilter !== "All";

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("All");
    setDifficultyFilter("All");
    setGameFilter("All");
    setHandheldFilter("All");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <section className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
          <p className="text-center text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
            Handheld Knowledge Base
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-5xl">
            Guides
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-slate-400">
            Optimization guides, setup tutorials,
            troubleshooting and practical handheld
            gaming knowledge without the usual
            algorithm-fed bullshit.
          </p>

          {databaseError && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              <p className="font-black">
                Could not load the guide database.
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
                  htmlFor="guide-search"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Search
                </label>

                <input
                  id="guide-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search guides, games, handhelds..."
                  className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <FilterSelect
                label="Category"
                value={categoryFilter}
                options={categoryOptions}
                onChange={setCategoryFilter}
              />

              <FilterSelect
                label="Difficulty"
                value={difficultyFilter}
                options={difficultyOptions}
                onChange={setDifficultyFilter}
              />

              <FilterSelect
                label="Game"
                value={gameFilter}
                options={gameOptions}
                onChange={setGameFilter}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <FilterSelect
                label="Handheld"
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
              {filteredGuides.length}{" "}
              {filteredGuides.length === 1
                ? "Guide"
                : "Guides"}
            </h2>

            <p className="text-sm text-slate-500">
              Published knowledge from
              HandheldAtlas
            </p>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center">
              <h2 className="text-2xl font-black">
                No guides found
              </h2>

              <p className="mt-3 text-slate-400">
                Change the filters or publish a guide
                through the admin dashboard.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="group"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                    <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
                      {guide.coverImageUrl ? (
                        <Image
                          src={guide.coverImageUrl}
                          alt={guide.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover object-center transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-8 text-center">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                              {guide.category}
                            </p>

                            <p className="mt-4 text-2xl font-black text-slate-300">
                              HandheldAtlas Guide
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                      <div className="absolute left-4 top-4">
                        <span className="rounded-full border border-cyan-500/30 bg-slate-950/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-400 backdrop-blur">
                          {guide.category}
                        </span>
                      </div>

                      <div className="absolute right-4 top-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide backdrop-blur ${getDifficultyStyle(
                            guide.difficulty,
                          )}`}
                        >
                          {guide.difficulty ??
                            "Guide"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-2xl font-black leading-tight transition group-hover:text-cyan-400">
                        {guide.title}
                      </h2>

                      <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
                        {guide.excerpt}
                      </p>

                      {(guide.relatedGame ||
                        guide.relatedHandheld) && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {guide.relatedGame && (
                            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                              {
                                guide
                                  .relatedGame
                                  .name
                              }
                            </span>
                          )}

                          {guide.relatedHandheld && (
                            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400">
                              {
                                guide
                                  .relatedHandheld
                                  .name
                              }
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-800 pt-6">
                        <div>
                          <p className="text-sm font-bold text-slate-300">
                            {guide.readingTime !==
                            null
                              ? `${guide.readingTime} min read`
                              : "Reading time not set"}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            {formatDate(
                              guide.publishedAt,
                            )}
                          </p>
                        </div>

                        <span className="font-black text-cyan-400">
                          Read guide →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}