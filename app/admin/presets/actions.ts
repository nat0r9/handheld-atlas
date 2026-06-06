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

const validPresetTypes = [
  "Performance",
  "Balanced",
  "Battery",
  "Docked",
  "Custom",
] as const;

type PresetType =
  (typeof validPresetTypes)[number];

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile, error } = await supabase
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
  return String(formData.get(name) ?? "").trim();
}

function optionalText(
  formData: FormData,
  name: string,
) {
  const value = requiredText(formData, name);

  return value.length > 0 ? value : null;
}

function optionalNumber(
  formData: FormData,
  name: string,
) {
  const value = requiredText(formData, name);

  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getStatus(formData: FormData) {
  const value = requiredText(formData, "status");

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

        const record = group as Record<
          string,
          unknown
        >;

        const name =
          typeof record.name === "string"
            ? record.name.trim()
            : "";

        const rawItems = Array.isArray(
          record.items,
        )
          ? record.items
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

        if (!name || items.length === 0) {
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

  const name = requiredText(formData, "name");
  const presetType = getPresetType(formData);
  const status = getStatus(formData);
  const settingGroups = parseSettings(formData);

  if (!gameId || !handheldId || !name) {
    redirect(
      "/admin/presets?error=Game%2C%20handheld%20and%20preset%20name%20are%20required",
    );
  }

  const communityRating = optionalNumber(
    formData,
    "communityRating",
  );

  if (
    communityRating !== null &&
    (communityRating < 0 ||
      communityRating > 5)
  ) {
    redirect(
      "/admin/presets?error=Community%20rating%20must%20be%20between%200%20and%205",
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
      tdp: optionalText(formData, "tdp"),
      fps_average: optionalNumber(
        formData,
        "fpsAverage",
      ),
      one_percent_low: optionalNumber(
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
      community_rating: communityRating,
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

  if (presetError || !preset) {
    redirect(
      `/admin/presets?error=${encodeURIComponent(
        presetError?.message ??
          "Could not create preset",
      )}`,
    );
  }

  try {
    for (const group of settingGroups) {
      const {
        data: createdGroup,
        error: groupError,
      } = await supabase
        .from("preset_setting_groups")
        .insert({
          preset_id: preset.id,
          name: group.name,
          sort_order: group.sortOrder,
        })
        .select("id")
        .single();

      if (groupError || !createdGroup) {
        throw new Error(
          groupError?.message ??
            "Could not create settings group",
        );
      }

      const itemsToInsert = group.items.map(
        (item) => ({
          group_id: createdGroup.id,
          label: item.label,
          value: item.value,
          note: item.note || null,
          sort_order: item.sortOrder,
        }),
      );

      const { error: itemsError } =
        await supabase
          .from("preset_setting_items")
          .insert(itemsToInsert);

      if (itemsError) {
        throw new Error(itemsError.message);
      }
    }
  } catch (error) {
    await supabase
      .from("presets")
      .delete()
      .eq("id", preset.id);

    const message =
      error instanceof Error
        ? error.message
        : "Could not save preset settings";

    redirect(
      `/admin/presets?error=${encodeURIComponent(
        message,
      )}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/presets");
  revalidatePath("/presets");
  revalidatePath("/games");
  revalidatePath("/handhelds");

  redirect(
    "/admin/presets?success=Preset%20created",
  );
}

export async function deletePreset(
  formData: FormData,
) {
  const { supabase } = await requireAdmin();

  const presetId = requiredText(
    formData,
    "presetId",
  );

  if (!presetId) {
    redirect(
      "/admin/presets?error=Missing%20preset%20ID",
    );
  }

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

  revalidatePath("/admin");
  revalidatePath("/admin/presets");
  revalidatePath("/presets");
  revalidatePath("/games");
  revalidatePath("/handhelds");

  redirect(
    "/admin/presets?success=Preset%20deleted",
  );
}