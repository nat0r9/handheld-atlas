import Link from "next/link";
import PresetCreateForm from "../../../components/admin/PresetCreateForm";
import {
  PRESET_EDITOR_ROLES,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";
import {
  createPreset,
  deletePreset,
} from "./actions";

interface AdminPresetsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface DatabasePreset {
  id: string;
  name: string;
  preset_type:
    | "Performance"
    | "Balanced"
    | "Battery"
    | "Docked"
    | "Custom";
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  upscaler: string | null;
  battery_life: string | null;
  community_rating: number | null;
  summary: string | null;
  status: "draft" | "published" | "archived";
  created_by: string | null;
  created_at: string;
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
  } | null;
  preset_setting_groups: {
    id: string;
    name: string;
  }[];
}

function getPresetStyle(
  type: DatabasePreset["preset_type"],
) {
  switch (type) {
    case "Performance":
      return "border-orange-500/30 bg-orange-500/15 text-orange-400";

    case "Balanced":
      return "border-cyan-500/30 bg-cyan-500/15 text-cyan-400";

    case "Battery":
      return "border-green-500/30 bg-green-500/15 text-green-400";

    case "Docked":
      return "border-red-500/30 bg-red-500/15 text-red-400";

    default:
      return "border-purple-500/30 bg-purple-500/15 text-purple-400";
  }
}

function getStatusStyle(
  status: DatabasePreset["status"],
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

export default async function AdminPresetsPage({
  searchParams,
}: AdminPresetsPageProps) {
  const { error, success } = await searchParams;

  const {
    supabase,
    user,
    role,
  } = await requireRole(
    PRESET_EDITOR_ROLES,
    "/",
  );

  const isBenchmarkTester =
    role === "benchmark_tester";

  const [
    gamesResult,
    handheldsResult,
    presetsResult,
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

    (() => {
      let query = supabase
        .from("presets")
        .select(`
          id,
          name,
          preset_type,
          resolution,
          tdp,
          fps_average,
          one_percent_low,
          upscaler,
          battery_life,
          community_rating,
          summary,
          status,
          created_by,
          created_at,
          games (
            name,
            slug
          ),
          handhelds (
            name,
            slug
          ),
          preset_setting_groups (
            id,
            name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (isBenchmarkTester) {
        query = query.eq(
          "created_by",
          user.id,
        );
      }

      return query;
    })(),
  ]);

  const games = gamesResult.data ?? [];
  const handhelds =
    handheldsResult.data ?? [];

  const presets =
    (presetsResult.data ??
      []) as unknown as DatabasePreset[];

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
            <Link
              href={
                isBenchmarkTester
                  ? "/admin/tester"
                  : "/admin"
              }
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              {isBenchmarkTester
                ? "Benchmark workspace"
                : "Content Management"}
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Presets
            </h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              {isBenchmarkTester
                ? "Build draft presets for your benchmark tests. Only your own presets are shown here."
                : "Create and edit detailed settings profiles with completely flexible game-specific groups and values."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Database total
            </p>

            <p className="mt-2 text-3xl font-black">
              {presets.length}
            </p>
          </div>
        </div>

        {isBenchmarkTester && (
          <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 text-cyan-100">
            <p className="font-black">
              Benchmark Tester preset access
            </p>

            <p className="mt-2 text-sm leading-6 text-cyan-100/70">
              Presets created with this role are always saved as drafts.
              You can edit and delete only your own drafts, then select them
              while building a benchmark.
            </p>

            <Link
              href="/admin/benchmarks"
              className="mt-4 inline-flex text-sm font-black text-white transition hover:text-cyan-300"
            >
              Open benchmark workspace →
            </Link>
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

        {(games.length === 0 ||
          handhelds.length === 0) && (
          <div className="mt-8 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 text-orange-200">
            A preset needs at least one game and one
            handheld in the database.
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            {isBenchmarkTester
              ? "New Draft Preset"
              : "New Preset"}
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Build preset
          </h2>

          <PresetCreateForm
            games={games}
            handhelds={handhelds}
            action={createPreset}
          />
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                {isBenchmarkTester
                  ? "My Draft Presets"
                  : "Existing Content"}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Preset database
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {presets.length}{" "}
              {presets.length === 1
                ? "preset"
                : "presets"}
            </p>
          </div>

          {presets.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-black">
                No presets in Supabase yet
              </h3>

              <p className="mt-2 text-slate-400">
                Build the first preset using the editor
                above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {presets.map((preset) => (
                <article
                  key={preset.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        {preset.games?.name ??
                          "Unknown game"}
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        {preset.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        {preset.handhelds?.name ??
                          "Unknown handheld"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getPresetStyle(
                          preset.preset_type,
                        )}`}
                      >
                        {preset.preset_type}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
                          preset.status,
                        )}`}
                      >
                        {preset.status}
                      </span>
                    </div>
                  </div>

                  {preset.summary && (
                    <p className="mt-5 leading-7 text-slate-400">
                      {preset.summary}
                    </p>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <PresetStat
                      label="Resolution"
                      value={
                        preset.resolution ??
                        "Not set"
                      }
                    />

                    <PresetStat
                      label="TDP"
                      value={
                        preset.tdp ?? "Not set"
                      }
                    />

                    <PresetStat
                      label="Average FPS"
                      value={
                        preset.fps_average !== null
                          ? String(
                              preset.fps_average,
                            )
                          : "Not set"
                      }
                    />

                    <PresetStat
                      label="1% Low"
                      value={
                        preset.one_percent_low !== null
                          ? String(
                              preset.one_percent_low,
                            )
                          : "Not set"
                      }
                    />

                    <PresetStat
                      label="Upscaler"
                      value={
                        preset.upscaler ??
                        "Not set"
                      }
                    />

                    <PresetStat
                      label="Settings groups"
                      value={String(
                        preset
                          .preset_setting_groups
                          .length,
                      )}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                    <Link
                      href={`/admin/presets/${preset.id}/edit`}
                      className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                    >
                      Edit
                    </Link>

                    {preset.games?.slug && (
                      <Link
                        href={`/games/${preset.games.slug}`}
                        target="_blank"
                        className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                      >
                        Open game
                      </Link>
                    )}

                    {preset.handhelds?.slug && (
                      <Link
                        href={`/handhelds/${preset.handhelds.slug}`}
                        target="_blank"
                        className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-400 transition hover:bg-purple-500 hover:text-white"
                      >
                        Open handheld
                      </Link>
                    )}

                    <form action={deletePreset}>
                      <input
                        type="hidden"
                        name="presetId"
                        value={preset.id}
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

interface PresetStatProps {
  label: string;
  value: string;
}

function PresetStat({
  label,
  value,
}: PresetStatProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}