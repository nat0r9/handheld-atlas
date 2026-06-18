"use client";

import Link from "next/link";
import ContributorAttribution from "./ContributorAttribution";
import type { PublicContributor } from "../lib/contributors";
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
  contributor: PublicContributor | null;

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

type FpsFilter = "All" | "30+ FPS" | "45+ FPS" | "60+ FPS" | "90+ FPS";

type SortOption =
  | "Newest"
  | "Highest FPS"
  | "Lowest FPS"
  | "Game"
  | "Handheld";

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
    return "border-slate-500/30 bg-slate-500/10 text-slate-400";
  }

  if (fps >= 90) {
    return "border-purple-500/30 bg-purple-500/10 text-purple-400";
  }

  if (fps >= 60) {
    return "border-green-500/30 bg-green-500/10 text-green-400";
  }

  if (fps >= 45) {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
  }

  if (fps >= 30) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-400";
  }

  return "border-red-500/30 bg-red-500/10 text-red-400";
}

function formatPublishedDate(value: string | null) {
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

export default function BenchmarksCatalog({
  benchmarks,
  databaseError,
}: BenchmarksCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gameFilter, setGameFilter] = useState("All");
  const [handheldFilter, setHandheldFilter] = useState("All");
  const [tdpFilter, setTdpFilter] = useState("All");
  const [fpsFilter, setFpsFilter] = useState<FpsFilter>("All");
  const [sortOption, setSortOption] = useState<SortOption>("Newest");
  const [expandedBenchmarkIds, setExpandedBenchmarkIds] = useState<string[]>(
    [],
  );

  const gameOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          benchmarks
            .map((benchmark) => benchmark.game?.name)
            .filter(
              (value): value is string =>
                typeof value === "string" && value.length > 0,
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
            .map((benchmark) => benchmark.handheld?.name)
            .filter(
              (value): value is string =>
                typeof value === "string" && value.length > 0,
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
                typeof value === "string" && value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [benchmarks],
  );

  const filteredBenchmarks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const minimumFps = getMinimumFps(fpsFilter);

    const matchingBenchmarks = benchmarks.filter((benchmark) => {
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

      return (
        (normalizedQuery.length === 0 ||
          searchableText.includes(normalizedQuery)) &&
        (gameFilter === "All" || benchmark.game?.name === gameFilter) &&
        (handheldFilter === "All" ||
          benchmark.handheld?.name === handheldFilter) &&
        (tdpFilter === "All" || benchmark.tdp === tdpFilter) &&
        (minimumFps === null ||
          (benchmark.averageFps !== null &&
            benchmark.averageFps >= minimumFps))
      );
    });

    return [...matchingBenchmarks].sort((first, second) => {
      switch (sortOption) {
        case "Highest FPS":
          return (second.averageFps ?? -1) - (first.averageFps ?? -1);
        case "Lowest FPS":
          return (
            (first.averageFps ?? Number.MAX_SAFE_INTEGER) -
            (second.averageFps ?? Number.MAX_SAFE_INTEGER)
          );
        case "Game":
          return (first.game?.name ?? "").localeCompare(
            second.game?.name ?? "",
          );
        case "Handheld":
          return (first.handheld?.name ?? "").localeCompare(
            second.handheld?.name ?? "",
          );
        default:
          return (
            new Date(second.publishedAt ?? 0).getTime() -
            new Date(first.publishedAt ?? 0).getTime()
          );
      }
    });
  }, [
    benchmarks,
    searchQuery,
    gameFilter,
    handheldFilter,
    tdpFilter,
    fpsFilter,
    sortOption,
  ]);

  const averageFpsAcrossResults = useMemo(() => {
    const validResults = filteredBenchmarks
      .map((benchmark) => benchmark.averageFps)
      .filter((fps): fps is number => typeof fps === "number");

    if (validResults.length === 0) {
      return null;
    }

    return (
      validResults.reduce((sum, fps) => sum + fps, 0) / validResults.length
    );
  }, [filteredBenchmarks]);

  const highestFpsBenchmark = useMemo(() => {
    return filteredBenchmarks.reduce<PublicBenchmark | null>(
      (currentBest, benchmark) => {
        if (benchmark.averageFps === null) {
          return currentBest;
        }

        if (
          !currentBest ||
          currentBest.averageFps === null ||
          benchmark.averageFps > currentBest.averageFps
        ) {
          return benchmark;
        }

        return currentBest;
      },
      null,
    );
  }, [filteredBenchmarks]);

  const sixtyPlusResults = benchmarks.filter(
    (benchmark) => (benchmark.averageFps ?? 0) >= 60,
  ).length;

  const uniqueDevices = new Set(
    benchmarks
      .map((benchmark) => benchmark.handheld?.name)
      .filter(Boolean),
  ).size;

  const hasActiveFilters =
    searchQuery.length > 0 ||
    gameFilter !== "All" ||
    handheldFilter !== "All" ||
    tdpFilter !== "All" ||
    fpsFilter !== "All" ||
    sortOption !== "Newest";

  function resetFilters() {
    setSearchQuery("");
    setGameFilter("All");
    setHandheldFilter("All");
    setTdpFilter("All");
    setFpsFilter("All");
    setSortOption("Newest");
  }

  function toggleBenchmark(benchmarkId: string) {
    setExpandedBenchmarkIds((currentIds) =>
      currentIds.includes(benchmarkId)
        ? currentIds.filter((id) => id !== benchmarkId)
        : [...currentIds, benchmarkId],
    );
  }

  return (
    <main className="atlas-page min-w-0 overflow-x-hidden pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-9 sm:py-12">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="min-w-0">
              <p className="atlas-section-label">Verified performance data</p>

              <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:mt-4 sm:text-6xl">
                Real numbers.
                <span className="block">
                  No benchmark{" "}
                  <span className="atlas-text-red">theatre.</span>
                </span>
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:leading-8">
                Compare measured handheld performance by game, device,
                resolution, TDP and linked preset.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <HeroStat label="Published" value={benchmarks.length.toString()} />

              <HeroStat
                label="Average FPS"
                value={
                  averageFpsAcrossResults !== null
                    ? averageFpsAcrossResults.toFixed(1)
                    : "—"
                }
                highlighted
              />

              <HeroStat label="60+ FPS" value={sixtyPlusResults.toString()} />
              <HeroStat label="Devices" value={uniqueDevices.toString()} />
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell min-w-0 pt-5 sm:pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">Could not load the benchmark database.</p>
            <p className="mt-2 break-words">{databaseError}</p>
          </div>
        )}

        <section className="atlas-panel min-w-0 p-4 md:p-5">
          <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-[1.8fr_repeat(4,minmax(0,1fr))_auto] xl:gap-4">
            <div className="col-span-2 min-w-0 xl:col-span-1">
              <FilterLabel htmlFor="benchmark-search" label="Search" />

              <div className="relative min-w-0">
                <input
                  id="benchmark-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search game, device, preset or notes..."
                  className="w-full min-w-0 rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3 pr-10 text-sm"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <SearchIcon />
                </span>
              </div>
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

            <FilterSelect
              label="Sort"
              value={sortOption}
              options={[
                "Newest",
                "Highest FPS",
                "Lowest FPS",
                "Game",
                "Handheld",
              ]}
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

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {fpsFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFpsFilter(filter)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[0.64rem] font-black uppercase tracking-[0.08em] transition sm:text-[0.68rem] sm:tracking-[0.1em] ${
                  fpsFilter === filter
                    ? "border-red-500/40 bg-red-500/15 text-red-300"
                    : "border-white/[0.08] bg-black/20 text-slate-500 hover:border-white/20 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1fr_0.45fr]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
              <div>
                <p className="atlas-section-label">Benchmark wall</p>

                <h2 className="mt-1 text-xl font-black">
                  {filteredBenchmarks.length}{" "}
                  {filteredBenchmarks.length === 1 ? "result" : "results"}
                </h2>
              </div>

              <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-slate-600 sm:text-xs sm:tracking-[0.15em]">
                Live performance database
              </p>
            </div>

            {filteredBenchmarks.length === 0 ? (
              <div className="atlas-panel mt-5 p-10 text-center">
                <p className="atlas-section-label">No matches</p>
                <h3 className="mt-3 text-3xl font-black">
                  No benchmarks found
                </h3>
                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                  Change the filters or publish another benchmark through the
                  admin dashboard.
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
              <div className="mt-5 space-y-3">
                {filteredBenchmarks.map((benchmark) => {
                  const isExpanded = expandedBenchmarkIds.includes(
                    benchmark.id,
                  );

                  return (
                    <article
                      key={benchmark.id}
                      className="atlas-card atlas-card-hover min-w-0"
                    >
                      <div className="grid min-w-0 gap-4 p-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="min-w-0 truncate text-[0.56rem] font-black uppercase tracking-[0.12em] text-red-400 sm:text-[0.58rem] sm:tracking-[0.14em]">
                              {benchmark.game?.name ?? "Unknown game"}
                            </span>

                            <span className="text-[0.56rem] text-slate-600 sm:text-[0.58rem]">
                              {formatPublishedDate(benchmark.publishedAt)}
                            </span>
                          </div>

                          <h3 className="mt-2 break-words text-xl font-black">
                            {benchmark.handheld?.name ?? "Unknown handheld"}
                          </h3>

                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-600 sm:tracking-[0.12em]">
                            {benchmark.handheld?.manufacturer ??
                              "Unknown manufacturer"}
                          </p>

                          <div className="mt-3">
                            <ContributorAttribution profile={benchmark.contributor} label="Tested by" compact />
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="atlas-chip">
                              {benchmark.resolution ?? "Resolution n/a"}
                            </span>

                            <span className="atlas-chip">
                              {benchmark.tdp ?? "TDP n/a"}
                            </span>

                            <span className="atlas-chip-cyan atlas-chip">
                              {benchmark.preset?.preset_type ?? "Custom"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <BenchmarkStat
                            label="Average"
                            value={
                              benchmark.averageFps !== null
                                ? `${benchmark.averageFps}`
                                : "—"
                            }
                            suffix="FPS"
                            styleClass={getFpsStyle(benchmark.averageFps)}
                          />

                          <BenchmarkStat
                            label="1% Low"
                            value={
                              benchmark.onePercentLow !== null
                                ? `${benchmark.onePercentLow}`
                                : "—"
                            }
                            suffix="FPS"
                          />

                          <BenchmarkStat
                            label="Battery"
                            value={benchmark.batteryLife ?? "—"}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleBenchmark(benchmark.id)}
                          className="atlas-button-secondary w-full whitespace-nowrap lg:w-auto"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/[0.06] bg-black/20 px-4 py-3 text-[0.64rem] text-slate-500 sm:text-[0.68rem] lg:grid-cols-4">
                        <MetaItem
                          label="Game"
                          value={benchmark.game?.name ?? "Unknown"}
                        />
                        <MetaItem
                          label="Device"
                          value={benchmark.handheld?.name ?? "Unknown"}
                        />
                        <MetaItem
                          label="Preset"
                          value={benchmark.preset?.name ?? "Custom"}
                        />
                        <MetaItem
                          label="Published"
                          value={formatPublishedDate(benchmark.publishedAt)}
                        />
                      </div>

                      {isExpanded && (
                        <div className="border-t border-white/[0.07] bg-[#060911] p-4 md:p-5">
                          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
                            <div className="min-w-0">
                              <p className="atlas-section-label">Test notes</p>
                              <h4 className="mt-1 text-xl font-black">
                                Benchmark details
                              </h4>

                              <p className="mt-4 max-w-4xl break-words text-sm leading-7 text-slate-400">
                                {benchmark.testNotes ??
                                  "No additional test notes were provided for this benchmark."}
                              </p>
                            </div>

                            <div className="grid gap-2 sm:flex sm:flex-wrap">
                              {benchmark.game && (
                                <Link
                                  href={`/games/${benchmark.game.slug}`}
                                  className="atlas-button-secondary w-full sm:w-auto"
                                >
                                  Open game
                                </Link>
                              )}

                              {benchmark.handheld && (
                                <Link
                                  href={`/handhelds/${benchmark.handheld.slug}`}
                                  className="atlas-button-secondary w-full sm:w-auto"
                                >
                                  Open handheld
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="atlas-panel p-5">
              <p className="atlas-section-label">Performance snapshot</p>
              <h2 className="mt-1 text-xl font-black">Current result set</h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <SideStat
                  label="Visible"
                  value={filteredBenchmarks.length.toString()}
                />

                <SideStat
                  label="Average"
                  value={
                    averageFpsAcrossResults !== null
                      ? `${averageFpsAcrossResults.toFixed(1)} FPS`
                      : "No data"
                  }
                  highlighted
                />

                <SideStat
                  label="Highest"
                  value={
                    highestFpsBenchmark?.averageFps !== null &&
                    highestFpsBenchmark?.averageFps !== undefined
                      ? `${highestFpsBenchmark.averageFps} FPS`
                      : "No data"
                  }
                />

                <SideStat
                  label="60+ FPS"
                  value={filteredBenchmarks
                    .filter((benchmark) => (benchmark.averageFps ?? 0) >= 60)
                    .length.toString()}
                />
              </div>
            </section>

            {highestFpsBenchmark && (
              <section className="atlas-panel p-5">
                <p className="atlas-section-label">Top result</p>

                <h2 className="mt-2 text-2xl font-black">
                  {highestFpsBenchmark.averageFps ?? "—"} FPS
                </h2>

                <p className="mt-3 font-black text-slate-200">
                  {highestFpsBenchmark.game?.name ?? "Unknown game"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {highestFpsBenchmark.handheld?.name ?? "Unknown handheld"}
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-cyan-400"
                    style={{
                      width: `${Math.min(
                        100,
                        highestFpsBenchmark.averageFps ?? 0,
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-600">
                  {highestFpsBenchmark.resolution ?? "Resolution not set"} ·{" "}
                  {highestFpsBenchmark.tdp ?? "TDP not set"}
                </p>
              </section>
            )}

            <section className="atlas-panel p-5">
              <p className="atlas-section-label">Explore data</p>

              <div className="mt-4 space-y-2">
                <Link href="/games" className="atlas-button-secondary w-full">
                  Browse games
                </Link>

                <Link
                  href="/handhelds"
                  className="atlas-button-secondary w-full"
                >
                  Browse handhelds
                </Link>

                <Link href="/compare" className="atlas-button-primary w-full">
                  Compare devices
                </Link>
              </div>
            </section>
          </aside>
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
        highlighted
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/[0.08] bg-black/20"
      }`}
    >
      <p className="text-[0.45rem] font-black uppercase leading-tight tracking-[0.1em] text-slate-600 sm:text-[0.52rem] sm:tracking-[0.14em]">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black sm:text-3xl ${
          highlighted ? "text-red-400" : "text-white"
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  const id = `benchmark-filter-${label.toLowerCase().replaceAll(" ", "-")}`;

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

function BenchmarkStat({
  label,
  value,
  suffix,
  styleClass,
}: {
  label: string;
  value: string;
  suffix?: string;
  styleClass?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border p-3 ${
        styleClass ??
        "border-white/[0.07] bg-black/20 text-slate-300"
      }`}
    >
      <p className="text-[0.46rem] font-black uppercase tracking-[0.09em] opacity-60 sm:text-[0.5rem] sm:tracking-[0.12em]">
        {label}
      </p>

      <p className="mt-1 break-words text-base font-black sm:text-lg">
        {value}
      </p>

      {suffix && (
        <p className="text-[0.46rem] font-black uppercase tracking-[0.09em] opacity-60 sm:text-[0.5rem] sm:tracking-[0.12em]">
          {suffix}
        </p>
      )}
    </div>
  );
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 break-words">
      <span className="font-black uppercase tracking-[0.08em] text-slate-600 sm:tracking-[0.1em]">
        {label}:
      </span>{" "}
      <strong className="text-slate-300">{value}</strong>
    </div>
  );
}

function SideStat({
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
        highlighted
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.46rem] font-black uppercase tracking-[0.09em] text-slate-600 sm:text-[0.5rem] sm:tracking-[0.12em]">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-lg font-black sm:text-xl ${
          highlighted ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
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
