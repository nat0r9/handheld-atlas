"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface PublicBenchmark {
  id: string;
  resolution: string | null;
  tdp: string | null;
  averageFps: number | null;
  onePercentLow: number | null;
  batteryLife: string | null;
  testNotes: string | null;
  publishedAt: string | null;

  game: {
    name: string;
    slug: string;
  } | null;

  handheld: {
    name: string;
    slug: string;
    manufacturer: string;
  } | null;

  preset: {
    id: string;
    name: string;
    preset_type: string;
  } | null;
}

interface BenchmarksCatalogProps {
  benchmarks: PublicBenchmark[];
  databaseError: string | null;
}

type FpsFilter =
  | "All"
  | "30+ FPS"
  | "45+ FPS"
  | "60+ FPS"
  | "90+ FPS";

const fpsFilters: FpsFilter[] = [
  "All",
  "30+ FPS",
  "45+ FPS",
  "60+ FPS",
  "90+ FPS",
];

function getMinimumFps(filter: FpsFilter) {
  switch (filter) {
    case "30+ FPS":
      return 30;

    case "45+ FPS":
      return 45;

    case "60+ FPS":
      return 60;

    case "90+ FPS":
      return 90;

    default:
      return null;
  }
}

function getFpsStyle(fps: number | null) {
  if (fps === null) {
    return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }

  if (fps >= 90) {
    return "border-purple-500/30 bg-purple-500/15 text-purple-400";
  }

  if (fps >= 60) {
    return "border-green-500/30 bg-green-500/15 text-green-400";
  }

  if (fps >= 45) {
    return "border-cyan-500/30 bg-cyan-500/15 text-cyan-400";
  }

  if (fps >= 30) {
    return "border-orange-500/30 bg-orange-500/15 text-orange-400";
  }

  return "border-red-500/30 bg-red-500/15 text-red-400";
}

function formatPublishedDate(value: string | null) {
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

export default function BenchmarksCatalog({
  benchmarks,
  databaseError,
}: BenchmarksCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gameFilter, setGameFilter] = useState("All");
  const [handheldFilter, setHandheldFilter] =
    useState("All");
  const [tdpFilter, setTdpFilter] = useState("All");
  const [fpsFilter, setFpsFilter] =
    useState<FpsFilter>("All");
  const [expandedBenchmarkIds, setExpandedBenchmarkIds] =
    useState<string[]>([]);

  const gameOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          benchmarks
            .map((benchmark) => benchmark.game?.name)
            .filter(
              (value): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [benchmarks],
  );

  const handheldOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          benchmarks
            .map(
              (benchmark) =>
                benchmark.handheld?.name,
            )
            .filter(
              (value): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [benchmarks],
  );

  const tdpOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          benchmarks
            .map((benchmark) => benchmark.tdp)
            .filter(
              (value): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [benchmarks],
  );

  const filteredBenchmarks = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    const minimumFps = getMinimumFps(fpsFilter);

    return benchmarks.filter((benchmark) => {
      const searchableText = [
        benchmark.game?.name ?? "",
        benchmark.handheld?.name ?? "",
        benchmark.handheld?.manufacturer ?? "",
        benchmark.preset?.name ?? "",
        benchmark.preset?.preset_type ?? "",
        benchmark.resolution ?? "",
        benchmark.tdp ?? "",
        benchmark.batteryLife ?? "",
        benchmark.testNotes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      const matchesGame =
        gameFilter === "All" ||
        benchmark.game?.name === gameFilter;

      const matchesHandheld =
        handheldFilter === "All" ||
        benchmark.handheld?.name ===
          handheldFilter;

      const matchesTdp =
        tdpFilter === "All" ||
        benchmark.tdp === tdpFilter;

      const matchesFps =
        minimumFps === null ||
        (benchmark.averageFps !== null &&
          benchmark.averageFps >= minimumFps);

      return (
        matchesSearch &&
        matchesGame &&
        matchesHandheld &&
        matchesTdp &&
        matchesFps
      );
    });
  }, [
    benchmarks,
    searchQuery,
    gameFilter,
    handheldFilter,
    tdpFilter,
    fpsFilter,
  ]);

  const averageFpsAcrossResults = useMemo(() => {
    const validResults = filteredBenchmarks
      .map((benchmark) => benchmark.averageFps)
      .filter(
        (fps): fps is number =>
          typeof fps === "number",
      );

    if (validResults.length === 0) {
      return null;
    }

    const total = validResults.reduce(
      (sum, fps) => sum + fps,
      0,
    );

    return total / validResults.length;
  }, [filteredBenchmarks]);

  const highestFpsBenchmark = useMemo(() => {
    return filteredBenchmarks.reduce<
      PublicBenchmark | null
    >((currentBest, benchmark) => {
      if (benchmark.averageFps === null) {
        return currentBest;
      }

      if (
        !currentBest ||
        currentBest.averageFps === null ||
        benchmark.averageFps >
          currentBest.averageFps
      ) {
        return benchmark;
      }

      return currentBest;
    }, null);
  }, [filteredBenchmarks]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    gameFilter !== "All" ||
    handheldFilter !== "All" ||
    tdpFilter !== "All" ||
    fpsFilter !== "All";

  function resetFilters() {
    setSearchQuery("");
    setGameFilter("All");
    setHandheldFilter("All");
    setTdpFilter("All");
    setFpsFilter("All");
  }

  function toggleBenchmark(benchmarkId: string) {
    setExpandedBenchmarkIds((currentIds) =>
      currentIds.includes(benchmarkId)
        ? currentIds.filter(
            (id) => id !== benchmarkId,
          )
        : [...currentIds, benchmarkId],
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <section className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Verified Performance Data
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-5xl">
            Benchmarks
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-slate-400">
            Compare tested handheld performance by game,
            device, resolution, TDP and linked preset.
          </p>

          {databaseError && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              <p className="font-black">
                Could not load the benchmark database.
              </p>

              <p className="mt-2 break-words text-sm">
                {databaseError}
              </p>
            </div>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="Visible results"
              value={String(
                filteredBenchmarks.length,
              )}
            />

            <SummaryCard
              label="Average performance"
              value={
                averageFpsAcrossResults !== null
                  ? `${averageFpsAcrossResults.toFixed(
                      1,
                    )} FPS`
                  : "No data"
              }
              highlighted
            />

            <SummaryCard
              label="Highest result"
              value={
                highestFpsBenchmark?.averageFps !==
                null &&
                highestFpsBenchmark?.averageFps !==
                  undefined
                  ? `${highestFpsBenchmark.averageFps} FPS`
                  : "No data"
              }
              description={
                highestFpsBenchmark
                  ? `${highestFpsBenchmark.game?.name ?? "Unknown game"} · ${
                      highestFpsBenchmark.handheld?.name ??
                      "Unknown handheld"
                    }`
                  : undefined
              }
            />
          </div>

          <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
              <div className="xl:col-span-2">
                <label
                  htmlFor="benchmark-search"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Search
                </label>

                <input
                  id="benchmark-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search games, handhelds, presets or test notes..."
                  className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

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
                onChange={setHandheldFilter}
              />

              <FilterSelect
                label="TDP"
                value={tdpFilter}
                options={tdpOptions}
                onChange={setTdpFilter}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {fpsFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setFpsFilter(filter)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    fpsFilter === filter
                      ? "border-cyan-500 bg-cyan-500 text-slate-950"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Showing {filteredBenchmarks.length}{" "}
                {filteredBenchmarks.length === 1
                  ? "result"
                  : "results"}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          </section>

          {filteredBenchmarks.length === 0 ? (
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center">
              <h2 className="text-2xl font-black">
                No benchmarks found
              </h2>

              <p className="mt-3 text-slate-400">
                Change the filters or publish a benchmark
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
            </section>
          ) : (
            <div className="mt-8 space-y-5">
              {filteredBenchmarks.map((benchmark) => {
                const isExpanded =
                  expandedBenchmarkIds.includes(
                    benchmark.id,
                  );

                return (
                  <article
                    key={benchmark.id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                            {benchmark.game?.name ??
                              "Unknown game"}
                          </p>

                          <h2 className="mt-2 text-3xl font-black">
                            {benchmark.handheld?.name ??
                              "Unknown handheld"}
                          </h2>

                          <p className="mt-2 text-sm font-bold text-slate-500">
                            {benchmark.handheld
                              ?.manufacturer ??
                              "Unknown manufacturer"}
                          </p>

                          {benchmark.preset && (
                            <div className="mt-4 inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-bold text-purple-400">
                              {benchmark.preset.preset_type}
                              {" · "}
                              {benchmark.preset.name}
                            </div>
                          )}
                        </div>

                        <div
                          className={`rounded-2xl border px-6 py-4 text-right ${getFpsStyle(
                            benchmark.averageFps,
                          )}`}
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.2em]">
                            Average FPS
                          </p>

                          <p className="mt-1 text-3xl font-black">
                            {benchmark.averageFps !== null
                              ? benchmark.averageFps
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <BenchmarkStat
                          label="Resolution"
                          value={
                            benchmark.resolution ??
                            "Not set"
                          }
                        />

                        <BenchmarkStat
                          label="TDP"
                          value={
                            benchmark.tdp ?? "Not set"
                          }
                        />

                        <BenchmarkStat
                          label="Average FPS"
                          value={
                            benchmark.averageFps !== null
                              ? `${benchmark.averageFps} FPS`
                              : "Not set"
                          }
                          highlighted
                        />

                        <BenchmarkStat
                          label="1% Low"
                          value={
                            benchmark.onePercentLow !==
                            null
                              ? `${benchmark.onePercentLow} FPS`
                              : "Not set"
                          }
                        />

                        <BenchmarkStat
                          label="Battery"
                          value={
                            benchmark.batteryLife ??
                            "Not set"
                          }
                        />
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-800 pt-6">
                        {benchmark.testNotes && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleBenchmark(
                                benchmark.id,
                              )
                            }
                            className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                          >
                            {isExpanded
                              ? "Hide test notes"
                              : "View test notes"}
                          </button>
                        )}

                        {benchmark.game && (
                          <Link
                            href={`/games/${benchmark.game.slug}`}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-bold text-slate-300 transition hover:border-green-500 hover:text-green-400"
                          >
                            Open game
                          </Link>
                        )}

                        {benchmark.handheld && (
                          <Link
                            href={`/handhelds/${benchmark.handheld.slug}`}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-bold text-slate-300 transition hover:border-purple-500 hover:text-purple-400"
                          >
                            Open handheld
                          </Link>
                        )}

                        <span className="ml-auto self-center text-sm text-slate-600">
                          Published{" "}
                          {formatPublishedDate(
                            benchmark.publishedAt,
                          )}
                        </span>
                      </div>
                    </div>

                    {isExpanded &&
                      benchmark.testNotes && (
                        <div className="border-t border-slate-800 bg-slate-950/70 p-6 md:p-8">
                          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                            Test Methodology
                          </p>

                          <h3 className="mt-2 text-2xl font-black">
                            Benchmark notes
                          </h3>

                          <p className="mt-5 whitespace-pre-line leading-8 text-slate-300">
                            {benchmark.testNotes}
                          </p>
                        </div>
                      )}
                  </article>
                );
              })}
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
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  description?: string;
  highlighted?: boolean;
}

function SummaryCard({
  label,
  value,
  description,
  highlighted = false,
}: SummaryCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        highlighted
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-black ${
          highlighted
            ? "text-cyan-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

      {description && (
        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      )}
    </article>
  );
}

interface BenchmarkStatProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function BenchmarkStat({
  label,
  value,
  highlighted = false,
}: BenchmarkStatProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 font-black ${
          highlighted
            ? "text-cyan-400"
            : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}