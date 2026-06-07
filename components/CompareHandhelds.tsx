"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export interface CompareHandheld {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  deviceStatus: string;
  operatingSystem: string | null;
  processor: string | null;
  memory: string | null;
  storage: string | null;
  displaySize: string | null;
  resolution: string | null;
  refreshRate: string | null;
  battery: string | null;
  weight: string | null;
  imageUrl: string | null;
  tagline: string | null;
}

interface CompareHandheldsProps {
  handhelds: CompareHandheld[];
  databaseError: string | null;
}

const maximumComparedHandhelds = 3;

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

function safeValue(value: string | null) {
  return value ?? "Not set";
}

export default function CompareHandhelds({
  handhelds,
  databaseError,
}: CompareHandheldsProps) {
  const defaultSelectedSlugs = handhelds
    .slice(0, 2)
    .map((handheld) => handheld.slug);

  const [selectedSlugs, setSelectedSlugs] =
    useState<string[]>(defaultSelectedSlugs);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    manufacturerFilter,
    setManufacturerFilter,
  ] = useState("All");

  const selectedHandhelds = useMemo(
    () =>
      selectedSlugs
        .map((slug) =>
          handhelds.find(
            (handheld) =>
              handheld.slug === slug,
          ),
        )
        .filter(
          (
            handheld,
          ): handheld is CompareHandheld =>
            handheld !== undefined,
        ),
    [handhelds, selectedSlugs],
  );

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

  const filteredHandhelds = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    return handhelds.filter((handheld) => {
      const searchableText = [
        handheld.name,
        handheld.manufacturer,
        handheld.processor ?? "",
        handheld.operatingSystem ?? "",
        handheld.memory ?? "",
        handheld.resolution ?? "",
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

      return (
        matchesSearch &&
        matchesManufacturer
      );
    });
  }, [
    handhelds,
    searchQuery,
    manufacturerFilter,
  ]);

  const selectedManufacturers =
    new Set(
      selectedHandhelds.map(
        (handheld) =>
          handheld.manufacturer,
      ),
    ).size;

  const selectedOperatingSystems =
    new Set(
      selectedHandhelds
        .map(
          (handheld) =>
            handheld.operatingSystem,
        )
        .filter(Boolean),
    ).size;

  function toggleHandheld(slug: string) {
    setSelectedSlugs((currentSlugs) => {
      const isSelected =
        currentSlugs.includes(slug);

      if (isSelected) {
        return currentSlugs.filter(
          (currentSlug) =>
            currentSlug !== slug,
        );
      }

      if (
        currentSlugs.length >=
        maximumComparedHandhelds
      ) {
        return currentSlugs;
      }

      return [...currentSlugs, slug];
    });
  }

  function clearComparison() {
    setSelectedSlugs([]);
  }

  function resetSelector() {
    setSearchQuery("");
    setManufacturerFilter("All");
  }

  const selectorHasFilters =
    searchQuery.length > 0 ||
    manufacturerFilter !== "All";

  return (
    <main className="atlas-page pb-14 text-white">
      <section className="border-b border-white/[0.06]">
        <div className="atlas-shell py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="atlas-section-label">
                Device comparison
              </p>

              <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
                Put handhelds
                <span className="block">
                  head to{" "}
                  <span className="atlas-text-red">
                    head.
                  </span>
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Select up to three devices and compare
                hardware, displays, battery, operating
                systems and physical specifications
                side by side.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <HeroStat
                label="Available"
                value={handhelds.length.toString()}
              />

              <HeroStat
                label="Selected"
                value={`${selectedSlugs.length}/${maximumComparedHandhelds}`}
                highlighted
              />

              <HeroStat
                label="Brands"
                value={selectedManufacturers.toString()}
              />

              <HeroStat
                label="Systems"
                value={selectedOperatingSystems.toString()}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="atlas-shell pt-6">
        {databaseError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <p className="font-black">
              Could not load the handheld database.
            </p>

            <p className="mt-2 break-words">
              {databaseError}
            </p>
          </div>
        )}

        <section className="atlas-panel p-4 md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <p className="atlas-section-label">
                Device selector
              </p>

              <h2 className="mt-1 text-xl font-black">
                Choose up to three handhelds
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectorHasFilters && (
                <button
                  type="button"
                  onClick={resetSelector}
                  className="atlas-button-secondary"
                >
                  Reset selector
                </button>
              )}

              {selectedSlugs.length > 0 && (
                <button
                  type="button"
                  onClick={clearComparison}
                  className="atlas-button-primary"
                >
                  Clear comparison
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
            <div>
              <FilterLabel
                htmlFor="compare-search"
                label="Search devices"
              />

              <div className="relative">
                <input
                  id="compare-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search device, brand, processor or OS..."
                  className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-4 py-3 pr-10 text-sm"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                  <SearchIcon />
                </span>
              </div>
            </div>

            <div>
              <FilterLabel
                htmlFor="manufacturer-filter"
                label="Manufacturer"
              />

              <select
                id="manufacturer-filter"
                value={manufacturerFilter}
                onChange={(event) =>
                  setManufacturerFilter(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 py-3 text-sm"
              >
                {manufacturerOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {filteredHandhelds.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-slate-500">
              No handhelds match your filters.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredHandhelds.map(
                (handheld) => {
                  const isSelected =
                    selectedSlugs.includes(
                      handheld.slug,
                    );

                  const selectionLimitReached =
                    selectedSlugs.length >=
                      maximumComparedHandhelds &&
                    !isSelected;

                  return (
                    <button
                      key={handheld.id}
                      type="button"
                      disabled={
                        selectionLimitReached
                      }
                      onClick={() =>
                        toggleHandheld(
                          handheld.slug,
                        )
                      }
                      className={`group grid grid-cols-[4.25rem_1fr_auto] items-center gap-3 rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-red-500/40 bg-red-500/[0.08]"
                          : "border-white/[0.07] bg-black/20 hover:border-cyan-500/35 hover:bg-white/[0.02]"
                      } disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      <div className="relative h-16 overflow-hidden rounded-lg border border-white/[0.06] bg-gradient-to-br from-slate-900 to-black">
                        {handheld.imageUrl ? (
                          <Image
                            src={handheld.imageUrl}
                            alt={handheld.name}
                            fill
                            sizes="68px"
                            className="object-contain p-1.5"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs font-black text-slate-700">
                            HA
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`truncate font-black transition ${
                            isSelected
                              ? "text-red-400"
                              : "text-slate-200 group-hover:text-cyan-400"
                          }`}
                        >
                          {handheld.name}
                        </p>

                        <p className="mt-1 truncate text-[0.58rem] font-black uppercase tracking-[0.12em] text-slate-600">
                          {handheld.manufacturer}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {handheld.processor ??
                            "Processor not set"}
                        </p>
                      </div>

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-black transition ${
                          isSelected
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-white/[0.08] bg-black/20 text-slate-500 group-hover:border-cyan-500/40 group-hover:text-cyan-400"
                        }`}
                      >
                        {isSelected ? "✓" : "+"}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </section>

        {selectedHandhelds.length === 0 ? (
          <section className="atlas-panel mt-5 p-12 text-center">
            <p className="atlas-section-label">
              Comparison empty
            </p>

            <h2 className="mt-3 text-3xl font-black">
              No handhelds selected
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
              Select at least one device above to begin
              building the comparison.
            </p>
          </section>
        ) : (
          <>
            <section
              className={`mt-5 grid gap-4 ${
                selectedHandhelds.length === 1
                  ? "md:grid-cols-1"
                  : selectedHandhelds.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-3"
              }`}
            >
              {selectedHandhelds.map(
                (handheld, index) => (
                  <article
                    key={handheld.id}
                    className="atlas-card atlas-card-hover atlas-card-cyan"
                  >
                    <div className="relative min-h-64 overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(circle_at_50%_65%,rgba(24,215,255,0.12),transparent_38%),linear-gradient(135deg,#0b101b,#05070d)]">
                      <div className="absolute left-4 top-4 z-10">
                        <span className="rounded-full border border-white/[0.08] bg-black/30 px-3 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-slate-400 backdrop-blur">
                          Device {index + 1}
                        </span>
                      </div>

                      <div className="absolute right-4 top-4 z-10">
                        <span
                          className={`rounded-full border px-3 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] backdrop-blur ${getDeviceStatusStyle(
                            handheld.deviceStatus,
                          )}`}
                        >
                          {handheld.deviceStatus}
                        </span>
                      </div>

                      {handheld.imageUrl ? (
                        <div className="relative h-64 w-full">
                          <Image
                            src={handheld.imageUrl}
                            alt={handheld.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-contain object-center p-7 drop-shadow-[0_30px_40px_rgba(0,0,0,0.75)]"
                          />
                        </div>
                      ) : (
                        <div className="flex h-64 items-center justify-center text-xs font-black uppercase tracking-[0.15em] text-slate-700">
                          Device image coming soon
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-[0.58rem] font-black uppercase tracking-[0.15em] text-cyan-400">
                        {handheld.manufacturer}
                      </p>

                      <h2 className="mt-2 text-2xl font-black">
                        {handheld.name}
                      </h2>

                      <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">
                        {handheld.tagline ??
                          "Complete hardware profile and handheld performance information."}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <QuickStat
                          label="Processor"
                          value={safeValue(
                            handheld.processor,
                          )}
                          highlighted
                        />

                        <QuickStat
                          label="Memory"
                          value={safeValue(
                            handheld.memory,
                          )}
                        />

                        <QuickStat
                          label="Battery"
                          value={safeValue(
                            handheld.battery,
                          )}
                        />

                        <QuickStat
                          label="Display"
                          value={safeValue(
                            handheld.displaySize,
                          )}
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link
                          href={`/handhelds/${handheld.slug}`}
                          className="atlas-button-secondary"
                        >
                          View profile
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            toggleHandheld(
                              handheld.slug,
                            )
                          }
                          className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-4 py-2.5 text-xs font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </section>

            <section className="atlas-panel mt-5 overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
                <div>
                  <p className="atlas-section-label">
                    Specification wall
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Side-by-side comparison
                  </h2>
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                  {selectedHandhelds.length} devices selected
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="min-w-48 px-5 py-4 text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-600">
                        Specification
                      </th>

                      {selectedHandhelds.map(
                        (handheld) => (
                          <th
                            key={handheld.id}
                            className="min-w-64 px-5 py-4"
                          >
                            <p className="text-[0.56rem] font-black uppercase tracking-[0.14em] text-cyan-400">
                              {handheld.manufacturer}
                            </p>

                            <h3 className="mt-1 text-lg font-black">
                              {handheld.name}
                            </h3>
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    <ComparisonRow
                      label="Operating system"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.operatingSystem,
                          ),
                      )}
                    />

                    <ComparisonRow
                      label="Processor"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.processor,
                          ),
                      )}
                      highlighted
                    />

                    <ComparisonRow
                      label="Memory"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.memory,
                          ),
                      )}
                    />

                    <ComparisonRow
                      label="Storage"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.storage,
                          ),
                      )}
                    />

                    <ComparisonRow
                      label="Display"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.displaySize,
                          ),
                      )}
                    />

                    <ComparisonRow
                      label="Resolution"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.resolution,
                          ),
                      )}
                    />

                    <ComparisonRow
                      label="Refresh rate"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.refreshRate,
                          ),
                      )}
                    />

                    <ComparisonRow
                      label="Battery"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.battery,
                          ),
                      )}
                      highlighted
                    />

                    <ComparisonRow
                      label="Weight"
                      values={selectedHandhelds.map(
                        (handheld) =>
                          safeValue(
                            handheld.weight,
                          ),
                      )}
                      isLast
                    />
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <section className="atlas-panel mt-5 p-5">
          <p className="atlas-section-label">
            Live comparison
          </p>

          <h2 className="mt-1 text-xl font-black">
            Powered by the Atlas database
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
            Every value shown here is loaded directly
            from published handheld profiles. Update a
            device in the admin dashboard and the
            comparison changes automatically. No dusty
            static tables, no archaeological bullshit.
          </p>
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

function QuickStat({
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
        className={`mt-1 break-words text-xs font-black leading-5 ${
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

function ComparisonRow({
  label,
  values,
  highlighted = false,
  isLast = false,
}: {
  label: string;
  values: string[];
  highlighted?: boolean;
  isLast?: boolean;
}) {
  return (
    <tr
      className={`transition hover:bg-white/[0.025] ${
        isLast
          ? ""
          : "border-b border-white/[0.06]"
      }`}
    >
      <th className="px-5 py-4 text-sm font-black text-slate-500">
        {label}
      </th>

      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="px-5 py-4"
        >
          <span
            className={`inline-flex rounded-lg border px-3 py-2 text-sm font-bold leading-6 ${
              highlighted
                ? "border-red-500/25 bg-red-500/[0.06] text-red-300"
                : "border-transparent text-slate-300"
            }`}
          >
            {value}
          </span>
        </td>
      ))}
    </tr>
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