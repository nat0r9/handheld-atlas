import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import {
  createBenchmark,
  deleteBenchmark,
} from "./actions";

interface AdminBenchmarksPageProps {
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

function getStatusStyle(
  status: DatabaseBenchmark["status"],
) {
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
  const { error, success } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/admin/login");
  }

  const [
    gamesResult,
    handheldsResult,
    presetsResult,
    benchmarksResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select("id, name")
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("handhelds")
      .select("id, name")
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("presets")
      .select(`
        id,
        name,
        game_id,
        handheld_id,
        games (
          name
        ),
        handhelds (
          name
        )
      `)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("benchmarks")
      .select(`
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
      `)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const games =
    (gamesResult.data ?? []) as SelectOption[];

  const handhelds =
    (handheldsResult.data ?? []) as SelectOption[];

  const presets =
    (presetsResult.data ??
      []) as unknown as PresetOption[];

  const benchmarks =
    (benchmarksResult.data ??
      []) as unknown as DatabaseBenchmark[];

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    presetsResult.error?.message ??
    benchmarksResult.error?.message ??
    null;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Content Management
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Benchmarks
            </h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              Record tested FPS results, power limits,
              resolutions and battery measurements for
              games running on specific handhelds.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Database total
            </p>

            <p className="mt-2 text-3xl font-black">
              {benchmarks.length}
            </p>
          </div>
        </div>

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

        {(games.length === 0 ||
          handhelds.length === 0) && (
          <div className="mt-8 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 text-orange-200">
            A benchmark needs at least one game and one
            handheld in the database.
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            New Benchmark
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Add benchmark result
          </h2>

          <form action={createBenchmark} className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Game"
                name="gameId"
                placeholder="Select game"
                options={games}
                required
              />

              <SelectField
                label="Handheld"
                name="handheldId"
                placeholder="Select handheld"
                options={handhelds}
                required
              />

              <div>
                <label
                  htmlFor="presetId"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Related preset
                </label>

                <select
                  id="presetId"
                  name="presetId"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="">
                    No linked preset
                  </option>

                  {presets.map((preset) => (
                    <option
                      key={preset.id}
                      value={preset.id}
                    >
                      {preset.games?.name ??
                        "Unknown game"}
                      {" · "}
                      {preset.handhelds?.name ??
                        "Unknown handheld"}
                      {" · "}
                      {preset.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-600">
                  The selected preset must match the chosen
                  game and handheld.
                </p>
              </div>

              <FormField
                label="Resolution"
                name="resolution"
                placeholder="1920 × 1080"
              />

              <FormField
                label="TDP"
                name="tdp"
                placeholder="30W"
              />

              <FormField
                label="Average FPS"
                name="averageFps"
                type="number"
                placeholder="68"
                min="0"
                step="0.01"
              />

              <FormField
                label="1% Low"
                name="onePercentLow"
                type="number"
                placeholder="54"
                min="0"
                step="0.01"
              />

              <FormField
                label="Battery life"
                name="batteryLife"
                placeholder="1 h 45 min"
              />

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Content status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="testNotes"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Test notes
              </label>

              <textarea
                id="testNotes"
                name="testNotes"
                rows={5}
                placeholder="Describe test location, graphics settings, frame generation, power mode, temperatures or unusual performance behaviour."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={
                games.length === 0 ||
                handhelds.length === 0
              }
              className="mt-7 rounded-xl bg-cyan-500 px-7 py-4 font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create benchmark
            </button>
          </form>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                Existing Content
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Benchmark database
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {benchmarks.length}{" "}
              {benchmarks.length === 1
                ? "benchmark"
                : "benchmarks"}
            </p>
          </div>

          {benchmarks.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-black">
                No benchmarks in Supabase yet
              </h3>

              <p className="mt-2 text-slate-400">
                Add the first benchmark using the form
                above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {benchmarks.map((benchmark) => (
                <article
                  key={benchmark.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                        {benchmark.games?.name ??
                          "Unknown game"}
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        {benchmark.handhelds?.name ??
                          "Unknown handheld"}
                      </h3>

                      {benchmark.presets && (
                        <p className="mt-2 text-sm text-slate-400">
                          Preset:{" "}
                          {benchmark.presets.name}
                          {" · "}
                          {
                            benchmark.presets
                              .preset_type
                          }
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

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <BenchmarkStat
                      label="Resolution"
                      value={
                        benchmark.resolution ??
                        "Not set"
                      }
                    />

                    <BenchmarkStat
                      label="TDP"
                      value={
                        benchmark.tdp ?? "Not set"
                      }
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
                        benchmark.one_percent_low !==
                        null
                          ? `${benchmark.one_percent_low} FPS`
                          : "Not set"
                      }
                    />

                    <BenchmarkStat
                      label="Battery life"
                      value={
                        benchmark.battery_life ??
                        "Not set"
                      }
                    />

                    <BenchmarkStat
                      label="Linked preset"
                      value={
                        benchmark.presets?.name ??
                        "None"
                      }
                    />
                  </div>

                  {benchmark.test_notes && (
                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Test notes
                      </p>

                      <p className="mt-3 leading-7 text-slate-400">
                        {benchmark.test_notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <Link
                      href={`/admin/benchmarks/${benchmark.id}/edit`}
                      className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                    >
                      Edit
                    </Link>

                    {benchmark.games?.slug && (
                      <Link
                        href={`/games/${benchmark.games.slug}`}
                        target="_blank"
                        className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                      >
                        Open game
                      </Link>
                    )}

                    {benchmark.handhelds?.slug && (
                      <Link
                        href={`/handhelds/${benchmark.handhelds.slug}`}
                        target="_blank"
                        className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-400 transition hover:bg-purple-500 hover:text-white"
                      >
                        Open handheld
                      </Link>
                    )}

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
        </section>
      </div>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  type?: "text" | "number";
  min?: string;
  step?: string;
}

function FormField({
  label,
  name,
  placeholder,
  type = "text",
  min,
  step,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  placeholder: string;
  options: SelectOption[];
  required?: boolean;
}

function SelectField({
  label,
  name,
  placeholder,
  options,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        defaultValue=""
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
          >
            {option.name}
          </option>
        ))}
      </select>
    </div>
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
          highlighted
            ? "text-cyan-400"
            : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}