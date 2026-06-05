"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { handhelds } from "../../data/handhelds";

type FilterValue = "All" | string;

function getStatusStyle(status: string) {
  switch (status) {
    case "Current":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "Upcoming":
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";

    case "Discontinued":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}

export default function HandheldsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturerFilter, setManufacturerFilter] =
    useState<FilterValue>("All");
  const [osFilter, setOsFilter] =
    useState<FilterValue>("All");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue>("All");
  const [processorFilter, setProcessorFilter] =
    useState<FilterValue>("All");

  const manufacturerOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds.map((handheld) => handheld.manufacturer),
        ),
      ),
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds.map((handheld) => handheld.status),
        ),
      ),
    ],
    [],
  );

  const osOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds.map((handheld) => handheld.operatingSystem),
        ),
      ),
    ],
    [],
  );

  const processorOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          handhelds.map((handheld) => handheld.processor),
        ),
      ),
    ],
    [],
  );

  const filteredHandhelds = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return handhelds.filter((handheld) => {
      const searchableText = [
        handheld.name,
        handheld.manufacturer,
        handheld.operatingSystem,
        handheld.processor,
        handheld.memory,
        handheld.storage,
        handheld.displaySize,
        handheld.resolution,
        handheld.refreshRate,
        handheld.battery,
        handheld.tagline,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedQuery.length === 0 ||
        searchableText.includes(normalizedQuery);

      const matchesManufacturer =
        manufacturerFilter === "All" ||
        handheld.manufacturer === manufacturerFilter;

      const matchesOs =
        osFilter === "All" ||
        handheld.operatingSystem === osFilter;

      const matchesStatus =
        statusFilter === "All" ||
        handheld.status === statusFilter;

      const matchesProcessor =
        processorFilter === "All" ||
        handheld.processor === processorFilter;

      return (
        matchesSearch &&
        matchesManufacturer &&
        matchesOs &&
        matchesStatus &&
        matchesProcessor
      );
    });
  }, [
    searchQuery,
    manufacturerFilter,
    osFilter,
    statusFilter,
    processorFilter,
  ]);

  const hasActiveFilters =
    searchQuery.length > 0 ||
    manufacturerFilter !== "All" ||
    osFilter !== "All" ||
    statusFilter !== "All" ||
    processorFilter !== "All";

  function resetFilters() {
    setSearchQuery("");
    setManufacturerFilter("All");
    setOsFilter("All");
    setStatusFilter("All");
    setProcessorFilter("All");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl md:p-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
            Handheld Gaming Devices
          </p>

          <h1 className="mt-4 text-center text-4xl font-black md:text-5xl">
            Handhelds
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Explore handheld gaming devices, specifications, presets and
            verified performance data.
          </p>

          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
              <div className="xl:col-span-2">
                <label
                  htmlFor="handheld-search"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Search
                </label>

                <input
                  id="handheld-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search ASUS, Steam Deck, Z1 Extreme..."
                  className="w-full rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <FilterSelect
                label="Manufacturer"
                value={manufacturerFilter}
                options={manufacturerOptions}
                onChange={setManufacturerFilter}
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
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <FilterSelect
                label="Operating System"
                value={osFilter}
                options={osOptions}
                onChange={setOsFilter}
              />

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="self-end rounded-xl bg-red-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset Filters
              </button>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-black uppercase tracking-[0.18em]">
              {filteredHandhelds.length}{" "}
              {filteredHandhelds.length === 1
                ? "Device"
                : "Devices"}
            </h2>

            <Link
              href="/compare"
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
            >
              Compare devices
            </Link>
          </div>

          {filteredHandhelds.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center">
              <h3 className="text-2xl font-black">
                No handhelds found
              </h3>

              <p className="mt-3 text-slate-400">
                Try another search or reset the active filters.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredHandhelds.map((handheld) => (
                <Link
                  key={handheld.slug}
                  href={`/handhelds/${handheld.slug}`}
                  className="group"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-500">
                    <div className="relative flex min-h-72 items-center justify-center overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-5">
                      <div className="absolute left-5 top-5 z-10">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                          {handheld.manufacturer}
                        </p>
                      </div>

                      <div className="absolute right-4 top-4 z-10">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide backdrop-blur ${getStatusStyle(
                            handheld.status,
                          )}`}
                        >
                          {handheld.status}
                        </span>
                      </div>

                      <div className="relative mt-8 h-56 w-full">
                        <Image
                          src={handheld.image}
                          alt={handheld.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-contain object-center drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)] transition duration-300 group-hover:scale-110"
                        />
                      </div>

                      <div className="pointer-events-none absolute inset-x-16 bottom-5 h-8 rounded-full bg-cyan-500/10 blur-2xl" />
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="text-3xl font-black transition group-hover:text-cyan-400">
                        {handheld.name}
                      </h2>

                      <p className="mt-3 leading-7 text-slate-400">
                        {handheld.tagline}
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Processor
                          </p>

                          <p className="mt-1 font-bold">
                            {handheld.processor}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Memory
                          </p>

                          <p className="mt-1 font-bold">
                            {handheld.memory}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Display
                          </p>

                          <p className="mt-1 font-bold">
                            {handheld.displaySize}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Battery
                          </p>

                          <p className="mt-1 font-bold">
                            {handheld.battery}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-800 pt-6">
                        <span className="line-clamp-2 max-w-[65%] text-sm text-slate-500">
                          {handheld.operatingSystem}
                        </span>

                        <span className="shrink-0 font-bold text-cyan-400">
                          View profile →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
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