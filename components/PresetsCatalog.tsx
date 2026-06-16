"use client";

import Link from "next/link";
import { Fragment, useCallback, useMemo, useState } from "react";
import PresetVoteButton from "./PresetVoteButton";
import { getPresetProfileGuide } from "../lib/preset-guidance";

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
  upvoteCount: number;
  hasUpvoted: boolean;

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

type SortOption =
  | "Newest"
  | "Most upvoted"
  | "Rating"
  | "FPS"
  | "Name";

interface VoteOverride {
  count: number;
  hasUpvoted: boolean;
}

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

function renderTextWithLinks(text: string) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s]+)/gi);

  return parts.map((part, index) => {
    const isUrl = /^(?:https?:\/\/|www\.)/i.test(part);

    if (!isUrl) {
      return <Fragment key={index}>{part}</Fragment>;
    }

    const trailingMatch = part.match(/^(.*?)([),.;!?]*)$/);
    const cleanUrl = trailingMatch?.[1] ?? part;
    const trailingText = trailingMatch?.[2] ?? "";
    const href = cleanUrl.startsWith("www.")
      ? `https://${cleanUrl}`
      : cleanUrl;

    return (
      <Fragment key={index}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="break-all font-bold text-cyan-400 underline decoration-cyan-500/35 underline-offset-4 transition hover:text-white hover:decoration-cyan-300"
        >
          {cleanUrl}
        </a>
        {trailingText}
      </Fragment>
    );
  });
}

export default function PresetsCatalog({
  presets,
  databaseError,
}: PresetsCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [presetFilter, setPresetFilter] = useState<PresetFilter>("All");
  const [gameFilter, setGameFilter] = useState("All");
  const [handheldFilter, setHandheldFilter] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>("Newest");
  const [voteOverrides, setVoteOverrides] = useState<
    Record<string, VoteOverride>
  >({});

  const getVoteState = useCallback(
    (preset: PublicPreset): VoteOverride =>
      voteOverrides[preset.id] ?? {
        count: preset.upvoteCount,
        hasUpvoted: preset.hasUpvoted,
      },
    [voteOverrides],
  );

  function handleVoteChange(
    presetId: string,
    count: number,
    hasUpvoted: boolean,
  ) {
    setVoteOverrides((current) => ({
      ...current,
      [presetId]: {
        count,
        hasUpvoted,
      },
    }));
  }

  const gameOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          presets
            .map((preset) => preset.game?.name)
            .filter(
              (value): value is string =>
                typeof value === "string" && value.length > 0,
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
                typeof value === "string" && value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [presets],
  );

  const filteredPresets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchingPresets = presets.filter((preset) => {
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

      return (
        (normalizedQuery.length === 0 ||
          searchableText.includes(normalizedQuery)) &&
        (presetFilter === "All" || preset.type === presetFilter) &&
        (gameFilter === "All" || preset.game?.name === gameFilter) &&
        (handheldFilter === "All" ||
          preset.handheld?.name === handheldFilter)
      );
    });

    return [...matchingPresets].sort((first, second) => {
      switch (sortOption) {
        case "Most upvoted":
          return getVoteState(second).count - getVoteState(first).count;
        case "Rating":
          return (
            (second.communityRating ?? -1) -
            (first.communityRating ?? -1)
          );
        case "FPS":
          return (second.averageFps ?? -1) - (first.averageFps ?? -1);
        case "Name":
          return first.name.localeCompare(second.name);
        default:
          return (
            new Date(second.publishedAt ?? 0).getTime() -
            new Date(first.publishedAt ?? 0).getTime()
          );
      }
    });
  }, [
    presets,
    searchQuery,
    presetFilter,
    gameFilter,
    handheldFilter,
    sortOption,
    getVoteState,
  ]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    presetFilter !== "All" ||
    gameFilter !== "All" ||
    handheldFilter !== "All" ||
    sortOption !== "Newest";

  const ratedPresets = presets.filter(
    (preset) => preset.communityRating !== null,
  );

  const averageRating =
    ratedPresets.length > 0
      ? (
          ratedPresets.reduce(
            (total, preset) => total + (preset.communityRating ?? 0),
            0,
          ) / ratedPresets.length
        ).toFixed(1)
      : "—";

  const performancePresets = presets.filter(
    (preset) => preset.type === "Performance",
  ).length;

  const totalSettings = presets.reduce(
    (presetTotal, preset) =>
      presetTotal +
      preset.groups.reduce(
        (groupTotal, group) => groupTotal + group.items.length,
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

  return (
    <main className="atlas-page min-w-0 overflow-x-hidden pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-9 sm:py-12">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="min-w-0">
              <p className="atlas-section-label">Performance profiles</p>

              <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:mt-4 sm:text-6xl">
                Tested settings.
                <span className="block">
                  Zero <span className="atlas-text-red">guesswork.</span>
                </span>
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:leading-8">
                Browse transparent performance profiles, understand the target
                and trade-offs, then open the exact configuration on its own
                shareable page.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <HeroStat label="Published" value={presets.length.toString()} />
              <HeroStat
                label="Average rating"
                value={averageRating}
                highlighted
              />
              <HeroStat
                label="Performance"
                value={performancePresets.toString()}
              />
              <HeroStat label="Settings" value={totalSettings.toString()} />
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell min-w-0 pt-5 sm:pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">Could not load the preset database.</p>
            <p className="mt-2 break-words">{databaseError}</p>
          </div>
        )}

        <section className="atlas-panel min-w-0 p-4 md:p-5">
          <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))_auto] xl:gap-4">
            <div className="col-span-2 min-w-0 xl:col-span-1">
              <FilterLabel htmlFor="preset-search" label="Search" />

              <div className="relative min-w-0">
                <input
                  id="preset-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search game, handheld, setting or upscaler..."
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
              label="Sort"
              value={sortOption}
              options={[
                "Newest",
                "Most upvoted",
                "Rating",
                "FPS",
                "Name",
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
            {presetFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPresetFilter(filter)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[0.64rem] font-black uppercase tracking-[0.08em] transition sm:text-[0.68rem] sm:tracking-[0.1em] ${getActiveFilterStyle(
                  filter,
                  presetFilter,
                )}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div>
              <p className="atlas-section-label">Choose your target</p>
              <h2 className="mt-1 text-xl font-black">What each profile is built for</h2>
            </div>

            <p className="max-w-xl text-right text-xs leading-5 text-slate-600">
              There is no magical universal preset. Pick the goal that matches how
              you actually play, then use the measured data to judge the trade-off.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {presetFilters
              .filter((filter): filter is PublicPresetType => filter !== "All")
              .map((type) => {
                const guide = getPresetProfileGuide(type);

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPresetFilter(type)}
                    className={`min-w-0 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 ${
                      presetFilter === type
                        ? getPresetStyle(type)
                        : "border-white/[0.07] bg-black/20"
                    }`}
                  >
                    <p className="text-[0.54rem] font-black uppercase tracking-[0.14em] text-slate-500">
                      {guide.shortLabel}
                    </p>
                    <h3 className="mt-2 text-base font-black text-white">
                      {guide.label}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {guide.bestFor}
                    </p>
                  </button>
                );
              })}
          </div>
        </section>

        <section className="mt-7 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div>
              <p className="atlas-section-label">Preset library</p>
              <h2 className="mt-1 text-xl font-black">
                {filteredPresets.length}{" "}
                {filteredPresets.length === 1 ? "preset" : "presets"}
              </h2>
            </div>

            <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-slate-600 sm:text-xs sm:tracking-[0.15em]">
              Open any preset for the full configuration
            </p>
          </div>

          {filteredPresets.length === 0 ? (
            <div className="atlas-panel mt-5 p-10 text-center">
              <p className="atlas-section-label">No matches</p>
              <h3 className="mt-3 text-3xl font-black">No presets found</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Change the filters or publish another preset through the admin
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
            <div className="mt-5 space-y-4">
              {filteredPresets.map((preset) => {
                const summaryText =
                  preset.summary ??
                  "Tested handheld performance configuration.";

                const settingsCount = preset.groups.reduce(
                  (total, group) => total + group.items.length,
                  0,
                );

                const voteState = getVoteState(preset);
                const profileGuide = getPresetProfileGuide(preset.type);
                const coverageBadges = [
                  preset.averageFps !== null && preset.onePercentLow !== null
                    ? "Measured FPS"
                    : null,
                  preset.resolution && preset.tdp ? "Exact test target" : null,
                  settingsCount > 0 ? `${settingsCount} exact settings` : null,
                  voteState.count > 0 || preset.communityRating !== null
                    ? "Community signal"
                    : null,
                ].filter((value): value is string => Boolean(value));

                return (
                  <article
                    key={preset.id}
                    className="atlas-card atlas-card-hover min-w-0 overflow-hidden"
                  >
                    <div className="min-w-0 p-4 md:p-5">
                      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_10.5rem] lg:items-start">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[0.54rem] font-black uppercase tracking-[0.1em] ${getPresetStyle(
                                preset.type,
                              )}`}
                            >
                              {preset.type}
                            </span>

                            <span className="min-w-0 truncate text-[0.58rem] font-black uppercase tracking-[0.1em] text-cyan-400 sm:text-[0.62rem] sm:tracking-[0.12em]">
                              {preset.game?.name ?? "Unknown game"}
                            </span>

                            <span className="text-[0.58rem] text-slate-600 sm:text-[0.62rem]">
                              {formatDate(preset.publishedAt)}
                            </span>
                          </div>

                          <Link
                            href={`/presets/${preset.id}`}
                            className="group mt-3 block w-fit max-w-full"
                          >
                            <h3 className="break-words text-xl font-black leading-tight transition group-hover:text-red-400 sm:text-2xl">
                              {preset.name}
                            </h3>
                          </Link>

                          <p className="mt-1 text-sm font-bold text-slate-400">
                            {preset.handheld?.name ?? "Unknown handheld"}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-[0.56rem] font-black uppercase tracking-[0.13em] text-slate-600">
                              Best for
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              {profileGuide.bestFor}
                            </span>
                          </div>

                          <div className="mt-4 max-w-4xl rounded-xl border border-white/[0.06] bg-black/15 p-4">
                            <p className="line-clamp-3 whitespace-pre-line break-words [overflow-wrap:anywhere] text-sm leading-7 text-slate-400">
                              {renderTextWithLinks(summaryText)}
                            </p>
                          </div>

                          {coverageBadges.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {coverageBadges.map((badge) => (
                                <span
                                  key={badge}
                                  className="rounded-full border border-white/[0.08] bg-black/25 px-2.5 py-1 text-[0.54rem] font-black uppercase tracking-[0.09em] text-slate-400"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
                          {preset.communityRating !== null && (
                            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/[0.07] px-3 py-2.5 text-left lg:text-center">
                              <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-yellow-500">
                                Rating
                              </p>
                              <p className="mt-1 text-lg font-black text-yellow-300 sm:text-xl">
                                ★ {preset.communityRating.toFixed(1)}
                              </p>
                            </div>
                          )}

                          <PresetVoteButton
                            presetId={preset.id}
                            initialCount={preset.upvoteCount}
                            initialHasUpvoted={preset.hasUpvoted}
                            count={voteState.count}
                            hasUpvoted={voteState.hasUpvoted}
                            onVoteChange={handleVoteChange}
                          />

                          <Link
                            href={`/presets/${preset.id}`}
                            className="atlas-button-primary whitespace-nowrap text-center"
                          >
                            View full preset
                          </Link>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <PresetStat
                          label="Resolution"
                          value={preset.resolution ?? "Not set"}
                        />
                        <PresetStat
                          label="TDP"
                          value={preset.tdp ?? "Not set"}
                        />
                        <PresetStat
                          label="Average"
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
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/[0.06] bg-black/20 px-4 py-3 text-[0.64rem] text-slate-500 sm:text-[0.68rem] lg:grid-cols-4">
                      <MetaItem
                        label="Upscaler"
                        value={preset.upscaler ?? "Not set"}
                      />
                      <MetaItem
                        label="Battery"
                        value={preset.batteryLife ?? "Not set"}
                      />
                      <MetaItem
                        label="Manufacturer"
                        value={preset.handheld?.manufacturer ?? "Unknown"}
                      />
                      <MetaItem
                        label="Detailed settings"
                        value={`${settingsCount} values`}
                      />
                    </div>
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
  const id = `preset-filter-${label.toLowerCase().replaceAll(" ", "-")}`;

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
      className={`min-w-0 rounded-lg border p-3 ${
        highlighted
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.48rem] font-black uppercase tracking-[0.1em] text-slate-600 sm:text-[0.5rem] sm:tracking-[0.12em]">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-[0.68rem] font-black leading-5 sm:text-xs ${
          highlighted ? "text-red-400" : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 break-words">
      <span className="font-black uppercase tracking-[0.08em] text-slate-600 sm:tracking-[0.1em]">
        {label}:
      </span>{" "}
      <strong className="text-slate-300">{value}</strong>
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
