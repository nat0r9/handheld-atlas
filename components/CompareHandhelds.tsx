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

  const filteredHandhelds = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return handhelds;
    }

    return handhelds.filter((handheld) => {
      const searchableText = [
        handheld.name,
        handheld.manufacturer,
        handheld.processor ?? "",
        handheld.operatingSystem ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedQuery,
      );
    });
  }, [handhelds, searchQuery]);

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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-7 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
            Device Comparison
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-7xl">
            Compare handhelds
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            Select up to three devices and compare
            hardware, displays, battery capacity,
            operating systems and physical specifications
            side by side.
          </p>

          {databaseError && (
            <div className="mt-7 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
              <p className="font-black">
                Could not load the handheld database.
              </p>

              <p className="mt-2 break-words text-sm">
                {databaseError}
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="Available devices"
              value={handhelds.length.toString()}
            />

            <SummaryCard
              label="Selected"
              value={`${selectedSlugs.length}/${maximumComparedHandhelds}`}
              highlighted
            />

            <SummaryCard
              label="Comparison type"
              value="Full specifications"
            />
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                Device selector
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Select handhelds
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose up to{" "}
                {maximumComparedHandhelds} devices.
              </p>
            </div>

            {selectedSlugs.length > 0 && (
              <button
                type="button"
                onClick={clearComparison}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white"
              >
                Clear comparison
              </button>
            )}
          </div>

          <div className="mt-6">
            <label
              htmlFor="compare-search"
              className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500"
            >
              Search devices
            </label>

            <input
              id="compare-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search by device, manufacturer or processor..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
            />
          </div>

          {filteredHandhelds.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-7 text-center text-slate-500">
              No handhelds match your search.
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-950 hover:border-slate-600"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`truncate font-black ${
                            isSelected
                              ? "text-cyan-400"
                              : "text-slate-200"
                          }`}
                        >
                          {handheld.name}
                        </p>

                        <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.15em] text-slate-600">
                          {handheld.manufacturer}
                        </p>
                      </div>

                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-black ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500 text-slate-950"
                            : "border-slate-700 text-slate-500"
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
          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-3xl font-black">
              No handhelds selected
            </h2>

            <p className="mt-3 text-slate-400">
              Select at least one device to begin the
              comparison.
            </p>
          </section>
        ) : (
          <>
            <section
              className={`mt-10 grid gap-6 ${
                selectedHandhelds.length === 1
                  ? "md:grid-cols-1"
                  : selectedHandhelds.length === 2
                    ? "md:grid-cols-2"
                    : "md:grid-cols-3"
              }`}
            >
              {selectedHandhelds.map(
                (handheld) => (
                  <article
                    key={handheld.id}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                  >
                    <div className="relative flex min-h-64 items-center justify-center overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6">
                      <div className="absolute h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

                      <span
                        className={`absolute right-4 top-4 z-10 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getDeviceStatusStyle(
                          handheld.deviceStatus,
                        )}`}
                      >
                        {handheld.deviceStatus}
                      </span>

                      {handheld.imageUrl ? (
                        <div className="relative h-52 w-full">
                          <Image
                            src={
                              handheld.imageUrl
                            }
                            alt={handheld.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-contain object-center drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]"
                          />
                        </div>
                      ) : (
                        <p className="relative font-black text-slate-600">
                          Device image coming soon
                        </p>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400">
                        {handheld.manufacturer}
                      </p>

                      <h2 className="mt-2 text-3xl font-black">
                        {handheld.name}
                      </h2>

                      <p className="mt-3 min-h-14 leading-7 text-slate-400">
                        {handheld.tagline ??
                          "Complete hardware profile and handheld performance information."}
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <QuickStat
                          label="Processor"
                          value={safeValue(
                            handheld.processor,
                          )}
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

                      <Link
                        href={`/handhelds/${handheld.slug}`}
                        className="mt-7 inline-flex rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-black text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                      >
                        View full profile →
                      </Link>
                    </div>
                  </article>
                ),
              )}
            </section>

            <section className="mt-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/70">
                    <tr>
                      <th className="min-w-48 px-6 py-5 text-sm font-black uppercase tracking-[0.15em] text-slate-500">
                        Specification
                      </th>

                      {selectedHandhelds.map(
                        (handheld) => (
                          <th
                            key={handheld.id}
                            className="min-w-64 px-6 py-5"
                          >
                            <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-400">
                              {
                                handheld.manufacturer
                              }
                            </p>

                            <h2 className="mt-1 text-xl font-black">
                              {handheld.name}
                            </h2>
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

        <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <p className="text-sm font-black text-cyan-300">
            Live database comparison
          </p>

          <p className="mt-2 text-sm leading-7 text-slate-400">
            Specifications shown here are loaded directly
            from published HandheldAtlas device profiles.
            Values can be updated through the admin dashboard
            without changing the website code.
          </p>
        </div>
      </div>
    </main>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function SummaryCard({
  label,
  value,
  highlighted = false,
}: SummaryCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        highlighted
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950/70"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
          highlighted
            ? "text-cyan-400"
            : "text-white"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

interface QuickStatProps {
  label: string;
  value: string;
}

function QuickStat({
  label,
  value,
}: QuickStatProps) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}

interface ComparisonRowProps {
  label: string;
  values: string[];
  isLast?: boolean;
}

function ComparisonRow({
  label,
  values,
  isLast = false,
}: ComparisonRowProps) {
  return (
    <tr
      className={
        isLast
          ? "hover:bg-slate-800/40"
          : "border-b border-slate-800 hover:bg-slate-800/40"
      }
    >
      <th className="px-6 py-5 text-sm font-black text-slate-500">
        {label}
      </th>

      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="px-6 py-5 leading-7 text-slate-300"
        >
          {value}
        </td>
      ))}
    </tr>
  );
}