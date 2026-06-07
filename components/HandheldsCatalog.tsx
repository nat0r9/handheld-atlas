"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicHandheld } from "../app/handhelds/page";

interface HandheldsCatalogProps {
  handhelds: PublicHandheld[];
  databaseError: string | null;
}

type SortOption =
  | "Name"
  | "Manufacturer"
  | "Status";

function getDeviceStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "current":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "upcoming":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "discontinued":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

export default function HandheldsCatalog({
  handhelds,
  databaseError,
}: HandheldsCatalogProps) {
  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    manufacturerFilter,
    setManufacturerFilter,
  ] = useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [
    processorFilter,
    setProcessorFilter,
  ] = useState("All");

  const [osFilter, setOsFilter] =
    useState("All");

  const [sortOption, setSortOption] =
    useState<SortOption>("Name");

  const manufacturerOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds.map(
            (handheld) =>
              handheld.manufacturer,
          ),
        ),
      ).sort(),
    ],
    [handhelds],
  );

  const statusOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds.map(
            (handheld) =>
              handheld.deviceStatus,
          ),
        ),
      ).sort(),
    ],
    [handhelds],
  );

  const processorOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds
            .map(
              (handheld) =>
                handheld.processor,
            )
            .filter(
              (
                value,
              ): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [handhelds],
  );

  const osOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds
            .map(
              (handheld) =>
                handheld.operatingSystem,
            )
            .filter(
              (
                value,
              ): value is string =>
                typeof value === "string" &&
                value.length > 0,
            ),
        ),
      ).sort(),
    ],
    [handhelds],
  );

  const filteredHandhelds = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    const matchingHandhelds =
      handhelds.filter((handheld) => {
        const searchableText = [
          handheld.name,
          handheld.manufacturer,
          handheld.deviceStatus,
          handheld.operatingSystem ?? "",
          handheld.processor ?? "",
          handheld.memory ?? "",
          handheld.storage ?? "",
          handheld.displaySize ?? "",
          handheld.resolution ?? "",
          handheld.refreshRate ?? "",
          handheld.battery ?? "",
          handheld.weight ?? "",
          handheld.tagline ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedQuery.length === 0 ||
          searchableText.includes(
            normalizedQuery,
          );

        const matchesManufacturer =
          manufacturerFilter === "All" ||
          handheld.manufacturer ===
            manufacturerFilter;

        const matchesStatus =
          statusFilter === "All" ||
          handheld.deviceStatus ===
            statusFilter;

        const matchesProcessor =
          processorFilter === "All" ||
          handheld.processor ===
            processorFilter;

        const matchesOs =
          osFilter === "All" ||
          handheld.operatingSystem ===
            osFilter;

        return (
          matchesSearch &&
          matchesManufacturer &&
          matchesStatus &&
          matchesProcessor &&
          matchesOs
        );
      });

    return [...matchingHandhelds].sort(
      (first, second) => {
        switch (sortOption) {
          case "Manufacturer":
            return first.manufacturer.localeCompare(
              second.manufacturer,
            );

          case "Status":
            return first.deviceStatus.localeCompare(
              second.deviceStatus,
            );

          default:
            return first.name.localeCompare(
              second.name,
            );
        }
      },
    );
  }, [
    handhelds,
    searchQuery,
    manufacturerFilter,
    statusFilter,
    processorFilter,
    osFilter,
    sortOption,
  ]);

  const currentDevices =
    handhelds.filter(
      (handheld) =>
        handheld.deviceStatus.toLowerCase() ===
        "current",
    ).length;

  const upcomingDevices =
    handhelds.filter(
      (handheld) =>
        handheld.deviceStatus.toLowerCase() ===
        "upcoming",
    ).length;

  const manufacturerCount =
    new Set(
      handhelds.map(
        (handheld) =>
          handheld.manufacturer,
      ),
    ).size;

  const hasActiveFilters =
    searchQuery.length > 0 ||
    manufacturerFilter !== "All" ||
    statusFilter !== "All" ||
    processorFilter !== "All" ||
    osFilter !== "All" ||
    sortOption !== "Name";

  function resetFilters() {
    setSearchQuery("");
    setManufacturerFilter("All");
    setStatusFilter("All");
    setProcessorFilter("All");
    setOsFilter("All");
    setSortOption("Name");
  }

  return (
    <main className="atlas-page pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="atlas-section-label">
                Handheld database
              </p>

              <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                Every device.
                <span className="block">
                  One{" "}
                  <span className="atlas-text-red">
                    atlas.
                  </span>
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Explore published handhelds,
                compare hardware specifications
                and jump straight into presets
                and benchmarks built around each
                device.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <HeroStat
                label="Published"
                value={handhelds.length.toString()}
              />

              <HeroStat
                label="Current"
                value={currentDevices.toString()}
                highlighted
              />

              <HeroStat
                label="Upcoming"
                value={upcomingDevices.toString()}
              />

              <HeroStat
                label="Brands"
                value={manufacturerCount.toString()}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">
              Could not load the handheld
              database.
            </p>

            <p className="mt-2 break-words">
              {databaseError}
            </p>
          </div>
        )}

        <section className="atlas-panel p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.8fr_repeat(5,minmax(0,1fr))_auto]">
            <div>
              <FilterLabel
                htmlFor="handheld-search"
                label="Search"
              />

              <div className="relative">
                <input
                  id="handheld-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search ASUS, Steam Deck, Z1 Extreme..."
                  className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3 pr-10 text-sm"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <SearchIcon />
                </span>
              </div>
            </div>

            <FilterSelect
              label="Manufacturer"
              value={manufacturerFilter}
              options={manufacturerOptions}
              onChange={
                setManufacturerFilter
              }
            />

            <FilterSelect
              label="Status"
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
            />

            <FilterSelect
              label="Processor"
              value={processorFilter}
              options={processorOptions}
              onChange={setProcessorFilter}
            />

            <FilterSelect
              label="Operating system"
              value={osFilter}
              options={osOptions}
              onChange={setOsFilter}
            />

            <FilterSelect
              label="Sort"
              value={sortOption}
              options={[
                "Name",
                "Manufacturer",
                "Status",
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
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-3">
            <div>
              <p className="atlas-section-label">
                Device library
              </p>

              <h2 className="mt-1 text-xl font-black">
                {filteredHandhelds.length}{" "}
                {filteredHandhelds.length === 1
                  ? "device"
                  : "devices"}
              </h2>
            </div>

            <Link
              href="/compare"
              className="atlas-button-secondary"
            >
              Compare devices
            </Link>
          </div>

          {filteredHandhelds.length === 0 ? (
            <div className="atlas-panel mt-5 p-10 text-center">
              <p className="atlas-section-label">
                No matches
              </p>

              <h3 className="mt-3 text-3xl font-black">
                No handhelds found
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                Change the filters or
                publish another handheld
                through the admin dashboard.
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
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredHandhelds.map(
                (handheld) => (
                  <Link
                    key={handheld.id}
                    href={`/handhelds/${handheld.slug}`}
                    className="group"
                  >
                    <article className="atlas-card atlas-card-hover atlas-card-cyan flex h-full flex-col">
                      <div className="relative min-h-72 overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(circle_at_50%_65%,rgba(24,215,255,0.13),transparent_38%),linear-gradient(135deg,#0b101b,#05070d)]">
                        <div className="absolute left-4 top-4 z-10">
                          <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-cyan-400">
                            {
                              handheld.manufacturer
                            }
                          </p>
                        </div>

                        <div className="absolute right-4 top-4 z-10">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] backdrop-blur ${getDeviceStatusStyle(
                              handheld.deviceStatus,
                            )}`}
                          >
                            {
                              handheld.deviceStatus
                            }
                          </span>
                        </div>

                        <div className="relative h-72 w-full">
                          {handheld.imageUrl ? (
                            <Image
                              src={
                                handheld.imageUrl
                              }
                              alt={handheld.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-contain object-center p-7 drop-shadow-[0_30px_40px_rgba(0,0,0,0.75)] transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">
                                Image coming soon
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="pointer-events-none absolute inset-x-16 bottom-6 h-8 rounded-full bg-cyan-500/10 blur-2xl" />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="text-2xl font-black leading-tight transition group-hover:text-cyan-400">
                          {handheld.name}
                        </h3>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                          {handheld.tagline ??
                            "Detailed handheld specifications and performance data."}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <InfoTile
                            label="Processor"
                            value={
                              handheld.processor ??
                              "Not set"
                            }
                            highlighted
                          />

                          <InfoTile
                            label="Memory"
                            value={
                              handheld.memory ??
                              "Not set"
                            }
                          />

                          <InfoTile
                            label="Display"
                            value={
                              handheld.displaySize ??
                              "Not set"
                            }
                          />

                          <InfoTile
                            label="Battery"
                            value={
                              handheld.battery ??
                              "Not set"
                            }
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <MiniMeta
                            label="Resolution"
                            value={
                              handheld.resolution ??
                              "Not set"
                            }
                          />

                          <MiniMeta
                            label="Refresh"
                            value={
                              handheld.refreshRate ??
                              "Not set"
                            }
                          />
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
                          <span className="truncate text-xs text-slate-600">
                            {handheld.operatingSystem ??
                              "OS not set"}
                          </span>

                          <span className="shrink-0 text-xs font-black text-cyan-400 transition group-hover:text-white">
                            View profile →
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ),
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
  const id = `handheld-filter-${label
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

function InfoTile({
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
          ? "border-cyan-500/25 bg-cyan-500/[0.06]"
          : "border-white/[0.07] bg-black/20"
      }`}
    >
      <p className="text-[0.5rem] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 line-clamp-2 text-xs font-black leading-5 ${
          highlighted
            ? "text-cyan-400"
            : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MiniMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2">
      <p className="text-[0.48rem] font-black uppercase tracking-[0.1em] text-slate-700">
        {label}
      </p>

      <p className="mt-1 truncate text-[0.68rem] font-bold text-slate-400">
        {value}
      </p>
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