import Link from "next/link";
import { redirect } from "next/navigation";
import BenchmarkAdminForm from "../../../../../components/admin/BenchmarkAdminForm";
import { BENCHMARK_EDITOR_ROLES } from "../../../../../lib/auth/roles";
import { requireRole } from "../../../../../lib/auth/require-role";
import { duplicateBenchmark, updateBenchmark } from "../../actions";

interface EditBenchmarkPageProps {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
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
  preset_type: string;
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
  status: "draft" | "published" | "archived";
  created_by: string | null;
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
  } | null;
}

export default async function EditBenchmarkPage({
  params,
  searchParams,
}: EditBenchmarkPageProps) {
  const { id } = await params;
  const { error, success } = await searchParams;

  const { supabase, user, role } = await requireRole(
    BENCHMARK_EDITOR_ROLES,
    "/",
  );

  const isBenchmarkTester = role === "benchmark_tester";

  const [gamesResult, handheldsResult, presetsResult, benchmarkResult] =
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

      supabase
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
        status,
        created_by,
        games (
          name,
          slug
        ),
        handhelds (
          name,
          slug
        )
      `,
        )
        .eq("id", id)
        .single(),
    ]);

  if (benchmarkResult.error || !benchmarkResult.data) {
    redirect("/admin/benchmarks?error=Benchmark%20not%20found");
  }

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    presetsResult.error?.message ??
    null;

  if (databaseError) {
    redirect(`/admin/benchmarks?error=${encodeURIComponent(databaseError)}`);
  }

  const games = (gamesResult.data ?? []) as SelectOption[];

  const handhelds = (handheldsResult.data ?? []) as SelectOption[];

  const presets = (presetsResult.data ?? []) as unknown as PresetOption[];

  const benchmark = benchmarkResult.data as unknown as DatabaseBenchmark;

  if (isBenchmarkTester && benchmark.created_by !== user.id) {
    redirect(
      "/admin/benchmarks?error=You%20can%20only%20edit%20your%20own%20benchmarks",
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/benchmarks"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to benchmarks
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Content Management
            </p>

            <h1 className="mt-3 text-5xl font-black">Edit benchmark</h1>

            <p className="mt-4 max-w-2xl text-slate-400">
              Update test results, linked preset, notes and publishing status.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Current test
            </p>

            <p className="mt-2 font-black">
              {benchmark.games?.name ?? "Unknown game"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {benchmark.handhelds?.name ?? "Unknown handheld"}
            </p>
          </div>
        </div>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                Test Report
              </p>
              <h2 className="mt-2 text-2xl font-black">Benchmark details</h2>
            </div>

            <form action={duplicateBenchmark}>
              <input type="hidden" name="benchmarkId" value={benchmark.id} />

              <button
                type="submit"
                className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 transition hover:bg-orange-500 hover:text-slate-950"
              >
                Duplicate as draft
              </button>
            </form>
          </div>

          <div className="mt-8">
            <BenchmarkAdminForm
              action={updateBenchmark}
              games={games}
              handhelds={handhelds}
              presets={presets}
              submitLabel="Save benchmark changes"
              isBenchmarkTester={isBenchmarkTester}
              defaults={{
                benchmarkId: benchmark.id,
                gameId: benchmark.game_id,
                handheldId: benchmark.handheld_id,
                presetId: benchmark.preset_id ?? "",
                resolution: benchmark.resolution ?? "",
                tdp: benchmark.tdp ?? "",
                averageFps:
                  benchmark.average_fps !== null
                    ? String(benchmark.average_fps)
                    : "",
                onePercentLow:
                  benchmark.one_percent_low !== null
                    ? String(benchmark.one_percent_low)
                    : "",
                batteryLife: benchmark.battery_life ?? "",
                testNotes: benchmark.test_notes ?? "",
                status: benchmark.status,
              }}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
            {benchmark.games?.slug && (
              <Link
                href={`/games/${benchmark.games.slug}`}
                target="_blank"
                className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-3 font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
              >
                Open game ↗
              </Link>
            )}

            {benchmark.handhelds?.slug && (
              <Link
                href={`/handhelds/${benchmark.handhelds.slug}`}
                target="_blank"
                className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-6 py-3 font-bold text-purple-400 transition hover:bg-purple-500 hover:text-white"
              >
                Open handheld ↗
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
