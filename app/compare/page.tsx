"use client";

import { useMemo, useState } from "react";
import { handhelds } from "../../data/handhelds";

const maximumComparedHandhelds = 3;

export default function ComparePage() {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([
    "rog-ally-x",
    "steam-deck-oled",
  ]);

  const selectedHandhelds = useMemo(
    () =>
      selectedSlugs
        .map((slug) =>
          handhelds.find((handheld) => handheld.slug === slug),
        )
        .filter((handheld) => handheld !== undefined),
    [selectedSlugs],
  );

  function toggleHandheld(slug: string) {
    setSelectedSlugs((currentSlugs) => {
      const isSelected = currentSlugs.includes(slug);

      if (isSelected) {
        return currentSlugs.filter(
          (currentSlug) => currentSlug !== slug,
        );
      }

      if (currentSlugs.length >= maximumComparedHandhelds) {
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
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Device Comparison
        </p>

        <h1 className="mt-3 text-5xl font-black">
          Compare Handhelds
        </h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Select up to three handheld gaming devices and compare their
          hardware, display, battery and platform.
        </p>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Select handhelds
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Selected {selectedSlugs.length} of{" "}
                {maximumComparedHandhelds}
              </p>
            </div>

            {selectedSlugs.length > 0 && (
              <button
                type="button"
                onClick={clearComparison}
                className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Clear comparison
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {handhelds.map((handheld) => {
              const isSelected = selectedSlugs.includes(
                handheld.slug,
              );

              const selectionLimitReached =
                selectedSlugs.length >= maximumComparedHandhelds &&
                !isSelected;

              return (
                <button
                  key={handheld.slug}
                  type="button"
                  disabled={selectionLimitReached}
                  onClick={() => toggleHandheld(handheld.slug)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {handheld.name}
                </button>
              );
            })}
          </div>
        </section>

        {selectedHandhelds.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-bold">
              No handhelds selected
            </h2>

            <p className="mt-2 text-slate-400">
              Select at least one handheld to start the comparison.
            </p>
          </section>
        ) : (
          <section className="mt-10 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="min-w-44 px-6 py-5 text-sm font-semibold text-slate-500">
                      Specification
                    </th>

                    {selectedHandhelds.map((handheld) => (
                      <th
                        key={handheld.slug}
                        className="min-w-64 px-6 py-5"
                      >
                        <p className="text-sm text-slate-500">
                          {handheld.manufacturer}
                        </p>

                        <h2 className="mt-1 text-xl font-bold">
                          {handheld.name}
                        </h2>

                        <span className="mt-3 inline-flex rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-400">
                          {handheld.status}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <ComparisonRow
                    label="Operating system"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.operatingSystem,
                    )}
                  />

                  <ComparisonRow
                    label="Processor"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.processor,
                    )}
                  />

                  <ComparisonRow
                    label="Memory"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.memory,
                    )}
                  />

                  <ComparisonRow
                    label="Storage"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.storage,
                    )}
                  />

                  <ComparisonRow
                    label="Display"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.displaySize,
                    )}
                  />

                  <ComparisonRow
                    label="Resolution"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.resolution,
                    )}
                  />

                  <ComparisonRow
                    label="Refresh rate"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.refreshRate,
                    )}
                  />

                  <ComparisonRow
                    label="Battery"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.battery,
                    )}
                  />

                  <ComparisonRow
                    label="Weight"
                    values={selectedHandhelds.map(
                      (handheld) => handheld.weight,
                    )}
                    isLast
                  />
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold text-yellow-300">
            Development specifications
          </p>

          <p className="mt-2 text-sm text-yellow-100/70">
            The current device specifications are development data.
            Every value will be verified against official manufacturer
            sources before the public launch.
          </p>
        </div>
      </div>
    </main>
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
      <th className="px-6 py-5 text-sm font-semibold text-slate-500">
        {label}
      </th>

      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="px-6 py-5 text-slate-300"
        >
          {value}
        </td>
      ))}
    </tr>
  );
}