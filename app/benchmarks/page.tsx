"use client";

import { useMemo, useState } from "react";
import { benchmarks } from "../../data/benchmarks";
import { games } from "../../data/games";
import { handhelds } from "../../data/handhelds";
import { presets } from "../../data/presets";
import type { PresetType } from "../../types/presets";

type PresetFilter = "All" | PresetType;

const presetFilters: PresetFilter[] = [
  "All",
  "Performance",
  "Balanced",
  "Battery",
  "Docked",
];

function getPresetStyle(type?: PresetType) {
  switch (type) {
    case "Performance":
      return "border-orange-500/30 bg-orange-500/15 text-orange-400";

    case "Balanced":
      return "border-cyan-500/30 bg-cyan-500/15 text-cyan-400";

    case "Battery":
      return "border-green-500/30 bg-green-500/15 text-green-400";

    case "Docked":
      return "border-red-500/30 bg-red-500/15 text-red-400";

    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function getFilterButtonStyle(
  filter: PresetFilter,
  activeFilter: PresetFilter,
) {
  if (filter !== activeFilter) {
    return "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white";
  }

  switch (filter) {
    case "Performance":
      return "border-orange-500 bg-orange-500/20 text-orange-400";

    case "Balanced":
      return "border-cyan-500 bg-cyan-500/20 text-cyan-400";

    case "Battery":
      return "border-green-500 bg-green-500/20 text-green-400";

    case "Docked":
      return "border-red-500 bg-red-500/20 text-red-400";

    case "All":
      return "border-white bg-white text-slate-950";
  }
}

export default function BenchmarksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [presetFilter, setPresetFilter] =
    useState<PresetFilter>("All");
  const [handheldFilter, setHandheldFilter] =
    useState("All");

  const filteredBenchmarks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return benchmarks.filter((benchmark) => {
      const game = games.find(
        (item) => item.slug === benchmark.gameSlug,
      );

      const handheld = handhelds.find(
        (item) => item.slug === benchmark.handheldSlug,
      );

      const preset = presets.find(
        (item) => item.id === benchmark.presetId,
      );

      const searchableText = [
        game?.name ?? "",
        handheld?.name ?? "",
        handheld?.manufacturer ?? "",
        preset?.name ?? "",
        preset?.type ?? "",
        benchmark.resolution,
        benchmark.tdp,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      const matchesPreset =
        presetFilter === "All" ||
        preset?.type === presetFilter;

      const matchesHandheld =
        handheldFilter === "All" ||
        benchmark.handheldSlug === handheldFilter;

      return matchesSearch && matchesPreset && matchesHandheld;
    });
  }, [searchQuery, presetFilter, handheldFilter]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    presetFilter !== "All" ||
    handheldFilter !== "All";

  function resetFilters() {
    setSearchQuery("");
    setPresetFilter("All");
    setHandheldFilter("All");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Performance Data
        </p>

        <h1 className="mt-3 text-5xl font-black">
          Benchmarks
        </h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Compare average FPS, 1% lows, power usage and battery life
          across games and handheld devices.
        </p>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div>
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
                placeholder="Search Cyberpunk, ROG Ally X, 25W..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="handheld-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Handheld
              </label>

              <select
                id="handheld-filter"
                value={handheldFilter}
                onChange={(event) =>
                  setHandheldFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              >
                <option value="All">All handhelds</option>

                {handhelds.map((handheld) => (
                  <option
                    key={handheld.slug}
                    value={handheld.slug}
                  >
                    {handheld.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {presetFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPresetFilter(filter)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${getFilterButtonStyle(
                  filter,
                  presetFilter,
                )}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Showing {filteredBenchmarks.length}{" "}
              {filteredBenchmarks.length === 1
                ? "benchmark"
                : "benchmarks"}
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
          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-2xl font-black">
              No benchmarks found
            </h2>

            <p className="mt-3 text-slate-400">
              Try another search or reset the filters.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Reset filters
            </button>
          </section>
        ) : (
          <section className="mt-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-800 bg-slate-950/70">
                  <tr>
                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      Game
                    </th>

                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      Handheld
                    </th>

                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      Preset
                    </th>

                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      Resolution
                    </th>

                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      TDP
                    </th>

                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      Avg FPS
                    </th>

                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      1% Low
                    </th>

                    <th className="px-6 py-5 text-sm font-semibold text-slate-500">
                      Battery
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBenchmarks.map((benchmark) => {
                    const game = games.find(
                      (item) =>
                        item.slug === benchmark.gameSlug,
                    );

                    const handheld = handhelds.find(
                      (item) =>
                        item.slug === benchmark.handheldSlug,
                    );

                    const preset = presets.find(
                      (item) => item.id === benchmark.presetId,
                    );

                    return (
                      <tr
                        key={benchmark.id}
                        className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-5 font-bold">
                          {game?.name ?? benchmark.gameSlug}
                        </td>

                        <td className="px-6 py-5 text-slate-300">
                          {handheld?.name ??
                            benchmark.handheldSlug}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-2">
                            <span className="font-semibold text-slate-300">
                              {preset?.name ??
                                benchmark.presetId}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${getPresetStyle(
                                preset?.type,
                              )}`}
                            >
                              {preset?.type ?? "Unknown"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-slate-300">
                          {benchmark.resolution}
                        </td>

                        <td className="px-6 py-5 text-slate-300">
                          {benchmark.tdp}
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-black text-cyan-400">
                            {benchmark.averageFps}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-slate-300">
                          {benchmark.onePercentLow}
                        </td>

                        <td className="px-6 py-5 text-slate-300">
                          {benchmark.batteryLife}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold text-yellow-300">
            Development data
          </p>

          <p className="mt-2 text-sm text-yellow-100/70">
            Current benchmark values are sample development data.
            Verified testing will replace them before launch.
          </p>
        </div>
      </div>
    </main>
  );
}