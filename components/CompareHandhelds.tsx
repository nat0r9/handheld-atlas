"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useUrlValue } from "../lib/use-url-value";
import { catalogUrl } from "../lib/catalog/query";
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
const fields: { key: keyof CompareHandheld; label: string }[] = [
  { key: "operatingSystem", label: "Operating system" },
  { key: "processor", label: "Processor" },
  { key: "memory", label: "Memory" },
  { key: "storage", label: "Storage" },
  { key: "displaySize", label: "Display size" },
  { key: "resolution", label: "Resolution" },
  { key: "refreshRate", label: "Refresh rate" },
  { key: "battery", label: "Battery capacity" },
  { key: "weight", label: "Weight" },
  { key: "deviceStatus", label: "Availability" },
];
export default function CompareHandhelds({
  handhelds,
  databaseError,
}: {
  handhelds: CompareHandheld[];
  databaseError: string | null;
}) {
  const [devices, setDevices] = useUrlValue<string>("devices", "");
  const [differences, setDifferences] = useState(false);
  const slugs = Array.from(
    new Set(
      devices
        .split(",")
        .filter((slug) => handhelds.some((h) => h.slug === slug)),
    ),
  ).slice(0, 3);
  const selected = slugs.flatMap((slug) =>
    handhelds.find((h) => h.slug === slug)
      ? [handhelds.find((h) => h.slug === slug)!]
      : [],
  );
  function selectAt(index: number, slug: string) {
    const next = [...slugs];
    if (slug) next[index] = slug;
    else next.splice(index, 1);
    setDevices(Array.from(new Set(next.filter(Boolean))).join(","));
  }
  const rows = fields.filter(
    (f) =>
      !differences || new Set(selected.map((h) => h[f.key] ?? "")).size > 1,
  );
  return (
    <main className="atlas-page pb-14">
      <header className="atlas-shell py-8">
        <p className="atlas-section-label">Device comparison</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">
          Choose your next <span className="atlas-text-red">handheld.</span>
        </h1>
        <p className="mt-4 text-slate-300">
          Compare up to three devices. Your selection is saved in the page link.
        </p>
      </header>
      <div className="atlas-shell">
        {databaseError && (
          <p role="alert">Device information is temporarily unavailable.</p>
        )}
        <section className="atlas-panel p-4 sm:p-5">
          <h2 className="text-xl">Choose devices</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <label
                  htmlFor={`device-${i}`}
                  className="mb-2 block text-sm font-bold text-slate-300"
                >
                  Device {i + 1}
                </label>
                <select
                  id={`device-${i}`}
                  className="w-full min-w-0 rounded-lg px-3 py-3 text-sm"
                  value={slugs[i] ?? ""}
                  onChange={(e) => selectAt(i, e.target.value)}
                >
                  <option value="">Select a handheld</option>
                  {handhelds.map((h) => (
                    <option
                      key={h.id}
                      value={h.slug}
                      disabled={slugs.includes(h.slug) && slugs[i] !== h.slug}
                    >
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={differences}
                disabled={selected.length < 2}
                onChange={(e) => setDifferences(e.target.checked)}
              />{" "}
              Show only differences
            </label>
            <button
              className="atlas-button-secondary"
              onClick={() => setDevices("")}
              disabled={!selected.length}
            >
              Clear selection
            </button>
          </div>
        </section>
        {!selected.length ? (
          <section className="atlas-panel mt-5 p-8">
            <h2 className="text-2xl">Start with a handheld you know</h2>
            <p className="mt-3 text-slate-300">
              Choose your current device, then add another model to see the
              differences.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-5 grid gap-4 md:grid-cols-3">
              {selected.map((h) => (
                <article key={h.id} className="atlas-card p-4">
                  {h.imageUrl && (
                    <div className="relative h-32">
                      <Image
                        src={h.imageUrl}
                        alt={h.name}
                        fill
                        sizes="400px"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h2 className="mt-3 text-xl">{h.name}</h2>
                  <p className="mt-2 text-sm text-slate-300">{h.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      className="py-2 text-sm font-bold text-cyan-300"
                      href={`/handhelds/${h.slug}`}
                    >
                      Device profile →
                    </Link>
                    <Link
                      className="py-2 text-sm font-bold text-cyan-300"
                      href={catalogUrl("/benchmarks", { handheld: h.slug })}
                    >
                      Game benchmarks →
                    </Link>
                  </div>
                </article>
              ))}
            </section>
            <section className="atlas-panel mt-5 overflow-hidden">
              <h2 className="p-4 text-xl">Side-by-side comparison</h2>
              <p className="px-4 pb-4 text-sm text-slate-400">
                Specifications may list multiple configurations. Check the exact
                model before comparing performance.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <caption className="sr-only">
                    Handheld hardware specifications
                  </caption>
                  <thead>
                    <tr className="bg-black/30">
                      <th scope="col" className="p-4">
                        Specification
                      </th>
                      {selected.map((h) => (
                        <th scope="col" key={h.id} className="p-4">
                          {h.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((f) => (
                      <tr key={f.key} className="border-t border-white/10">
                        <th scope="row" className="p-4 text-slate-300">
                          {f.label}
                        </th>
                        {selected.map((h) => (
                          <td key={h.id} className="p-4">
                            {h[f.key] || "Not reported"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!rows.length && (
                <p className="p-5 text-sm text-slate-300">
                  No differences in the reported specifications.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
