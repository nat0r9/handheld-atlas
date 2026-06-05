"use client";

import { useMemo, useState } from "react";
import PresetCard from "../../components/PresetCard";
import { games } from "../../data/games";
import { handhelds } from "../../data/handhelds";
import { presets } from "../../data/presets";
import type { PresetType } from "../../types/presets";

type PresetFilter = "All" | PresetType;

const filters: PresetFilter[] = [
  "All",
  "Performance",
  "Balanced",
  "Battery",
  "Docked",
];

function getFilterStyle(
  filter: PresetFilter,
  activeFilter: PresetFilter,
) {
  const isActive = filter === activeFilter;

  if (!isActive) {
    return "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-white";
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

export default function PresetsPage() {
  const [activeFilter, setActiveFilter] =
    useState<PresetFilter>("All");

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPresets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return presets.filter((preset) => {
      const game = games.find(
        (item) => item.slug === preset.gameSlug,
      );

      const handheld = handhelds.find(
        (item) => item.slug === preset.handheldSlug,
      );

      const matchesFilter =
        activeFilter === "All" || preset.type === activeFilter;

      const searchableText = [
        preset.name,
        preset.type,
        preset.resolution,
        preset.tdp,
        preset.upscaler,
        game?.name ?? "",
        handheld?.name ?? "",
        handheld?.manufacturer ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  function clearFilters() {
    setActiveFilter("All");
    setSearchQuery("");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Performance Profiles
        </p>

        <h1 className="mt-3 text-5xl font-black">Presets</h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Browse performance, balanced, battery and docked settings
          for supported handheld gaming devices.
        </p>

        <div className="mt-8 max-w-2xl">
          <label
            htmlFor="preset-search"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Search presets
          </label>

          <input
            id="preset-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search Cyberpunk, ROG Ally X, 25W, FSR..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${getFilterStyle(
                filter,
                activeFilter,
              )}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Showing {filteredPresets.length}{" "}
            {filteredPresets.length === 1 ? "preset" : "presets"}
          </p>

          {(activeFilter !== "All" || searchQuery.length > 0) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredPresets.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-xl font-bold">No presets found</h2>

            <p className="mt-2 text-slate-400">
              Try another game, handheld or preset mode.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Reset search
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPresets.map((preset) => {
              const game = games.find(
                (item) => item.slug === preset.gameSlug,
              );

              const handheld = handhelds.find(
                (item) => item.slug === preset.handheldSlug,
              );

              return (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  gameName={game?.name ?? preset.gameSlug}
                  handheldName={
                    handheld?.name ?? preset.handheldSlug
                  }
                  manufacturer={
                    handheld?.manufacturer ??
                    "Unknown manufacturer"
                  }
                  showGameLink
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}