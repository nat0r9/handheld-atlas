import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import { updateBenchmark } from "../../actions";

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
    benchmarkResult,
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
        preset_type,
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
        games (
          name,
          slug
        ),
        handhelds (
          name,
          slug
        )
      `)
      .eq("id", id)
      .single(),
  ]);

  if (
    benchmarkResult.error ||
    !benchmarkResult.data
  ) {
    redirect(
      "/admin/benchmarks?error=Benchmark%20not%20found",
    );
  }

  const databaseError =
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    presetsResult.error?.message ??
    null;

  if (databaseError) {
    redirect(
      `/admin/benchmarks?error=${encodeURIComponent(
        databaseError,
      )}`,
    );
  }

  const games =
    (gamesResult.data ?? []) as SelectOption[];

  const handhelds =
    (handheldsResult.data ?? []) as SelectOption[];

  const presets =
    (presetsResult.data ??
      []) as unknown as PresetOption[];

  const benchmark =
    benchmarkResult.data as unknown as DatabaseBenchmark;

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

            <h1 className="mt-3 text-5xl font-black">
              Edit benchmark
            </h1>

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
              {benchmark.handhelds?.name ??
                "Unknown handheld"}
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
          <form action={updateBenchmark}>
            <input
              type="hidden"
              name="benchmarkId"
              value={benchmark.id}
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Game"
                name="gameId"
                options={games}
                defaultValue={benchmark.game_id}
                required
              />

              <SelectField
                label="Handheld"
                name="handheldId"
                options={handhelds}
                defaultValue={benchmark.handheld_id}
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
                  defaultValue={benchmark.preset_id ?? ""}
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
                      {" · "}
                      {preset.preset_type}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-600">
                  The preset must match the selected game and handheld.
                </p>
              </div>

              <FormField
                label="Resolution"
                name="resolution"
                defaultValue={benchmark.resolution ?? ""}
              />

              <FormField
                label="TDP"
                name="tdp"
                defaultValue={benchmark.tdp ?? ""}
              />

              <FormField
                label="Average FPS"
                name="averageFps"
                type="number"
                defaultValue={
                  benchmark.average_fps !== null
                    ? String(benchmark.average_fps)
                    : ""
                }
                min="0"
                step="0.01"
              />

              <FormField
                label="1% Low"
                name="onePercentLow"
                type="number"
                defaultValue={
                  benchmark.one_percent_low !== null
                    ? String(benchmark.one_percent_low)
                    : ""
                }
                min="0"
                step="0.01"
              />

              <FormField
                label="Battery life"
                name="batteryLife"
                defaultValue={
                  benchmark.battery_life ?? ""
                }
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
                  defaultValue={benchmark.status}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="draft">Draft</option>
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
                rows={7}
                defaultValue={benchmark.test_notes ?? ""}
                placeholder="Describe the test scene, settings, frame generation, temperatures and unusual behaviour."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Save benchmark changes
              </button>

              <Link
                href="/admin/benchmarks"
                className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </Link>

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
          </form>
        </section>
      </div>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  defaultValue?: string;
  type?: "text" | "number";
  min?: string;
  step?: string;
}

function FormField({
  label,
  name,
  defaultValue = "",
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
        defaultValue={defaultValue}
        min={min}
        step={step}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue: string;
  required?: boolean;
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
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
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      >
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