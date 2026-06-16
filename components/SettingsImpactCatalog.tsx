"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ImpactMeter from "./ImpactMeter";
import {
  SETTING_IMPACT_CATEGORIES,
  getSettingCommonnessLabel,
  type SettingImpactEntry,
} from "../lib/settings-impact";

interface SettingsImpactCatalogProps {
  entries: SettingImpactEntry[];
}

type GoalFilter = "all" | "fps" | "vram" | "cpu";
type DepthFilter = "common" | "advanced" | "all";

const goalOptions: Array<{
  value: GoalFilter;
  label: string;
  description: string;
}> = [
  {
    value: "all",
    label: "Browse all",
    description: "Explore settings without prioritizing one bottleneck.",
  },
  {
    value: "fps",
    label: "Need more FPS",
    description: "High performance cost with a smaller visual trade-off.",
  },
  {
    value: "vram",
    label: "VRAM warning",
    description: "Settings that can consume the most video memory.",
  },
  {
    value: "cpu",
    label: "CPU bottleneck",
    description: "Settings that can pressure the processor and 1% lows.",
  },
];

function matchesGoal(entry: SettingImpactEntry, goal: GoalFilter) {
  switch (goal) {
    case "fps":
      return entry.performance_impact >= 4 && entry.visual_impact <= 4;
    case "vram":
      return entry.vram_impact >= 4;
    case "cpu":
      return entry.cpu_impact >= 4;
    default:
      return true;
  }
}

function matchesDepth(entry: SettingImpactEntry, depth: DepthFilter) {
  if (depth === "all") {
    return true;
  }

  if (depth === "advanced") {
    return entry.commonness !== "specialized";
  }

  return entry.commonness === "common";
}

function goalScore(entry: SettingImpactEntry, goal: GoalFilter) {
  switch (goal) {
    case "fps":
      return entry.performance_impact * 4 - entry.visual_impact;
    case "vram":
      return entry.vram_impact * 4 - entry.visual_impact;
    case "cpu":
      return entry.cpu_impact * 4 - entry.visual_impact;
    default:
      return 0;
  }
}

export default function SettingsImpactCatalog({
  entries,
}: SettingsImpactCatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [goal, setGoal] = useState<GoalFilter>("all");
  const [depth, setDepth] = useState<DepthFilter>("common");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matches = entries.filter((entry) => {
      const aliases = (entry.setting_impact_aliases ?? [])
        .map((alias) => alias.alias)
        .join(" ");
      const searchable = [
        entry.name,
        entry.category,
        entry.summary,
        entry.description ?? "",
        aliases,
      ]
        .join(" ")
        .toLowerCase();

      const depthMatches = normalizedQuery
        ? true
        : matchesDepth(entry, depth);

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (category === "All" || entry.category === category) &&
        matchesGoal(entry, goal) &&
        depthMatches
      );
    });

    return [...matches].sort((first, second) => {
      if (goal !== "all") {
        const scoreDifference = goalScore(second, goal) - goalScore(first, goal);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }
      }

      const depthOrder = { common: 0, advanced: 1, specialized: 2 };
      const depthDifference =
        depthOrder[first.commonness] - depthOrder[second.commonness];

      if (depthDifference !== 0) {
        return depthDifference;
      }

      return first.name.localeCompare(second.name);
    });
  }, [category, depth, entries, goal, query]);

  const hasFilters =
    query.length > 0 ||
    category !== "All" ||
    goal !== "all" ||
    depth !== "common";

  function resetFilters() {
    setQuery("");
    setCategory("All");
    setGoal("all");
    setDepth("common");
  }

  return (
    <>
      <section className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {goalOptions.map((option) => {
          const active = goal === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setGoal(option.value)}
              className={`min-w-0 rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-cyan-400/45 bg-cyan-500/[0.1] shadow-[0_0_28px_rgba(24,215,255,0.08)]"
                  : "border-white/[0.07] bg-black/20 hover:border-white/20 hover:bg-white/[0.025]"
              }`}
            >
              <p className={`text-sm font-black ${active ? "text-cyan-300" : "text-white"}`}>
                {option.label}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {option.description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="atlas-panel mt-5 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_14rem_auto]">
          <label className="min-w-0">
            <span className="sr-only">Search graphics settings</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shadows, textures, frame generation…"
              className="h-11 w-full rounded-xl px-4 text-sm"
            />
          </label>

          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full rounded-xl px-3 text-sm font-bold"
            >
              <option value="All">All categories</option>
              {SETTING_IMPACT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Choose guide depth</span>
            <select
              value={depth}
              onChange={(event) => setDepth(event.target.value as DepthFilter)}
              className="h-11 w-full rounded-xl px-3 text-sm font-bold"
            >
              <option value="common">Common settings</option>
              <option value="advanced">Common + advanced</option>
              <option value="all">Everything</option>
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="atlas-button-secondary h-11 whitespace-nowrap"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-600">
            {filteredEntries.length} {filteredEntries.length === 1 ? "setting" : "settings"}
          </p>
          <p className="max-w-2xl text-xs leading-5 text-slate-500">
            Common settings stay visible by default. Search automatically checks the entire database, including specialized options.
          </p>
        </div>
      </section>

      {filteredEntries.length === 0 ? (
        <section className="atlas-panel mt-5 border-dashed p-10 text-center">
          <h2 className="text-2xl font-black">No matching setting</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Try a broader search or reset the filters. Graphics menus love inventing five names for the same damn switch.
          </p>
          <button type="button" onClick={resetFilters} className="atlas-button-secondary mt-5">
            Show common settings
          </button>
        </section>
      ) : (
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredEntries.map((entry) => (
            <article key={entry.id} className="atlas-card min-w-0 p-5 sm:p-6">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[0.52rem] font-black uppercase tracking-[0.13em] text-cyan-500">
                      {entry.category}
                    </p>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[0.48rem] font-black uppercase tracking-[0.1em] text-slate-500">
                      {getSettingCommonnessLabel(entry.commonness)}
                    </span>
                  </div>
                  <h2 className="mt-2 break-words text-2xl font-black">
                    {entry.name}
                  </h2>
                </div>

                {entry.atlas_verified && (
                  <span className="rounded-full border border-green-500/25 bg-green-500/[0.08] px-2.5 py-1 text-[0.52rem] font-black uppercase tracking-[0.1em] text-green-300">
                    Atlas reviewed
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {entry.summary}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ImpactMeter label="FPS" value={entry.performance_impact} metric="performance" />
                <ImpactMeter label="Visual" value={entry.visual_impact} metric="visual" />
                <ImpactMeter label="VRAM" value={entry.vram_impact} metric="vram" />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                <p className="text-xs text-slate-600">
                  CPU: <strong className="text-slate-400">{entry.cpu_impact}/5</strong>
                  {" · "}
                  Restart: <strong className="text-slate-400">{entry.restart_required ? "May be required" : "Usually no"}</strong>
                </p>
                <Link href={`/settings-impact/${entry.slug}`} className="text-sm font-black text-cyan-400 transition hover:text-white">
                  Learn what it does →
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
