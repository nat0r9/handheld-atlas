"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type PublicPresetType =
  | "Performance"
  | "Balanced"
  | "Battery"
  | "Docked"
  | "Custom";

export interface PublicPresetSettingItem {
  id: string;
  label: string;
  value: string;
  note: string | null;
}

export interface PublicPresetSettingGroup {
  id: string;
  name: string;
  items: PublicPresetSettingItem[];
}

export interface PublicPreset {
  id: string;
  name: string;
  type: PublicPresetType;
  resolution: string | null;
  tdp: string | null;
  averageFps: number | null;
  onePercentLow: number | null;
  upscaler: string | null;
  batteryLife: string | null;
  communityRating: number | null;
  summary: string | null;
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
  groups: PublicPresetSettingGroup[];
}

interface PresetsCatalogProps {
  presets: PublicPreset[];
  databaseError: string | null;
}

type PresetFilter = "All" | PublicPresetType;

const presetFilters: PresetFilter[] = [
  "All",
  "Performance",
  "Balanced",
  "Battery",
  "Docked",
  "Custom",
];

function getPresetStyle(type: PublicPresetType) {
  switch (type) {
    case "Performance":
      return "border-orange-500/30 bg-orange-500/15 text-orange-400";

    case "Balanced":
      return "border-cyan-500/30 bg-cyan-500/15 text-cyan-400";

    case "Battery":
      return "border-green-500/30 bg-green-500/15 text-green-400";

    case "Docked":
      return "border-red-500/30 bg-red-500/15 text-red-400";

    case "Custom":
      return "border-purple-500/30 bg-purple-500/15 text-purple-400";
  }
}

function getActiveFilterStyle(
  filter: PresetFilter,
  activeFilter: PresetFilter,
) {
  if (filter !== activeFilter) {
    return "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white";
  }

  if (filter === "All") {
    return "border-white bg-white text-slate-950";
  }

  return getPresetStyle(filter);
}

export default function PresetsCatalog({
  presets,
  databaseError,
}: PresetsCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [presetFilter, setPresetFilter] =
    useState<PresetFilter>("All");
  const [gameFilter, setGameFilter] = useState("All");
  const [handheldFilter, setHandheldFilter] =
    useState("All");
  const [expandedPresetIds, setExpandedPresetIds] =
    useState<string[]>([]);

  const gameOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          presets
            .map((preset) => preset.game?.name)
            .filter(
              (value): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [presets],
  );

  const handheldOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          presets
            .map((preset) => preset.handheld?.name)
            .filter(
              (value): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [presets],
  );

  const filteredPresets = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return presets.filter((preset) => {
      const searchableSettings = preset.groups
        .flatMap((group) => [
          group.name,
          ...group.items.flatMap((item) => [
            item.label,
            item.value,
            item.note ?? "",
          ]),
        ])
        .join(" ");

      const searchableText = [
        preset.name,
        preset.type,
        preset.game?.name ?? "",
        preset.handheld?.name ?? "",
        preset.handheld?.manufacturer ?? "",
        preset.resolution ?? "",
        preset.tdp ?? "",
        preset.upscaler ?? "",
        preset.summary ?? "",
        searchableSettings,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      const matchesType =
        presetFilter === "All" ||
        preset.type === presetFilter;

      const matchesGame =
        gameFilter === "All" ||
        preset.game?.name === gameFilter;

      const matchesHandheld =
        handheldFilter === "All" ||
        preset.handheld?.name === handheldFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesGame &&
        matchesHandheld
      );
    });
  }, [
    presets,
    searchQuery,
    presetFilter,
    gameFilter,
    handheldFilter,
  ]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    presetFilter !== "All" ||
    gameFilter !== "All" ||
    handheldFilter !== "All";

  function resetFilters() {
    setSearchQuery("");
    setPresetFilter("All");
    setGameFilter("All");
    setHandheldFilter("All");
  }

  function togglePreset(presetId: string) {
    setExpandedPresetIds((currentIds) =>
      currentIds.includes(presetId)
        ? currentIds.filter((id) => id !== presetId)
        : [...currentIds, presetId],
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Tested Performance Profiles
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-5xl">
            Game Presets
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-slate-400">
            Choose a game, handheld and operating mode.
            Every published preset includes the exact settings
            needed to reproduce the intended performance.
          </p>

          {databaseError && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              <p className="font-black">
                Could not load the preset database.
              </p>

              <p className="mt-2 break-words text-sm">
                {databaseError}
              </p>
            </div>
          )}

          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <div className="xl:col-span-2">
                <label
                  htmlFor="preset-search"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Search
                </label>

                <input
                  id="preset-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search game, handheld, setting or upscaler..."
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
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {presetFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setPresetFilter(filter)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${getActiveFilterStyle(
                    filter,
                    presetFilter,
                  )}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Showing {filteredPresets.length}{" "}
                {filteredPresets.length === 1
                  ? "preset"
                  : "presets"}
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

          {filteredPresets.length === 0 ? (
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center">
              <h2 className="text-2xl font-black">
                No presets found
              </h2>

              <p className="mt-3 text-slate-400">
                Change the filters or publish a preset from
                the admin dashboard.
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
            <div className="mt-8 space-y-6">
              {filteredPresets.map((preset) => {
                const isExpanded =
                  expandedPresetIds.includes(preset.id);

                return (
                  <article
                    key={preset.id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getPresetStyle(
                                preset.type,
                              )}`}
                            >
                              {preset.type}
                            </span>

                            <span className="text-sm font-bold text-slate-500">
                              {preset.handheld?.manufacturer ??
                                "Unknown manufacturer"}
                            </span>
                          </div>

                          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                            {preset.game?.name ??
                              "Unknown game"}
                          </p>

                          <h2 className="mt-2 text-3xl font-black md:text-4xl">
                            {preset.name}
                          </h2>

                          <p className="mt-3 text-lg text-slate-400">
                            {preset.handheld?.name ??
                              "Unknown handheld"}
                          </p>
                        </div>

                        {preset.communityRating !== null && (
                          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                              Rating
                            </p>

                            <p className="mt-1 text-2xl font-black text-yellow-300">
                              ★ {preset.communityRating.toFixed(1)}
                            </p>
                          </div>
                        )}
                      </div>

                      {preset.summary && (
                        <p className="mt-6 max-w-4xl leading-7 text-slate-400">
                          {preset.summary}
                        </p>
                      )}

                      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                        <PresetStat
                          label="Resolution"
                          value={preset.resolution ?? "Not set"}
                        />

                        <PresetStat
                          label="TDP"
                          value={preset.tdp ?? "Not set"}
                        />

                        <PresetStat
                          label="Average FPS"
                          value={
                            preset.averageFps !== null
                              ? `${preset.averageFps} FPS`
                              : "Not set"
                          }
                          highlighted
                        />

                        <PresetStat
                          label="1% Low"
                          value={
                            preset.onePercentLow !== null
                              ? `${preset.onePercentLow} FPS`
                              : "Not set"
                          }
                        />

                        <PresetStat
                          label="Upscaler"
                          value={preset.upscaler ?? "Not set"}
                        />

                        <PresetStat
                          label="Battery"
                          value={
                            preset.batteryLife ?? "Not set"
                          }
                        />

                        <PresetStat
                          label="Settings"
                          value={`${preset.groups.reduce(
                            (total, group) =>
                              total + group.items.length,
                            0,
                          )} values`}
                        />
                      </div>

                      <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-800 pt-6">
                        <button
                          type="button"
                          onClick={() =>
                            togglePreset(preset.id)
                          }
                          className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
                        >
                          {isExpanded
                            ? "Hide full settings"
                            : "View full settings"}
                        </button>

                        {preset.game && (
                          <Link
                            href={`/games/${preset.game.slug}`}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-bold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
                          >
                            Open game
                          </Link>
                        )}

                        {preset.handheld && (
                          <Link
                            href={`/handhelds/${preset.handheld.slug}`}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-bold text-slate-300 transition hover:border-purple-500 hover:text-purple-400"
                          >
                            Open handheld
                          </Link>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/70 p-6 md:p-8">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                            Complete Configuration
                          </p>

                          <h3 className="mt-2 text-3xl font-black">
                            Full settings
                          </h3>
                        </div>

                        {preset.groups.length === 0 ? (
                          <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                            <p className="font-bold text-slate-300">
                              No detailed settings available
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                              This preset only contains the
                              basic performance information.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-7 grid gap-6 lg:grid-cols-2">
                            {preset.groups.map((group) => (
                              <section
                                key={group.id}
                                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                              >
                                <div className="border-b border-slate-800 bg-slate-950 px-5 py-4">
                                  <h4 className="text-xl font-black">
                                    {group.name}
                                  </h4>

                                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                                    {group.items.length}{" "}
                                    {group.items.length === 1
                                      ? "setting"
                                      : "settings"}
                                  </p>
                                </div>

                                <dl>
                                  {group.items.map(
                                    (item, itemIndex) => (
                                      <div
                                        key={item.id}
                                        className={`grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-start ${
                                          itemIndex ===
                                          group.items.length - 1
                                            ? ""
                                            : "border-b border-slate-800"
                                        }`}
                                      >
                                        <div>
                                          <dt className="font-semibold text-slate-300">
                                            {item.label}
                                          </dt>

                                          {item.note && (
                                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                              {item.note}
                                            </p>
                                          )}
                                        </div>

                                        <dd className="font-black text-cyan-400 sm:text-right">
                                          {item.value}
                                        </dd>
                                      </div>
                                    ),
                                  )}
                                </dl>
                              </section>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
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
        onChange={(event) => onChange(event.target.value)}
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

interface PresetStatProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function PresetStat({
  label,
  value,
  highlighted = false,
}: PresetStatProps) {
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
          highlighted ? "text-cyan-400" : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}