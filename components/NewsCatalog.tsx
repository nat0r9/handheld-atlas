"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface PublicNewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string;
  readingTime: number | null;
  isFeatured: boolean;
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

interface NewsCatalogProps {
  newsItems: PublicNewsItem[];
  databaseError: string | null;
}

type SortOption =
  | "Newest"
  | "Oldest"
  | "Title"
  | "Reading time";

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

export default function NewsCatalog({
  newsItems,
  databaseError,
}: NewsCatalogProps) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [authorFilter, setAuthorFilter] =
    useState("All");

  const [sortOption, setSortOption] =
    useState<SortOption>("Newest");

  const categoryOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          newsItems.map(
            (item) => item.category,
          ),
        ),
      ).sort(),
    ],
    [newsItems],
  );

  const authorOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          newsItems
            .map(
              (item) =>
                item.authorName,
            )
            .filter(Boolean),
        ),
      ).sort(),
    ],
    [newsItems],
  );

  const filteredNews = useMemo(() => {
    const normalizedQuery =
      searchQuery
        .trim()
        .toLowerCase();

    const matchingItems =
      newsItems.filter((item) => {
        const searchableText = [
          item.title,
          item.category,
          item.excerpt,
          item.authorName,
          item.relatedGame?.name ?? "",
          item.relatedHandheld?.name ?? "",
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
          item.category ===
            categoryFilter;

        const matchesAuthor =
          authorFilter === "All" ||
          item.authorName ===
            authorFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesAuthor
        );
      });

    return [...matchingItems].sort(
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
    newsItems,
    searchQuery,
    categoryFilter,
    authorFilter,
    sortOption,
  ]);

  const featuredArticle =
    filteredNews.find(
      (item) => item.isFeatured,
    ) ??
    filteredNews[0] ??
    null;

  const remainingArticles =
    featuredArticle
      ? filteredNews.filter(
          (item) =>
            item.id !== featuredArticle.id,
        )
      : [];

  const featuredCount =
    newsItems.filter(
      (item) => item.isFeatured,
    ).length;

  const categoryCount =
    new Set(
      newsItems.map(
        (item) => item.category,
      ),
    ).size;

  const averageReadingTime = (() => {
    const values = newsItems
      .map((item) => item.readingTime)
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
    authorFilter !== "All" ||
    sortOption !== "Newest";

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("All");
    setAuthorFilter("All");
    setSortOption("Newest");
  }

  return (
    <main className="atlas-page pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="atlas-section-label">
                Handheld newsroom
              </p>

              <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                Stories that matter.
                <span className="block">
                  Less algorithmic{" "}
                  <span className="atlas-text-red">
                    sludge.
                  </span>
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Hardware announcements, performance
                updates, game patches and editorial
                coverage for handheld players.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <HeroStat
                label="Published"
                value={newsItems.length.toString()}
              />

              <HeroStat
                label="Featured"
                value={featuredCount.toString()}
                highlighted
              />

              <HeroStat
                label="Categories"
                value={categoryCount.toString()}
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
              Could not load the news database.
            </p>

            <p className="mt-2 break-words">
              {databaseError}
            </p>
          </div>
        )}

        <section className="atlas-panel p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))_auto]">
            <div>
              <FilterLabel
                htmlFor="news-search"
                label="Search"
              />

              <div className="relative">
                <input
                  id="news-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search stories, games, devices or authors..."
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
              label="Author"
              value={authorFilter}
              options={authorOptions}
              onChange={setAuthorFilter}
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
                Published stories
              </p>

              <h2 className="mt-1 text-xl font-black">
                {filteredNews.length}{" "}
                {filteredNews.length === 1
                  ? "article"
                  : "articles"}
              </h2>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600">
              Live from the HandheldAtlas newsroom
            </p>
          </div>

          {filteredNews.length === 0 ? (
            <div className="atlas-panel mt-5 p-10 text-center">
              <p className="atlas-section-label">
                No matches
              </p>

              <h3 className="mt-3 text-3xl font-black">
                No stories found
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Change the filters or publish
                another article through the admin
                dashboard.
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
            <>
              {featuredArticle && (
                <section className="mt-5">
                  <Link
                    href={`/news/${featuredArticle.slug}`}
                    className="group block"
                  >
                    <article className="atlas-card atlas-noise atlas-card-hover relative min-h-[30rem] overflow-hidden">
                      {featuredArticle.coverImageUrl ? (
                        <Image
                          src={
                            featuredArticle.coverImageUrl
                          }
                          alt={
                            featuredArticle.title
                          }
                          fill
                          priority
                          sizes="100vw"
                          className="object-cover object-center transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(24,215,255,0.16),transparent_25%),radial-gradient(circle_at_30%_70%,rgba(239,35,60,0.18),transparent_30%),linear-gradient(135deg,#0b101b,#05070d)]" />
                      )}

                      <div className="absolute inset-0 bg-black/25" />

                      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                      <div className="relative flex min-h-[30rem] max-w-4xl flex-col justify-end p-6 md:p-10">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] text-red-400 backdrop-blur">
                            Featured
                          </span>

                          <span className="atlas-chip-cyan atlas-chip">
                            {
                              featuredArticle.category
                            }
                          </span>
                        </div>

                        <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.04em] md:text-6xl">
                          {
                            featuredArticle.title
                          }
                        </h2>

                        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                          {
                            featuredArticle.excerpt
                          }
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                          <span>
                            By{" "}
                            <strong className="text-slate-200">
                              {
                                featuredArticle.authorName
                              }
                            </strong>
                          </span>

                          <span>
                            {formatDate(
                              featuredArticle.publishedAt,
                            )}
                          </span>

                          {featuredArticle.readingTime !==
                            null && (
                            <span>
                              {
                                featuredArticle.readingTime
                              }{" "}
                              min read
                            </span>
                          )}
                        </div>

                        {(featuredArticle.relatedGame ||
                          featuredArticle.relatedHandheld) && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {featuredArticle.relatedGame && (
                              <span className="atlas-chip-green atlas-chip">
                                {
                                  featuredArticle.relatedGame
                                    .name
                                }
                              </span>
                            )}

                            {featuredArticle.relatedHandheld && (
                              <span className="atlas-chip-cyan atlas-chip">
                                {
                                  featuredArticle
                                    .relatedHandheld
                                    .name
                                }
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-7">
                          <span className="atlas-button-primary">
                            Read full story →
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </section>
              )}

              {remainingArticles.length > 0 && (
                <section className="mt-8">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-3">
                    <div>
                      <p className="atlas-section-label">
                        Latest coverage
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        More stories
                      </h2>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                      {
                        remainingArticles.length
                      }{" "}
                      more{" "}
                      {remainingArticles.length ===
                      1
                        ? "article"
                        : "articles"}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {remainingArticles.map(
                      (item) => (
                        <NewsCard
                          key={item.id}
                          item={item}
                        />
                      ),
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function NewsCard({
  item,
}: {
  item: PublicNewsItem;
}) {
  return (
    <Link
      href={`/news/${item.slug}`}
      className="group"
    >
      <article className="atlas-card atlas-card-hover atlas-card-cyan flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/[0.07]">
          {item.coverImageUrl ? (
            <Image
              src={item.coverImageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-center transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(24,215,255,0.15),transparent_30%),linear-gradient(135deg,#0b101b,#05070d)]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

          <div className="absolute left-3 top-3">
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-red-400 backdrop-blur">
              {item.category}
            </span>
          </div>

          {item.isFeatured && (
            <div className="absolute right-3 top-3">
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-yellow-300 backdrop-blur">
                Featured
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-2xl font-black leading-[1.05] transition group-hover:text-cyan-400">
            {item.title}
          </h3>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
            {item.excerpt}
          </p>

          {(item.relatedGame ||
            item.relatedHandheld) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.relatedGame && (
                <span className="atlas-chip-green atlas-chip">
                  {item.relatedGame.name}
                </span>
              )}

              {item.relatedHandheld && (
                <span className="atlas-chip-cyan atlas-chip">
                  {
                    item.relatedHandheld
                      .name
                  }
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/[0.07] pt-4">
            <div>
              <p className="text-xs font-black text-slate-300">
                {item.authorName}
              </p>

              <p className="mt-1 text-[0.62rem] text-slate-600">
                {formatDate(
                  item.publishedAt,
                )}
                {item.readingTime !== null
                  ? ` · ${item.readingTime} min`
                  : ""}
              </p>
            </div>

            <span className="text-xs font-black text-cyan-400 transition group-hover:text-white">
              Read →
            </span>
          </div>
        </div>
      </article>
    </Link>
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
  const id = `news-filter-${label
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