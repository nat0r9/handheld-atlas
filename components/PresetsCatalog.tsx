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

type PresetFilter =
  | "All"
  | PublicPresetType;

type SortOption =
  | "Newest"
  | "Rating"
  | "FPS"
  | "Name";

const presetFilters: PresetFilter[] = [
  "All",
  "Performance",
  "Balanced",
  "Battery",
  "Docked",
  "Custom",
];

function getPresetStyle(
  type: PublicPresetType,
) {
  switch (type) {
    case "Performance":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    case "Balanced":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";

    case "Battery":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "Docked":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";

    default:
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
  }
}

function getActiveFilterStyle(
  filter: PresetFilter,
  activeFilter: PresetFilter,
) {
  if (filter !== activeFilter) {
    return "border-white/[0.08] bg-black/20 text-slate-500 hover:border-white/20 hover:text-white";
  }

  if (filter === "All") {
    return "border-red-500/40 bg-red-500/15 text-red-300";
  }

  return getPresetStyle(filter);
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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function PresetsCatalog({
  presets,
  databaseError,
}: PresetsCatalogProps) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [presetFilter, setPresetFilter] =
    useState<PresetFilter>("All");

  const [gameFilter, setGameFilter] =
    useState("All");

  const [
    handheldFilter,
    setHandheldFilter,
  ] = useState("All");

  const [sortOption, setSortOption] =
    useState<SortOption>("Newest");

  const [
    expandedPresetIds,
    setExpandedPresetIds,
  ] = useState<string[]>([]);

  const gameOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          presets
            .map(
              (preset) =>
                preset.game?.name,
            )
            .filter(
              (
                value,
              ): value is string =>
                typeof value ===
                  "string" &&
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
            .map(
              (preset) =>
                preset.handheld?.name,
            )
            .filter(
              (
                value,
              ): value is string =>
                typeof value ===
                  "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [presets],
  );

  const filteredPresets = useMemo(() => {
    const normalizedQuery =
      searchQuery
        .trim()
        .toLowerCase();

    const matchingPresets =
      presets.filter((preset) => {
        const searchableSettings =
          preset.groups
            .flatMap((group) => [
              group.name,

              ...group.items.flatMap(
                (item) => [
                  item.label,
                  item.value,
                  item.note ?? "",
                ],
              ),
            ])
            .join(" ");

        const searchableText = [
          preset.name,
          preset.type,
          preset.game?.name ?? "",
          preset.handheld?.name ?? "",
          preset.handheld?.manufacturer ??
            "",
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
          searchableText.includes(
            normalizedQuery,
          );

        const matchesType =
          presetFilter === "All" ||
          preset.type === presetFilter;

        const matchesGame =
          gameFilter === "All" ||
          preset.game?.name ===
            gameFilter;

        const matchesHandheld =
          handheldFilter === "All" ||
          preset.handheld?.name ===
            handheldFilter;

        return (
          matchesSearch &&
          matchesType &&
          matchesGame &&
          matchesHandheld
        );
      });

    return [...matchingPresets].sort(
      (first, second) => {
        switch (sortOption) {
          case "Rating":
            return (
              (second.communityRating ??
                -1) -
              (first.communityRating ??
                -1)
            );

          case "FPS":
            return (
              (second.averageFps ??
                -1) -
              (first.averageFps ??
                -1)
            );

          case "Name":
            return first.name.localeCompare(
              second.name,
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
    presets,
    searchQuery,
    presetFilter,
    gameFilter,
    handheldFilter,
    sortOption,
  ]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    presetFilter !== "All" ||
    gameFilter !== "All" ||
    handheldFilter !== "All" ||
    sortOption !== "Newest";

  const ratedPresets =
    presets.filter(
      (preset) =>
        preset.communityRating !== null,
    );

  const averageRating =
    ratedPresets.length > 0
      ? (
          ratedPresets.reduce(
            (total, preset) =>
              total +
              (preset.communityRating ??
                0),
            0,
          ) / ratedPresets.length
        ).toFixed(1)
      : "—";

  const performancePresets =
    presets.filter(
      (preset) =>
        preset.type === "Performance",
    ).length;

  const totalSettings =
    presets.reduce(
      (presetTotal, preset) =>
        presetTotal +
        preset.groups.reduce(
          (groupTotal, group) =>
            groupTotal +
            group.items.length,
          0,
        ),
      0,
    );

  function resetFilters() {
    setSearchQuery("");
    setPresetFilter("All");
    setGameFilter("All");
    setHandheldFilter("All");
    setSortOption("Newest");
  }

  function togglePreset(
    presetId: string,
  ) {
    setExpandedPresetIds(
      (currentIds) =>
        currentIds.includes(presetId)
          ? currentIds.filter(
              (id) => id !== presetId,
            )
          : [...currentIds, presetId],
    );
  }

  return (
    <main className="atlas-page pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="atlas-section-label">
                Performance profiles
              </p>

              <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                Tested settings.
                <span className="block">
                  Zero{" "}
                  <span className="atlas-text-red">
                    guesswork.
                  </span>
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Reproduce tested handheld
                performance using exact graphics
                settings, TDP targets, resolutions
                and measured FPS.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <HeroStat
                label="Published"
                value={presets.length.toString()}
              />

              <HeroStat
                label="Average rating"
                value={averageRating}
                highlighted
              />

              <HeroStat
                label="Performance"
                value={performancePresets.toString()}
              />

              <HeroStat
                label="Settings"
                value={totalSettings.toString()}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">
              Could not load the preset
              database.
            </p>

            <p className="mt-2 break-words">
              {databaseError}
            </p>
          </div>
        )}

        <section className="atlas-panel p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))_auto]">
            <div>
              <FilterLabel
                htmlFor="preset-search"
                label="Search"
              />

              <div className="relative">
                <input
                  id="preset-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search game, handheld, setting or upscaler..."
                  className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3 pr-10 text-sm"
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
              onChange={
                setHandheldFilter
              }
            />

            <FilterSelect
              label="Sort"
              value={sortOption}
              options={[
                "Newest",
                "Rating",
                "FPS",
                "Name",
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

          <div className="mt-5 flex flex-wrap gap-2">
            {presetFilters.map(
              (filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() =>
                    setPresetFilter(
                      filter,
                    )
                  }
                  className={`rounded-full border px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${getActiveFilterStyle(
                    filter,
                    presetFilter,
                  )}`}
                >
                  {filter}
                </button>
              ),
            )}
          </div>
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-3">
            <div>
              <p className="atlas-section-label">
                Preset library
              </p>

              <h2 className="mt-1 text-xl font-black">
                {filteredPresets.length}{" "}
                {filteredPresets.length === 1
                  ? "preset"
                  : "presets"}
              </h2>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600">
              Exact settings from the live
              database
            </p>
          </div>

          {filteredPresets.length === 0 ? (
            <div className="atlas-panel mt-5 p-10 text-center">
              <p className="atlas-section-label">
                No matches
              </p>

              <h3 className="mt-3 text-3xl font-black">
                No presets found
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Change the filters or publish
                another preset through the admin
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
            <div className="mt-5 space-y-3">
              {filteredPresets.map(
                (preset) => {
                  const isExpanded =
                    expandedPresetIds.includes(
                      preset.id,
                    );

                  const settingsCount =
                    preset.groups.reduce(
                      (total, group) =>
                        total +
                        group.items.length,
                      0,
                    );

                  return (
                    <article
                      key={preset.id}
                      className="atlas-card atlas-card-hover"
                    >
                      <div className="grid gap-5 p-4 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] ${getPresetStyle(
                                preset.type,
                              )}`}
                            >
                              {preset.type}
                            </span>

                            <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-cyan-400">
                              {preset.game?.name ??
                                "Unknown game"}
                            </span>

                            <span className="text-[0.62rem] text-slate-600">
                              {formatDate(
                                preset.publishedAt,
                              )}
                            </span>
                          </div>

                          <h3 className="mt-3 text-2xl font-black leading-tight">
                            {preset.name}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-slate-400">
                            {preset.handheld?.name ??
                              "Unknown handheld"}
                          </p>

                          <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
                            {preset.summary ??
                              "Tested handheld performance configuration."}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                          <PresetStat
                            label="Resolution"
                            value={
                              preset.resolution ??
                              "Not set"
                            }
                          />

                          <PresetStat
                            label="TDP"
                            value={
                              preset.tdp ??
                              "Not set"
                            }
                          />

                          <PresetStat
                            label="Average"
                            value={
                              preset.averageFps !==
                              null
                                ? `${preset.averageFps} FPS`
                                : "Not set"
                            }
                            highlighted
                          />

                          <PresetStat
                            label="1% Low"
                            value={
                              preset.onePercentLow !==
                              null
                                ? `${preset.onePercentLow} FPS`
                                : "Not set"
                            }
                          />
                        </div>

                        <div className="flex flex-row items-center justify-between gap-3 lg:flex-col lg:items-end">
                          {preset.communityRating !==
                            null ? (
                            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/[0.07] px-4 py-3 text-right">
                              <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-yellow-500">
                                Rating
                              </p>

                              <p className="mt-1 text-xl font-black text-yellow-300">
                                ★{" "}
                                {preset.communityRating.toFixed(
                                  1,
                                )}
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-right">
                              <p className="text-[0.52rem] font-black uppercase tracking-[0.12em] text-slate-600">
                                Rating
                              </p>

                              <p className="mt-1 font-black text-slate-400">
                                Unrated
                              </p>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              togglePreset(
                                preset.id,
                              )
                            }
                            className="atlas-button-primary whitespace-nowrap"
                          >
                            {isExpanded
                              ? "Hide settings"
                              : "View settings"}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-white/[0.06] bg-black/20 px-4 py-3 text-[0.68rem] text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                        <MetaItem
                          label="Upscaler"
                          value={
                            preset.upscaler ??
                            "Not set"
                          }
                        />

                        <MetaItem
                          label="Battery"
                          value={
                            preset.batteryLife ??
                            "Not set"
                          }
                        />

                        <MetaItem
                          label="Manufacturer"
                          value={
                            preset.handheld
                              ?.manufacturer ??
                            "Unknown"
                          }
                        />

                        <MetaItem
                          label="Detailed settings"
                          value={`${settingsCount} values`}
                        />
                      </div>

                      {isExpanded && (
                        <div className="border-t border-white/[0.07] bg-[#060911] p-4 md:p-5">
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                              <p className="atlas-section-label">
                                Complete configuration
                              </p>

                              <h4 className="mt-1 text-xl font-black">
                                Full settings
                              </h4>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {preset.game && (
                                <Link
                                  href={`/games/${preset.game.slug}`}
                                  className="atlas-button-secondary"
                                >
                                  Open game
                                </Link>
                              )}

                              {preset.handheld && (
                                <Link
                                  href={`/handhelds/${preset.handheld.slug}`}
                                  className="atlas-button-secondary"
                                >
                                  Open handheld
                                </Link>
                              )}
                            </div>
                          </div>

                          {preset.groups.length ===
                          0 ? (
                            <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">
                              No detailed settings
                              available for this preset.
                            </div>
                          ) : (
                            <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                              {preset.groups.map(
                                (group) => (
                                  <section
                                    key={group.id}
                                    className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/20"
                                  >
                                    <div className="border-b border-white/[0.07] px-4 py-3">
                                      <h5 className="text-sm font-black">
                                        {group.name}
                                      </h5>

                                      <p className="mt-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-slate-600">
                                        {
                                          group
                                            .items
                                            .length
                                        }{" "}
                                        settings
                                      </p>
                                    </div>

                                    <dl>
                                      {group.items.map(
                                        (
                                          item,
                                          index,
                                        ) => (
                                          <div
                                            key={
                                              item.id
                                            }
                                            className={`grid grid-cols-[1fr_auto] gap-4 px-4 py-3 ${
                                              index ===
                                              group
                                                .items
                                                .length -
                                                1
                                                ? ""
                                                : "border-b border-white/[0.06]"
                                            }`}
                                          >
                                            <div>
                                              <dt className="text-sm font-bold text-slate-300">
                                                {
                                                  item.label
                                                }
                                              </dt>

                                              {item.note && (
                                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                                  {
                                                    item.note
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            <dd className="text-sm font-black text-cyan-400">
                                              {
                                                item.value
                                              }
                                            </dd>
                                          </div>
                                        ),
                                      )}
                                    </dl>
                                  </section>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                },
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
  const id = `preset-filter-${label
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

function PresetStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlighted
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 text-xs font-black ${
          highlighted
            ? "text-red-400"
            : "text-slate-300"
        }`}
      >
        {value}
      </p>
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
    <div>
      <span className="font-black uppercase tracking-[0.1em] text-slate-600">
        {label}:
      </span>{" "}
      <strong className="text-slate-300">
        {value}
      </strong>
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