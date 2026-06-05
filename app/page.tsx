"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { benchmarks } from "../data/benchmarks";
import { games } from "../data/games";
import { guides } from "../data/guides";
import { handhelds } from "../data/handhelds";
import { presets } from "../data/presets";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const gameResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return games
      .filter((game) => {
        const searchableText = [
          game.name,
          game.genre,
          game.developer,
          game.bestHandheld,
          game.recommendedTDP,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 4);
  }, [normalizedQuery]);

  const handheldResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return handhelds
      .filter((handheld) => {
        const searchableText = [
          handheld.name,
          handheld.manufacturer,
          handheld.processor,
          handheld.operatingSystem,
          handheld.tagline,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 4);
  }, [normalizedQuery]);

  const hasResults =
    gameResults.length > 0 || handheldResults.length > 0;

  const featuredGame = games[0];
  const featuredHandheld = handhelds[1] ?? handhelds[0];

  const latestPresets = presets.slice(0, 4);
  const featuredGuides = guides.slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.18),transparent_28%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(59,130,246,0.12),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[42rem] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">
              The Handheld Gaming Database
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              Find the best way to play anywhere.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
              Compare handhelds, discover verified presets, explore
              performance benchmarks and stop digging through random
              Reddit threads like a desperate digital archaeologist.
            </p>

            <div className="relative mt-10 max-w-2xl">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-3 shadow-2xl backdrop-blur">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search games, handhelds, presets..."
                  className="w-full rounded-xl bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {normalizedQuery.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                  {!hasResults ? (
                    <div className="p-6">
                      <h2 className="font-bold">
                        No results found
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        Try another game, handheld or manufacturer.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[34rem] overflow-y-auto">
                      {gameResults.length > 0 && (
                        <section className="border-b border-slate-800 p-3">
                          <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                            Games
                          </p>

                          {gameResults.map((game) => (
                            <Link
                              key={game.slug}
                              href={`/games/${game.slug}`}
                              className="flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-800"
                            >
                              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-950">
                                <Image
                                  src={game.coverImage}
                                  alt={game.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">
                                  {game.name}
                                </p>

                                <p className="mt-1 truncate text-sm text-slate-500">
                                  {game.genre} · {game.developer}
                                </p>
                              </div>

                              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-400">
                                {game.atlasScore}
                              </span>
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
                              className="flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-800"
                            >
                              <div className="relative h-14 w-20 shrink-0">
                                <Image
                                  src={handheld.image}
                                  alt={handheld.name}
                                  fill
                                  sizes="80px"
                                  className="object-contain"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">
                                  {handheld.name}
                                </p>

                                <p className="mt-1 truncate text-sm text-slate-500">
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

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/games"
                className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Browse games
              </Link>

              <Link
                href="/compare"
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-black text-white transition hover:border-cyan-500 hover:text-cyan-400"
              >
                Compare handhelds
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                Featured Handheld
              </p>

              <div className="relative mt-6 h-64 w-full">
                <Image
                  src={featuredHandheld.image}
                  alt={featuredHandheld.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.7)]"
                />
              </div>

              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    {featuredHandheld.manufacturer}
                  </p>

                  <h2 className="mt-2 text-4xl font-black">
                    {featuredHandheld.name}
                  </h2>
                </div>

                <span className="rounded-full border border-green-400/30 bg-green-500/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-400">
                  {featuredHandheld.status}
                </span>
              </div>

              <p className="mt-4 leading-7 text-slate-400">
                {featuredHandheld.tagline}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <QuickStat
                  label="Processor"
                  value={featuredHandheld.processor}
                />

                <QuickStat
                  label="Memory"
                  value={featuredHandheld.memory}
                />

                <QuickStat
                  label="Display"
                  value={featuredHandheld.displaySize}
                />

                <QuickStat
                  label="Battery"
                  value={featuredHandheld.battery}
                />
              </div>

              <Link
                href={`/handhelds/${featuredHandheld.slug}`}
                className="mt-6 inline-flex rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
              >
                View handheld profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Games"
            value={games.length}
            description="Game profiles"
            href="/games"
          />

          <StatCard
            label="Handhelds"
            value={handhelds.length}
            description="Supported devices"
            href="/handhelds"
          />

          <StatCard
            label="Presets"
            value={presets.length}
            description="Performance profiles"
            href="/presets"
          />

          <StatCard
            label="Benchmarks"
            value={benchmarks.length}
            description="Performance tests"
            href="/benchmarks"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Featured Game
            </p>

            <h2 className="mt-2 text-4xl font-black">
              Play smarter, not hotter
            </h2>
          </div>

          <Link
            href="/games"
            className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
          >
            Browse all games →
          </Link>
        </div>

        <Link
          href={`/games/${featuredGame.slug}`}
          className="group mt-8 block"
        >
          <article className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900">
            <div className="relative min-h-[30rem]">
              <Image
                src={featuredGame.coverImage}
                alt={featuredGame.name}
                fill
                sizes="100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />

              <div className="relative flex min-h-[30rem] max-w-3xl flex-col justify-end p-8 md:p-12">
                <span className="w-fit rounded-full bg-green-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                  Featured
                </span>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-slate-400">
                  {featuredGame.genre}
                </p>

                <h3 className="mt-3 text-5xl font-black md:text-7xl">
                  {featuredGame.name}
                </h3>

                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
                  {featuredGame.notes}
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <QuickMetric
                    label="Atlas Score"
                    value={`${featuredGame.atlasScore}/100`}
                  />

                  <QuickMetric
                    label="Best Handheld"
                    value={featuredGame.bestHandheld}
                  />

                  <QuickMetric
                    label="Recommended TDP"
                    value={featuredGame.recommendedTDP}
                  />
                </div>
              </div>
            </div>
          </article>
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Latest Profiles
            </p>

            <h2 className="mt-2 text-4xl font-black">
              Presets
            </h2>
          </div>

          <Link
            href="/presets"
            className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
          >
            Browse all presets →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {latestPresets.map((preset) => {
            const game = games.find(
              (item) => item.slug === preset.gameSlug,
            );

            const handheld = handhelds.find(
              (item) => item.slug === preset.handheldSlug,
            );

            return (
              <Link
                key={preset.id}
                href={`/games/${preset.gameSlug}`}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-cyan-500"
              >
                <p className="text-sm text-slate-500">
                  {game?.name ?? preset.gameSlug}
                </p>

                <h3 className="mt-2 text-xl font-black">
                  {preset.name}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  {handheld?.name ?? preset.handheldSlug}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <QuickStat
                    label="FPS"
                    value={`${preset.fpsAverage}`}
                  />

                  <QuickStat
                    label="TDP"
                    value={preset.tdp}
                  />

                  <QuickStat
                    label="Resolution"
                    value={preset.resolution}
                  />

                  <QuickStat
                    label="Rating"
                    value={`★ ${preset.communityRating}`}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Knowledge Base
            </p>

            <h2 className="mt-2 text-4xl font-black">
              Featured Guides
            </h2>
          </div>

          <Link
            href="/guides"
            className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
          >
            Browse all guides →
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featuredGuides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-400">
                  {guide.category}
                </span>

                <span className="text-xs text-slate-500">
                  {guide.readingTime}
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-black transition group-hover:text-cyan-400">
                {guide.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                {guide.excerpt}
              </p>

              <p className="mt-6 font-bold text-cyan-400">
                Read guide →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

interface QuickStatProps {
  label: string;
  value: string;
}

function QuickStat({ label, value }: QuickStatProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-200">{value}</p>
    </div>
  );
}

interface QuickMetricProps {
  label: string;
  value: string;
}

function QuickMetric({ label, value }: QuickMetricProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  href: string;
}

function StatCard({
  label,
  value,
  description,
  href,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-500"
    >
      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-4xl font-black">{value}</p>

      <p className="mt-2 text-sm text-slate-400">
        {description}
      </p>
    </Link>
  );
}