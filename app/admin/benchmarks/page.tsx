import Link from "next/link";
import Pagination from "../../../components/catalog/Pagination";
import { PAGE_SIZE, pageNumber, param, type SearchParams } from "../../../lib/catalog/query";
import { readAll } from "../../../lib/catalog/read";
import { benchmarkReviewIssues, filterBenchmarkReview } from "../../../lib/catalog/benchmark-review";
import BenchmarkAdminForm from "../../../components/admin/BenchmarkAdminForm";
import { BENCHMARK_EDITOR_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";
import {
  createBenchmark,
  deleteBenchmark,
  duplicateBenchmark,
} from "./actions";

interface AdminBenchmarksPageProps {
  searchParams: Promise<SearchParams>;
}

interface SelectOption {
  id: string;
  name: string;
}

interface PresetOption {
  id: string;
  name: string;
  game_id: string;
  handheld_id: string;
  preset_type?: string | null;
  games: {
    name: string;
  } | null;
  handhelds: {
    name: string;
  } | null;
}

interface DatabaseBenchmark {
  id: string;
  game_id: string;
  handheld_id: string;
  preset_id: string | null;
  resolution: string | null;
  tdp: string | null;
  average_fps: number | null;
  one_percent_low: number | null;
  battery_life: string | null;
  test_notes: string | null;
  source_url: string | null;
  evidence_tier: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
  } | null;
  presets: {
    name: string;
    preset_type: string;
  } | null;
}

function getStatusStyle(status: DatabaseBenchmark["status"]) {
  switch (status) {
    case "published":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "archived":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";
  }
}

export default async function AdminBenchmarksPage({
  searchParams,
}: AdminBenchmarksPageProps) {
  const params = await searchParams;
  const error = param(params, "error");
  const success = param(params, "success");
  const filters = {
    q: param(params, "q").slice(0, 200),
    status: ["draft", "published", "archived"].includes(param(params, "status")) ? param(params, "status") : "",
    handheld: param(params, "handheld"),
    review: ["core", "source", "evidence"].includes(param(params, "review")) ? param(params, "review") : "",
  };

  const { supabase, user, role } = await requireRole(
    BENCHMARK_EDITOR_ROLES,
    "/",
  );

  const isBenchmarkTester = role === "benchmark_tester";

  const [gamesResult, handheldsResult, presetsResult, benchmarks] =
    await Promise.all([
      supabase.from("games").select("id, name").order("name", {
        ascending: true,
      }),

      supabase.from("handhelds").select("id, name").order("name", {
        ascending: true,
      }),

      supabase
        .from("presets")
        .select(
          `
        id,
        name,
        game_id,
        handheld_id,
        preset_type,
        games (
          name
        ),
        handhelds (
          name
        )
      `,
        )
        .order("name", {
          ascending: true,
        }),

      readAll<DatabaseBenchmark>((from, to) => {
        let query = supabase
          .from("benchmarks")
          .select(
            `
        id,
        game_id,
        handheld_id,
        preset_id,
        resolution,
        tdp,
        average_fps,
        one_percent_low,
        battery_life,
        test_notes,
        source_url,
        evidence_tier,
        status,
        created_at,
        games (
          name,
          slug
        ),
        handhelds (
          name,
          slug
        ),
        presets (
          name,
          preset_type
        )
      `,
          )
          .order("created_at", {
            ascending: false,
          }).order("id");

        if (isBenchmarkTester) {
          query = query.eq("created_by", user.id);
        }

        return query.range(from, to);
      }, "admin benchmarks"),
    ]);

  const games = (gamesResult.data ?? []) as SelectOption[];

  const handhelds = (handheldsResult.data ?? []) as SelectOption[];

  const presets = (presetsResult.data ?? []) as unknown as PresetOption[];

  const filtered = filterBenchmarkReview(benchmarks, filters);
  const page = pageNumber(param(params, "page"), filtered.length);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    presetsResult.error?.message ??
    null;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Link prefetch={false}
              href="/admin"
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Content Management
            </p>

            <h1 className="mt-3 text-5xl font-black">Benchmarks</h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              Record tested FPS results, power limits, resolutions and battery
              measurements for games running on specific handhelds.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              {isBenchmarkTester ? "Your benchmarks" : "Database total"}
            </p>

            <p className="mt-2 text-3xl font-black">{benchmarks.length}</p>
          </div>
        </div>

        {isBenchmarkTester && (
          <div className="mt-6 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.07] p-5 text-sm text-cyan-200">
            Benchmark Tester access: you can create and manage your own draft
            benchmarks. Publishing remains reserved for Atlas Editors and
            Administrators.
          </div>
        )}

        {success && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {success}
          </div>
        )}

        {(error || databaseError) && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error ?? databaseError}
          </div>
        )}

        {(games.length === 0 || handhelds.length === 0) && (
          <div className="mt-8 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 text-orange-200">
            A benchmark needs at least one game and one handheld in the
            database.
          </div>
        )}

        <details className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <summary className="cursor-pointer text-xl font-bold text-cyan-300">Add a new benchmark</summary>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            New Benchmark
          </p>

          <h2 className="mt-3 text-3xl font-black">Add benchmark result</h2>

          <div className="mt-8">
            <BenchmarkAdminForm
              action={createBenchmark}
              games={games}
              handhelds={handhelds}
              presets={presets}
              submitLabel="Create benchmark"
              isBenchmarkTester={isBenchmarkTester}
            />
          </div>
        </details>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                Existing Content
              </p>

              <h2 className="mt-2 text-3xl font-black">Benchmark database</h2>
            </div>

            <p className="text-sm text-slate-500">
              {filtered.length} matching · {benchmarks.length} accessible
            </p>
          </div>

          <form action="/admin/benchmarks" method="get" className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-bold">Search game, device or ID
              <input type="search" name="q" defaultValue={filters.q} maxLength={200} className="mt-2 w-full rounded-lg px-3 py-3" />
            </label>
            <label className="text-sm font-bold">Status
              <select name="status" defaultValue={filters.status} className="mt-2 w-full rounded-lg px-3 py-3">
                <option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
            </label>
            <label className="text-sm font-bold">Handheld
              <select name="handheld" defaultValue={filters.handheld} className="mt-2 w-full rounded-lg px-3 py-3">
                <option value="">All handhelds</option>
                {handhelds.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold">Needs attention
              <select name="review" defaultValue={filters.review} className="mt-2 w-full rounded-lg px-3 py-3">
                <option value="">All records</option><option value="core">Missing core details</option><option value="source">External result without source link</option><option value="evidence">Evidence awaiting review</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
              <button className="atlas-button-primary" type="submit">Filter benchmarks</button>
              <Link prefetch={false} className="atlas-button-secondary" href="/admin/benchmarks">Reset filters</Link>
            </div>
            <p className="text-xs leading-5 text-slate-400 sm:col-span-2 lg:col-span-4">Review flags help locate incomplete records; they do not replace publication checks. Missing lows or battery measurements alone are not flagged.</p>
          </form>
          <Pagination path="/admin/benchmarks" values={filters} page={page} total={filtered.length} />

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-black">
                {benchmarks.length ? "No matching benchmarks" : "No benchmarks yet"}
              </h3>

              <p className="mt-2 text-slate-400">
                {benchmarks.length ? "Try another filter or reset your selection." : "Expand the form above to add your first result."}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {visible.map((benchmark) => (
                <article
                  key={benchmark.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                        {benchmark.games?.name ?? "Unknown game"}
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        {benchmark.handhelds?.name ?? "Unknown handheld"}
                      </h3>

                      {benchmark.presets && (
                        <p className="mt-2 text-sm text-slate-400">
                          Preset: {benchmark.presets.name}
                          {" · "}
                          {benchmark.presets.preset_type}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
                        benchmark.status,
                      )}`}
                    >
                      {benchmark.status}
                    </span>
                  </div>

                  {benchmarkReviewIssues(benchmark).length > 0 && <p className="mt-4 text-sm text-amber-300">{benchmarkReviewIssues(benchmark).join(" · ")}</p>}
                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <BenchmarkStat
                      label="Resolution"
                      value={benchmark.resolution ?? "Not set"}
                    />

                    <BenchmarkStat
                      label="TDP"
                      value={benchmark.tdp ?? "Not set"}
                    />

                    <BenchmarkStat
                      label="Average FPS"
                      value={
                        benchmark.average_fps !== null
                          ? `${benchmark.average_fps} FPS`
                          : "Not set"
                      }
                      highlighted
                    />

                    <BenchmarkStat
                      label="1% Low"
                      value={
                        benchmark.one_percent_low !== null
                          ? `${benchmark.one_percent_low} FPS`
                          : "Not set"
                      }
                    />

                    <BenchmarkStat
                      label="Battery life"
                      value={benchmark.battery_life ?? "Not set"}
                    />

                    <BenchmarkStat
                      label="Linked preset"
                      value={benchmark.presets?.name ?? "None"}
                    />
                  </div>

                  {benchmark.test_notes && (
                    <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                      <summary className="cursor-pointer text-sm font-bold text-slate-300">Test notes</summary>

                      <p className="mt-3 leading-7 text-slate-400">
                        {benchmark.test_notes}
                      </p>
                    </details>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <Link prefetch={false}
                      href={`/admin/benchmarks/${benchmark.id}/edit`}
                      className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                    >
                      Edit
                    </Link>

                    {benchmark.games?.slug && (
                      <Link prefetch={false}
                        href={`/games/${benchmark.games.slug}`}
                        target="_blank"
                        className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                      >
                        Open game
                      </Link>
                    )}

                    {benchmark.handhelds?.slug && (
                      <Link prefetch={false}
                        href={`/handhelds/${benchmark.handhelds.slug}`}
                        target="_blank"
                        className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-400 transition hover:bg-purple-500 hover:text-white"
                      >
                        Open handheld
                      </Link>
                    )}

                    <form action={duplicateBenchmark}>
                      <input
                        type="hidden"
                        name="benchmarkId"
                        value={benchmark.id}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 transition hover:bg-orange-500 hover:text-slate-950"
                      >
                        Duplicate
                      </button>
                    </form>

                    <form action={deleteBenchmark}>
                      <input
                        type="hidden"
                        name="benchmarkId"
                        value={benchmark.id}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
          <Pagination path="/admin/benchmarks" values={filters} page={page} total={filtered.length} />
        </section>
      </div>
    </main>
  );
}

interface BenchmarkStatProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

function BenchmarkStat({
  label,
  value,
  highlighted = false,
}: BenchmarkStatProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 font-black ${
          highlighted ? "text-cyan-400" : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
