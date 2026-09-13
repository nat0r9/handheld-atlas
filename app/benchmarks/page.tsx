import { withBenchmarkContributors } from "../../lib/benchmark-contributors";
import Link from "next/link";
import BenchmarkCard from "../../components/BenchmarkCard";
import Pagination from "../../components/catalog/Pagination";
import { Field, Select } from "../../components/catalog/Filters";
import {
  BENCHMARK_SELECT,
  evidenceLabel,
  type BenchmarkRecord,
} from "../../lib/benchmarks";
import { getBenchmarkIndex } from "../../lib/catalog/benchmark-index";
import {
  PAGE_SIZE,
  pageNumber,
  param,
  powerSupply,
  powerWatts,
  resolutionLabel,
  type SearchParams,
} from "../../lib/catalog/query";
import { assertRead } from "../../lib/catalog/read";
import { createClient } from "../../lib/supabase/server";

export default async function BenchmarksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const values = Object.fromEntries(
    [
      "q",
      "game",
      "handheld",
      "watts",
      "supply",
      "resolution",
      "evidence",
      "fps",
      "sort",
    ].map((k) => [k, param(params, k)]),
  );
  values.resolution = resolutionLabel(values.resolution);
  const index = await getBenchmarkIndex();
  const matching = index
    .filter((b) => {
      const haystack = [b.games?.name, b.handhelds?.name, b.presets?.name]
        .join(" ")
        .toLowerCase();
      return (
        (!values.q ||
          values.q
            .toLowerCase()
            .split(/\s+/)
            .every((word) => haystack.includes(word))) &&
        (!values.game || b.games?.slug === values.game) &&
        (!values.handheld || b.handhelds?.slug === values.handheld) &&
        (!values.watts || powerWatts(b.tdp) === values.watts) &&
        (!values.supply || powerSupply(b.tdp) === values.supply) &&
        (!values.resolution ||
          resolutionLabel(b.resolution) === values.resolution) &&
        (!values.evidence || b.evidence_tier === values.evidence) &&
        (!values.fps ||
          (b.average_fps !== null && b.average_fps >= Number(values.fps)))
      );
    })
    .sort((a, b) => {
      if (values.sort === "fps")
        return (
          (b.average_fps ?? -1) - (a.average_fps ?? -1) ||
          a.id.localeCompare(b.id)
        );
      if (values.sort === "game")
        return (
          (a.games?.name ?? "").localeCompare(b.games?.name ?? "") ||
          a.id.localeCompare(b.id)
        );
      return (
        (b.published_at ?? "").localeCompare(a.published_at ?? "") ||
        a.id.localeCompare(b.id)
      );
    });
  const page = pageNumber(param(params, "page"), matching.length);
  const ids = matching
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((b) => b.id);
  const db = await createClient();
  let records: BenchmarkRecord[] = [];
  if (ids.length) {
    const result = await db
      .from("benchmarks")
      .select(BENCHMARK_SELECT)
      .eq("status", "published")
      .in("id", ids);
    assertRead(result.error, "benchmarks");
    const byId = new Map(
      ((result.data ?? []) as unknown as BenchmarkRecord[]).map((b) => [
        b.id,
        b,
      ]),
    );
    records = ids.flatMap((id) => (byId.get(id) ? [byId.get(id)!] : []));
  }
  records = await withBenchmarkContributors(records);
  const options = (key: "games" | "handhelds") =>
    Array.from(
      new Map(
        index.flatMap((b) =>
          b[key] ? [[b[key]!.slug, b[key]!.name] as const] : [],
        ),
      ).entries(),
    )
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  const distinct = (items: (string | null)[]) =>
    Array.from(new Set(items.filter((v): v is string => Boolean(v)))).sort();
  return (
    <main className="atlas-page pb-14">
      <header className="atlas-shell py-8 sm:py-10">
        <p className="atlas-section-label">Performance database</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">
          Find your game.{" "}
          <span className="atlas-text-red">See the evidence.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Choose your handheld and game, then compare the reported settings.
          Different scenes, graphics profiles and test dates can produce
          different results.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
          <span>{index.length} published results</span>
          <span>· {options("games").length} games</span>
          <span>· {options("handhelds").length} tested devices</span>
          <Link href="/methodology" className="text-cyan-300 underline">
            How to read a benchmark
          </Link>
        </div>
      </header>
      <div className="atlas-shell">
        <form
          action="/benchmarks"
          method="get"
          className="atlas-panel p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Search game or device" name="q">
              <input
                id="catalog-q"
                name="q"
                type="search"
                defaultValue={values.q}
                key={values.q}
                placeholder="e.g. Cyberpunk or Steam Deck"
                className="w-full rounded-lg px-3 py-3 text-sm"
              />
            </Field>
            <Select
              label="Game"
              name="game"
              value={values.game}
              options={options("games")}
            />
            <Select
              label="Handheld"
              name="handheld"
              value={values.handheld}
              options={options("handhelds")}
            />
            <Select
              label="Resolution"
              name="resolution"
              value={values.resolution}
              options={distinct(
                index.map((b) => resolutionLabel(b.resolution)),
              ).map((value) => ({ value, label: value }))}
            />
          </div>
          <details
            className="mt-4"
            open={Boolean(
              values.watts ||
              values.supply ||
              values.evidence ||
              values.fps ||
              values.sort,
            )}
          >
            <summary className="cursor-pointer py-2 text-sm font-bold text-slate-300">
              More filters: power, evidence & FPS ↓
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Select
                label="Reported wattage"
                name="watts"
                value={values.watts}
                options={distinct(index.map((b) => powerWatts(b.tdp)))
                  .sort((a, b) => Number(a) - Number(b))
                  .map((value) => ({ value, label: `${value} W` }))}
              />
              <Select
                label="Power supply"
                name="supply"
                value={values.supply}
                options={[
                  { value: "battery", label: "On battery" },
                  { value: "plugged", label: "Plugged in" },
                  { value: "unknown", label: "Not reported" },
                ]}
              />
              <Select
                label="Evidence"
                name="evidence"
                value={values.evidence}
                options={distinct(index.map((b) => b.evidence_tier)).map(
                  (value) => ({ value, label: evidenceLabel(value) }),
                )}
              />
              <Select
                label="Minimum average FPS"
                name="fps"
                value={values.fps}
                options={[30, 40, 60, 90].map((n) => ({
                  value: String(n),
                  label: `${n}+ FPS`,
                }))}
              />
              <Select
                label="Sort"
                name="sort"
                value={values.sort}
                options={[
                  { value: "newest", label: "Recently added" },
                  { value: "game", label: "Game name" },
                  { value: "fps", label: "Highest average FPS" },
                ]}
              />
            </div>
          </details>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="atlas-button-primary" type="submit">
              Show results
            </button>
            <Link href="/benchmarks" className="atlas-button-secondary">
              Reset filters
            </Link>
          </div>
        </form>
        <div className="my-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">
            {matching.length} {matching.length === 1 ? "result" : "results"}
          </h2>
          <p className="text-sm text-slate-400">
            {distinct(matching.map((b) => b.games?.slug ?? null)).length} games ·{" "}
            {distinct(matching.map((b) => b.handhelds?.slug ?? null)).length} devices in this
            selection
          </p>
        </div>
        {records.length ? (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {records.map((b) => (
              <BenchmarkCard key={b.id} benchmark={b} />
            ))}
          </div>
        ) : (
          <section className="atlas-panel p-8">
            <h2 className="text-2xl">No matching benchmarks yet</h2>
            <p className="mt-3 text-slate-300">
              Try another game or remove a power or resolution filter. A missing
              result does not mean the game cannot run.
            </p>
            <Link className="atlas-button-primary mt-5" href="/benchmarks">
              See available benchmarks
            </Link>
          </section>
        )}
        <Pagination
          path="/benchmarks"
          values={values}
          page={page}
          total={matching.length}
        />
      </div>
    </main>
  );
}
