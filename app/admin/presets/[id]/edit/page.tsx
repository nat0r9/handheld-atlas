import Link from "next/link";
import { redirect } from "next/navigation";
import PresetEditForm, {
  type EditablePreset,
} from "../../../../../components/admin/PresetEditForm";
import { createClient } from "../../../../../lib/supabase/server";
import { updatePreset } from "../../actions";

interface EditPresetPageProps {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface DatabaseSettingItem {
  id: string;
  label: string;
  value: string;
  note: string | null;
  sort_order: number;
}

interface DatabaseSettingGroup {
  id: string;
  name: string;
  sort_order: number;
  preset_setting_items: DatabaseSettingItem[];
}

interface DatabasePreset {
  id: string;
  game_id: string;
  handheld_id: string;
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
  preset_setting_groups: DatabaseSettingGroup[];
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
  } | null;
}

export default async function EditPresetPage({
  params,
  searchParams,
}: EditPresetPageProps) {
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
    presetResult,
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
        game_id,
        handheld_id,
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
          name,
          sort_order,
          preset_setting_items (
            id,
            label,
            value,
            note,
            sort_order
          )
        )
      `)
      .eq("id", id)
      .single(),
  ]);

  if (
    presetResult.error ||
    !presetResult.data
  ) {
    redirect(
      "/admin/presets?error=Preset%20not%20found",
    );
  }

  if (
    gamesResult.error ||
    handheldsResult.error
  ) {
    const message =
      gamesResult.error?.message ??
      handheldsResult.error?.message ??
      "Could not load preset form data";

    redirect(
      `/admin/presets?error=${encodeURIComponent(
        message,
      )}`,
    );
  }

  const databasePreset =
    presetResult.data as unknown as DatabasePreset;

  const sortedGroups = [
    ...(databasePreset.preset_setting_groups ?? []),
  ]
    .sort(
      (first, second) =>
        first.sort_order - second.sort_order,
    )
    .map((group) => ({
      id: group.id,
      name: group.name,
      items: [
        ...(group.preset_setting_items ?? []),
      ]
        .sort(
          (first, second) =>
            first.sort_order - second.sort_order,
        )
        .map((item) => ({
          id: item.id,
          label: item.label,
          value: item.value,
          note: item.note ?? "",
        })),
    }));

  const editablePreset: EditablePreset = {
    id: databasePreset.id,
    gameId: databasePreset.game_id,
    handheldId: databasePreset.handheld_id,
    name: databasePreset.name,
    presetType: databasePreset.preset_type,
    resolution: databasePreset.resolution ?? "",
    tdp: databasePreset.tdp ?? "",
    fpsAverage:
      databasePreset.fps_average !== null
        ? String(databasePreset.fps_average)
        : "",
    onePercentLow:
      databasePreset.one_percent_low !== null
        ? String(databasePreset.one_percent_low)
        : "",
    upscaler: databasePreset.upscaler ?? "",
    batteryLife:
      databasePreset.battery_life ?? "",
    communityRating:
      databasePreset.community_rating !== null
        ? String(
            databasePreset.community_rating,
          )
        : "",
    summary: databasePreset.summary ?? "",
    status: databasePreset.status,
    groups: sortedGroups,
  };

  const games = gamesResult.data ?? [];
  const handhelds =
    handheldsResult.data ?? [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/presets"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to presets
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Content Management
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Edit preset
            </h1>

            <p className="mt-4 max-w-3xl text-slate-400">
              Update performance data, publishing state
              and every game-specific setting group.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Current profile
            </p>

            <p className="mt-2 text-lg font-black">
              {databasePreset.games?.name ??
                "Unknown game"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {databasePreset.handhelds?.name ??
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
          <PresetEditForm
            preset={editablePreset}
            games={games}
            handhelds={handhelds}
            action={updatePreset}
          />

          <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-800 pt-6">
            <Link
              href="/admin/presets"
              className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Cancel and return
            </Link>

            {databasePreset.games?.slug && (
              <Link
                href={`/games/${databasePreset.games.slug}`}
                target="_blank"
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
              >
                Open game page ↗
              </Link>
            )}

            {databasePreset.handhelds?.slug && (
              <Link
                href={`/handhelds/${databasePreset.handhelds.slug}`}
                target="_blank"
                className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-5 py-3 font-bold text-purple-400 transition hover:bg-purple-500 hover:text-white"
              >
                Open handheld page ↗
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}