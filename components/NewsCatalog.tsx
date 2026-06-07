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

export default function NewsCatalog({
  newsItems,
  databaseError,
}: NewsCatalogProps) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

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

  const filteredNews = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return newsItems.filter((item) => {
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
        item.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    newsItems,
    searchQuery,
    categoryFilter,
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

  const hasActiveFilters =
    searchQuery.length > 0 ||
    categoryFilter !== "All";

  function resetFilters() {
    setSearchQuery("");
    setCategoryFilter("All");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <section className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
          <p className="text-center text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
            Latest Handheld Gaming Stories
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-6xl">
            News
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-slate-400">
            Hardware announcements, performance
            updates, game patches and the stories that
            actually matter to handheld players.
          </p>

          {databaseError && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              <p className="font-black">
                Could not load the news database.
              </p>

              <p className="mt-2 break-words text-sm">
                {databaseError}
              </p>
            </div>
          )}

          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr_auto]">
              <div>
                <label
                  htmlFor="news-search"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Search
                </label>

                <input
                  id="news-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search news, games, handhelds or authors..."
                  className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label
                  htmlFor="news-category"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Category
                </label>

                <select
                  id="news-category"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  {categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="self-end rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 font-black text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Showing {filteredNews.length}{" "}
                {filteredNews.length === 1
                  ? "article"
                  : "articles"}
              </p>

              <p className="text-sm text-slate-600">
                Published stories only
              </p>
            </div>
          </section>

          {filteredNews.length === 0 ? (
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center">
              <h2 className="text-2xl font-black">
                No news found
              </h2>

              <p className="mt-3 text-slate-400">
                Change the filters or publish a new
                article through the admin dashboard.
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
            </section>
          ) : (
            <>
              {featuredArticle && (
                <section className="mt-8">
                  <Link
                    href={`/news/${featuredArticle.slug}`}
                    className="group block"
                  >
                    <article className="relative min-h-[32rem] overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950">
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
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-black" />
                      )}

                      <div className="absolute inset-0 bg-black/30" />

                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                      <div className="relative flex min-h-[32rem] max-w-4xl flex-col justify-end p-7 md:p-12">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full border border-yellow-500/40 bg-yellow-500/20 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-300 backdrop-blur">
                            Featured
                          </span>

                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-300 backdrop-blur">
                            {
                              featuredArticle.category
                            }
                          </span>
                        </div>

                        <h2 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
                          {
                            featuredArticle.title
                          }
                        </h2>

                        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                          {
                            featuredArticle.excerpt
                          }
                        </p>

                        <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-400">
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

                        <div className="mt-7">
                          <span className="inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition group-hover:bg-cyan-400">
                            Read full story →
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </section>
              )}

              {remainingArticles.length > 0 && (
                <section className="mt-12">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                        Latest Stories
                      </p>

                      <h2 className="mt-2 text-3xl font-black">
                        More news
                      </h2>
                    </div>

                    <p className="text-sm text-slate-500">
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

                  <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
      <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
          {item.coverImageUrl ? (
            <Image
              src={item.coverImageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover object-center transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-2xl font-black text-slate-300">
                HandheldAtlas News
              </p>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          <span className="absolute left-4 top-4 rounded-full border border-cyan-500/30 bg-slate-950/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-400 backdrop-blur">
            {item.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-2xl font-black leading-tight transition group-hover:text-cyan-400">
            {item.title}
          </h3>

          <p className="mt-4 line-clamp-3 leading-7 text-slate-400">
            {item.excerpt}
          </p>

          {(item.relatedGame ||
            item.relatedHandheld) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {item.relatedGame && (
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                  {item.relatedGame.name}
                </span>
              )}

              {item.relatedHandheld && (
                <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400">
                  {
                    item.relatedHandheld
                      .name
                  }
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between gap-4 border-t border-slate-800 pt-6">
            <div>
              <p className="text-sm font-bold text-slate-300">
                {item.authorName}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                {formatDate(
                  item.publishedAt,
                )}
                {item.readingTime !== null
                  ? ` · ${item.readingTime} min`
                  : ""}
              </p>
            </div>

            <span className="font-black text-cyan-400">
              Read →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}