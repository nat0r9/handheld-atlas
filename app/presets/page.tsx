import PresetsCatalog, {
  type PublicPreset,
} from "../../components/PresetsCatalog";
import { createClient } from "../../lib/supabase/server";

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
  published_at: string | null;
  games: {
    name: string;
    slug: string;
  } | null;
  handhelds: {
    name: string;
    slug: string;
    manufacturer: string;
  } | null;
  preset_setting_groups: DatabaseSettingGroup[];
  preset_votes: Array<{
    user_id: string;
  }>;
}

export default async function PresetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
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
      published_at,
      games (
        name,
        slug
      ),
      handhelds (
        name,
        slug,
        manufacturer
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
      ),
      preset_votes (
        user_id
      )
    `)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  const databasePresets =
    (data ?? []) as unknown as DatabasePreset[];

  const presets: PublicPreset[] = databasePresets.map(
    (preset) => ({
      id: preset.id,
      name: preset.name,
      type: preset.preset_type,
      resolution: preset.resolution,
      tdp: preset.tdp,
      averageFps: preset.fps_average,
      onePercentLow: preset.one_percent_low,
      upscaler: preset.upscaler,
      batteryLife: preset.battery_life,
      communityRating: preset.community_rating,
      summary: preset.summary,
      publishedAt: preset.published_at,
      upvoteCount:
        preset.preset_votes?.length ?? 0,
      hasUpvoted:
        user !== null &&
        (preset.preset_votes ?? []).some(
          (vote) =>
            vote.user_id === user.id,
        ),
      game: preset.games,
      handheld: preset.handhelds,
      groups: [...(preset.preset_setting_groups ?? [])]
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
              note: item.note,
            })),
        })),
    }),
  );

  return (
    <PresetsCatalog
      presets={presets}
      databaseError={error?.message ?? null}
    />
  );
}