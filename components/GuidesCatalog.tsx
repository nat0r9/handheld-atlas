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

type SortOption =
  | "Newest"
  | "Oldest"
  | "Title"
  | "Reading time";

function getDifficultyStyle(
  difficulty: string | null,
) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "intermediate":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "advanced":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "Recently published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently published";
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

  const [sortOption, setSortOption] =
    useState<SortOption>("Newest");

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

    const matchingGuides =
      guides.filter((guide) => {
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
          guide.category ===
            categoryFilter;

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

    return [...matchingGuides].sort(
      (first, second) => {
        switch (sortOption) {
          case "Oldest":
            return (
              new Date(
                first.publishedAt ?? 0,
              ).getTime() -
              new Date(
                second.publishedAt ?? 0,
              ).getTime()
            );

          case "Title":
            return first.title.localeCompare(
              second.title,
            );

          case "Reading time":
            return (
              (second.readingTime ?? 0) -
              (first.readingTime ?? 0)
            );

          default:
            return (
              new Date(
                second.publishedAt ?? 0,
              ).getTime() -
              new Date(
                first.publishedAt ?? 0,
              ).getTime()
            );
        }
      },
    );
  }, [
    guides,
    searchQuery,
    categoryFilter,
    difficultyFilter,
    gameFilter,
    handheldFilter,
    sortOption,
  ]);

  const beginnerGuides =
    guides.filter(
      (guide) =>
        guide.difficulty?.toLowerCase() ===
        "beginner",
    ).length;

  const advancedGuides =
    guides.filter(
      (guide) =>
        guide.difficulty?.toLowerCase() ===
        "advanced",
    ).length;

  const averageReadingTime = (() => {
    const values = guides
      .map((guide) => guide.readingTime)
      .filter(
        (value): value is number =>
          typeof value === "number",
      );

    if (values.length === 0) {
      return null;
    }

    return Math.round(
      values.reduce(
        (total, value) =>
          total + value,
        0,
      ) / values.length,
    );
  })();

  const hasActiveFilters =
    searchQuery.length > 0 ||
    categoryFilter !== "All" ||
    difficultyFilter !== "All" ||
    gameFilter !== "All" ||
    handheldFilter !== "All" ||
    sortOption !== "Newest";

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("All");
    setDifficultyFilter("All");
    setGameFilter("All");
    setHandheldFilter("All");
    setSortOption("Newest");
  }

  return (
    <main className="atlas-page pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="atlas-section-label">
                Knowledge base
              </p>

              <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                Learn faster.
                <span className="block">
                  Fix the{" "}
                  <span className="atlas-text-red">
                    bullshit.
                  </span>
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Optimization, setup,
                troubleshooting and handheld
                gaming guides written for people
                who actually want to solve the
                problem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <HeroStat
                label="Published"
                value={guides.length.toString()}
              />

              <HeroStat
                label="Beginner"
                value={beginnerGuides.toString()}
                highlighted
              />

              <HeroStat
                label="Advanced"
                value={advancedGuides.toString()}
              />

              <HeroStat
                label="Avg read"
                value={
                  averageReadingTime !== null
                    ? `${averageReadingTime}m`
                    : "—"
                }
              />
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">
              Could not load the guide database.
            </p>

            <p className="mt-2 break-words">
              {databaseError}
            </p>
          </div>
        )}

        <section className="atlas-panel p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.8fr_repeat(5,minmax(0,1fr))_auto]">
            <div>
              <FilterLabel
                htmlFor="guide-search"
                label="Search"
              />

              <div className="relative">
                <input
                  id="guide-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search guides, devices, games or issues..."
                  className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3 pr-10 text-sm"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <SearchIcon />
                </span>
              </div>
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
              onChange={
                setDifficultyFilter
              }
            />

            <FilterSelect
              label="Game"
              value={gameFilter}
              options={gameOptions}
              onChange={setGameFilter}
            />

            <FilterSelect
              label="Handheld"
              value={handheldFilter}
              options={handheldOptions}
              onChange={
                setHandheldFilter
              }
            />

            <FilterSelect
              label="Sort"
              value={sortOption}
              options={[
                "Newest",
                "Oldest",
                "Title",
                "Reading time",
              ]}
              onChange={(value) =>
                setSortOption(
                  value as SortOption,
                )
              }
            />

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="atlas-button-primary self-end whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-35"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-3">
            <div>
              <p className="atlas-section-label">
                Published knowledge
              </p>

              <h2 className="mt-1 text-xl font-black">
                {filteredGuides.length}{" "}
                {filteredGuides.length === 1
                  ? "guide"
                  : "guides"}
              </h2>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600">
              Live from HandheldAtlas
            </p>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="atlas-panel mt-5 p-10 text-center">
              <p className="atlas-section-label">
                No matches
              </p>

              <h3 className="mt-3 text-3xl font-black">
                No guides found
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Change the filters or
                publish another guide through
                the admin dashboard.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="atlas-button-primary mt-6"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredGuides.map(
                (guide) => (
                  <Link
                    key={guide.id}
                    href={`/guides/${guide.slug}`}
                    className="group"
                  >
                    <article className="atlas-card atlas-card-hover atlas-card-cyan flex h-full flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.07]">
                        {guide.coverImageUrl ? (
                          <Image
                            src={
                              guide.coverImageUrl
                            }
                            alt={guide.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover object-center transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(24,215,255,0.16),transparent_30%),linear-gradient(135deg,#0b101b,#05070d)]" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />

                        <div className="absolute left-3 top-3">
                          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-red-400 backdrop-blur">
                            {guide.category}
                          </span>
                        </div>

                        <div className="absolute right-3 top-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] backdrop-blur ${getDifficultyStyle(
                              guide.difficulty,
                            )}`}
                          >
                            {guide.difficulty ??
                              "Guide"}
                          </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <h3 className="line-clamp-2 text-2xl font-black leading-[1.05]">
                            {guide.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                          {guide.excerpt}
                        </p>

                        {(guide.relatedGame ||
                          guide.relatedHandheld) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {guide.relatedGame && (
                              <span className="atlas-chip-green atlas-chip">
                                {
                                  guide.relatedGame
                                    .name
                                }
                              </span>
                            )}

                            {guide.relatedHandheld && (
                              <span className="atlas-chip-cyan atlas-chip">
                                {
                                  guide
                                    .relatedHandheld
                                    .name
                                }
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/[0.07] pt-4">
                          <div>
                            <p className="text-xs font-black text-slate-300">
                              {guide.readingTime !==
                              null
                                ? `${guide.readingTime} min read`
                                : "Reading time not set"}
                            </p>

                            <p className="mt-1 text-[0.62rem] text-slate-600">
                              {formatDate(
                                guide.publishedAt,
                              )}
                            </p>
                          </div>

                          <span className="text-xs font-black text-cyan-400 transition group-hover:text-white">
                            Read guide →
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ),
              )}
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
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
          highlighted
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function FilterLabel({
  htmlFor,
  label,
}: {
  htmlFor: string;
  label: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.15em] text-slate-600"
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  const id = `guide-filter-${label
    .toLowerCase()
    .replaceAll(" ", "-")}`;

  return (
    <div>
      <FilterLabel
        htmlFor={id}
        label={label}
      />

      <select
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 py-3 text-sm"
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
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}