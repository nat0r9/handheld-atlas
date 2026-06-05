"use client";

import { useState } from "react";
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

  const filteredPresets =
    activeFilter === "All"
      ? presets
      : presets.filter(
          (preset) => preset.type === activeFilter,
        );

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

        <div className="mt-8 flex flex-wrap gap-3">
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

        <div className="mt-5 text-sm text-slate-500">
          Showing {filteredPresets.length}{" "}
          {filteredPresets.length === 1 ? "preset" : "presets"}
        </div>

        {filteredPresets.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
            No presets found for this mode.
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