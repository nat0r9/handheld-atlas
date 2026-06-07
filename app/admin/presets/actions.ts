"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

interface ParsedSettingItem {
  label: string;
  value: string;
  note: string;
  sortOrder: number;
}

interface ParsedSettingGroup {
  name: string;
  sortOrder: number;
  items: ParsedSettingItem[];
}

interface RelationWithSlug {
  slug: string;
}

interface PresetLookup {
  published_at: string | null;
  games:
    | RelationWithSlug
    | RelationWithSlug[]
    | null;
  handhelds:
    | RelationWithSlug
    | RelationWithSlug[]
    | null;
}

interface PresetDeleteLookup {
  games:
    | RelationWithSlug
    | RelationWithSlug[]
    | null;
  handhelds:
    | RelationWithSlug
    | RelationWithSlug[]
    | null;
}

const validPresetTypes = [
  "Performance",
  "Balanced",
  "Battery",
  "Docked",
  "Custom",
] as const;

type PresetType =
  (typeof validPresetTypes)[number];

type ContentStatus =
  | "draft"
  | "published"
  | "archived";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile, error } =
    await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

  if (error || !profile?.is_admin) {
    redirect("/admin/login");
  }

  return {
    supabase,
    user,
  };
}

function requiredText(
  formData: FormData,
  name: string,
) {
  return String(
    formData.get(name) ?? "",
  ).trim();
}

function optionalText(
  formData: FormData,
  name: string,
) {
  const value = requiredText(
    formData,
    name,
  );

  return value.length > 0
    ? value
    : null;
}

function optionalNumber(
  formData: FormData,
  name: string,
) {
  const value = requiredText(
    formData,
    name,
  );

  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getStatus(
  formData: FormData,
): ContentStatus {
  const value = requiredText(
    formData,
    "status",
  );

  if (
    value === "published" ||
    value === "archived" ||
    value === "draft"
  ) {
    return value;
  }

  return "draft";
}

function getPresetType(
  formData: FormData,
): PresetType {
  const value = requiredText(
    formData,
    "presetType",
  );

  if (
    validPresetTypes.includes(
      value as PresetType,
    )
  ) {
    return value as PresetType;
  }

  return "Custom";
}

function getRelationSlug(
  relation:
    | RelationWithSlug
    | RelationWithSlug[]
    | null
    | undefined,
) {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.slug ?? null;
  }

  return relation.slug;
}

function parseSettings(
  formData: FormData,
): ParsedSettingGroup[] {
  const rawValue = requiredText(
    formData,
    "settingsJson",
  );

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown =
      JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((group, groupIndex) => {
        if (
          typeof group !== "object" ||
          group === null
        ) {
          return null;
        }

        const groupRecord =
          group as Record<string, unknown>;

        const name =
          typeof groupRecord.name === "string"
            ? groupRecord.name.trim()
            : "";

        const rawItems = Array.isArray(
          groupRecord.items,
        )
          ? groupRecord.items
          : [];

        const items = rawItems
          .map((item, itemIndex) => {
            if (
              typeof item !== "object" ||
              item === null
            ) {
              return null;
            }

            const itemRecord =
              item as Record<string, unknown>;

            const label =
              typeof itemRecord.label ===
              "string"
                ? itemRecord.label.trim()
                : "";

            const value =
              typeof itemRecord.value ===
              "string"
                ? itemRecord.value.trim()
                : "";

            const note =
              typeof itemRecord.note ===
              "string"
                ? itemRecord.note.trim()
                : "";

            if (!label || !value) {
              return null;
            }

            return {
              label,
              value,
              note,
              sortOrder: itemIndex,
            };
          })
          .filter(
            (
              item,
            ): item is ParsedSettingItem =>
              item !== null,
          );

        if (
          !name ||
          items.length === 0
        ) {
          return null;
        }

        return {
          name,
          sortOrder: groupIndex,
          items,
        };
      })
      .filter(
        (
          group,
        ): group is ParsedSettingGroup =>
          group !== null,
      );
  } catch {
    return [];
  }
}

function validateCommunityRating(
  communityRating: number | null,
  errorPath: string,
) {
  if (
    communityRating !== null &&
    (communityRating < 0 ||
      communityRating > 5)
  ) {
    redirect(
      `${errorPath}?error=Community%20rating%20must%20be%20between%200%20and%205`,
    );
  }
}

async function createSettingGroups(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  presetId: string,
  settingGroups: ParsedSettingGroup[],
) {
  const createdGroupIds: string[] = [];

  try {
    for (const group of settingGroups) {
      const {
        data: createdGroup,
        error: groupError,
      } = await supabase
        .from("preset_setting_groups")
        .insert({
          preset_id: presetId,
          name: group.name,
          sort_order: group.sortOrder,
        })
        .select("id")
        .single();

      if (
        groupError ||
        !createdGroup
      ) {
        throw new Error(
          groupError?.message ??
            "Could not create settings group",
        );
      }

      createdGroupIds.push(
        createdGroup.id,
      );

      const itemsToInsert =
        group.items.map((item) => ({
          group_id: createdGroup.id,
          label: item.label,
          value: item.value,
          note: item.note || null,
          sort_order: item.sortOrder,
        }));

      const { error: itemsError } =
        await supabase
          .from("preset_setting_items")
          .insert(itemsToInsert);

      if (itemsError) {
        throw new Error(
          itemsError.message,
        );
      }
    }

    return {
      createdGroupIds,
      errorMessage: null,
    };
  } catch (error) {
    if (
      createdGroupIds.length > 0
    ) {
      await supabase
        .from("preset_setting_groups")
        .delete()
        .in("id", createdGroupIds);
    }

    return {
      createdGroupIds: [],
      errorMessage:
        error instanceof Error
          ? error.message
          : "Could not save preset settings",
    };
  }
}

function revalidatePresetPages(
  presetId?: string,
  gameSlug?: string | null,
  handheldSlug?: string | null,
) {
  revalidatePath("/admin");
  revalidatePath("/admin/presets");
  revalidatePath("/presets");
  revalidatePath("/games");
  revalidatePath("/handhelds");
  revalidatePath("/benchmarks");
  revalidatePath("/");

  if (presetId) {
    revalidatePath(
      `/admin/presets/${presetId}/edit`,
    );
  }

  if (gameSlug) {
    revalidatePath(
      `/games/${gameSlug}`,
    );
  }

  if (handheldSlug) {
    revalidatePath(
      `/handhelds/${handheldSlug}`,
    );
  }
}

export async function createPreset(
  formData: FormData,
) {
  const { supabase, user } =
    await requireAdmin();

  const gameId = requiredText(
    formData,
    "gameId",
  );

  const handheldId = requiredText(
    formData,
    "handheldId",
  );

  const name = requiredText(
    formData,
    "name",
  );

  const presetType =
    getPresetType(formData);

  const status =
    getStatus(formData);

  const settingGroups =
    parseSettings(formData);

  if (
    !gameId ||
    !handheldId ||
    !name
  ) {
    redirect(
      "/admin/presets?error=Game%2C%20handheld%20and%20preset%20name%20are%20required",
    );
  }

  const communityRating =
    optionalNumber(
      formData,
      "communityRating",
    );

  validateCommunityRating(
    communityRating,
    "/admin/presets",
  );

  const {
    data: gameRelation,
    error: gameRelationError,
  } = await supabase
    .from("games")
    .select("slug")
    .eq("id", gameId)
    .single();

  if (
    gameRelationError ||
    !gameRelation
  ) {
    redirect(
      "/admin/presets?error=Selected%20game%20was%20not%20found",
    );
  }

  const {
    data: handheldRelation,
    error: handheldRelationError,
  } = await supabase
    .from("handhelds")
    .select("slug")
    .eq("id", handheldId)
    .single();

  if (
    handheldRelationError ||
    !handheldRelation
  ) {
    redirect(
      "/admin/presets?error=Selected%20handheld%20was%20not%20found",
    );
  }

  const {
    data: preset,
    error: presetError,
  } = await supabase
    .from("presets")
    .insert({
      game_id: gameId,
      handheld_id: handheldId,
      name,
      preset_type: presetType,

      resolution: optionalText(
        formData,
        "resolution",
      ),

      tdp: optionalText(
        formData,
        "tdp",
      ),

      fps_average: optionalNumber(
        formData,
        "fpsAverage",
      ),

      one_percent_low:
        optionalNumber(
          formData,
          "onePercentLow",
        ),

      upscaler: optionalText(
        formData,
        "upscaler",
      ),

      battery_life: optionalText(
        formData,
        "batteryLife",
      ),

      community_rating:
        communityRating,

      summary: optionalText(
        formData,
        "summary",
      ),

      status,
      created_by: user.id,

      published_at:
        status === "published"
          ? new Date().toISOString()
          : null,
    })
    .select("id")
    .single();

  if (
    presetError ||
    !preset
  ) {
    redirect(
      `/admin/presets?error=${encodeURIComponent(
        presetError?.message ??
          "Could not create preset",
      )}`,
    );
  }

  const settingsResult =
    await createSettingGroups(
      supabase,
      preset.id,
      settingGroups,
    );

  if (
    settingsResult.errorMessage
  ) {
    await supabase
      .from("presets")
      .delete()
      .eq("id", preset.id);

    redirect(
      `/admin/presets?error=${encodeURIComponent(
        settingsResult.errorMessage,
      )}`,
    );
  }

  revalidatePresetPages(
    preset.id,
    gameRelation.slug,
    handheldRelation.slug,
  );

  redirect(
    "/admin/presets?success=Preset%20created",
  );
}

export async function updatePreset(
  formData: FormData,
) {
  const { supabase } =
    await requireAdmin();

  const presetId = requiredText(
    formData,
    "presetId",
  );

  const gameId = requiredText(
    formData,
    "gameId",
  );

  const handheldId = requiredText(
    formData,
    "handheldId",
  );

  const name = requiredText(
    formData,
    "name",
  );

  const presetType =
    getPresetType(formData);

  const status =
    getStatus(formData);

  const settingGroups =
    parseSettings(formData);

  if (!presetId) {
    redirect(
      "/admin/presets?error=Missing%20preset%20ID",
    );
  }

  const editPath =
    `/admin/presets/${presetId}/edit`;

  if (
    !gameId ||
    !handheldId ||
    !name
  ) {
    redirect(
      `${editPath}?error=Game%2C%20handheld%20and%20preset%20name%20are%20required`,
    );
  }

  const communityRating =
    optionalNumber(
      formData,
      "communityRating",
    );

  validateCommunityRating(
    communityRating,
    editPath,
  );

  const {
    data: currentData,
    error: currentPresetError,
  } = await supabase
    .from("presets")
    .select(`
      published_at,
      games (
        slug
      ),
      handhelds (
        slug
      )
    `)
    .eq("id", presetId)
    .single();

  if (
    currentPresetError ||
    !currentData
  ) {
    redirect(
      "/admin/presets?error=Preset%20not%20found",
    );
  }

  const currentPreset =
    currentData as unknown as PresetLookup;

  const {
    data: newGame,
    error: newGameError,
  } = await supabase
    .from("games")
    .select("slug")
    .eq("id", gameId)
    .single();

  if (
    newGameError ||
    !newGame
  ) {
    redirect(
      `${editPath}?error=Selected%20game%20was%20not%20found`,
    );
  }

  const {
    data: newHandheld,
    error: newHandheldError,
  } = await supabase
    .from("handhelds")
    .select("slug")
    .eq("id", handheldId)
    .single();

  if (
    newHandheldError ||
    !newHandheld
  ) {
    redirect(
      `${editPath}?error=Selected%20handheld%20was%20not%20found`,
    );
  }

  const publishedAt =
    status === "published"
      ? currentPreset.published_at ??
        new Date().toISOString()
      : null;

  const { data: oldGroups } =
    await supabase
      .from("preset_setting_groups")
      .select("id")
      .eq("preset_id", presetId);

  const oldGroupIds =
    (oldGroups ?? []).map(
      (group) => group.id,
    );

  const settingsResult =
    await createSettingGroups(
      supabase,
      presetId,
      settingGroups,
    );

  if (
    settingsResult.errorMessage
  ) {
    redirect(
      `${editPath}?error=${encodeURIComponent(
        settingsResult.errorMessage,
      )}`,
    );
  }

  const { error: updateError } =
    await supabase
      .from("presets")
      .update({
        game_id: gameId,
        handheld_id: handheldId,
        name,
        preset_type: presetType,

        resolution: optionalText(
          formData,
          "resolution",
        ),

        tdp: optionalText(
          formData,
          "tdp",
        ),

        fps_average: optionalNumber(
          formData,
          "fpsAverage",
        ),

        one_percent_low:
          optionalNumber(
            formData,
            "onePercentLow",
          ),

        upscaler: optionalText(
          formData,
          "upscaler",
        ),

        battery_life: optionalText(
          formData,
          "batteryLife",
        ),

        community_rating:
          communityRating,

        summary: optionalText(
          formData,
          "summary",
        ),

        status,
        published_at: publishedAt,
      })
      .eq("id", presetId);

  if (updateError) {
    if (
      settingsResult
        .createdGroupIds.length > 0
    ) {
      await supabase
        .from("preset_setting_groups")
        .delete()
        .in(
          "id",
          settingsResult
            .createdGroupIds,
        );
    }

    redirect(
      `${editPath}?error=${encodeURIComponent(
        updateError.message,
      )}`,
    );
  }

  if (oldGroupIds.length > 0) {
    const { error: deleteOldError } =
      await supabase
        .from("preset_setting_groups")
        .delete()
        .in("id", oldGroupIds);

    if (deleteOldError) {
      if (
        settingsResult
          .createdGroupIds.length > 0
      ) {
        await supabase
          .from("preset_setting_groups")
          .delete()
          .in(
            "id",
            settingsResult
              .createdGroupIds,
          );
      }

      redirect(
        `${editPath}?error=${encodeURIComponent(
          deleteOldError.message,
        )}`,
      );
    }
  }

  const oldGameSlug =
    getRelationSlug(
      currentPreset.games,
    );

  const oldHandheldSlug =
    getRelationSlug(
      currentPreset.handhelds,
    );

  revalidatePresetPages(
    presetId,
    newGame.slug,
    newHandheld.slug,
  );

  if (
    oldGameSlug &&
    oldGameSlug !== newGame.slug
  ) {
    revalidatePath(
      `/games/${oldGameSlug}`,
    );
  }

  if (
    oldHandheldSlug &&
    oldHandheldSlug !==
      newHandheld.slug
  ) {
    revalidatePath(
      `/handhelds/${oldHandheldSlug}`,
    );
  }

  redirect(
    `${editPath}?success=Preset%20updated`,
  );
}

export async function deletePreset(
  formData: FormData,
) {
  const { supabase } =
    await requireAdmin();

  const presetId = requiredText(
    formData,
    "presetId",
  );

  if (!presetId) {
    redirect(
      "/admin/presets?error=Missing%20preset%20ID",
    );
  }

  const {
    data: lookupData,
    error: presetLookupError,
  } = await supabase
    .from("presets")
    .select(`
      games (
        slug
      ),
      handhelds (
        slug
      )
    `)
    .eq("id", presetId)
    .single();

  if (
    presetLookupError ||
    !lookupData
  ) {
    redirect(
      "/admin/presets?error=Preset%20not%20found",
    );
  }

  const preset =
    lookupData as unknown as PresetDeleteLookup;

  const gameSlug =
    getRelationSlug(
      preset.games,
    );

  const handheldSlug =
    getRelationSlug(
      preset.handhelds,
    );

  const { error } = await supabase
    .from("presets")
    .delete()
    .eq("id", presetId);

  if (error) {
    redirect(
      `/admin/presets?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePresetPages(
    presetId,
    gameSlug,
    handheldSlug,
  );

  redirect(
    "/admin/presets?success=Preset%20deleted",
  );
}