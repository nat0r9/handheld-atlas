"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

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

type PresetType = (typeof validPresetTypes)[number];

function requiredText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  const value = requiredText(formData, name);
  return value.length > 0 ? value : null;
}

function optionalNumber(formData: FormData, name: string) {
  const value = requiredText(formData, name);

  if (!value) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getPresetType(formData: FormData): PresetType {
  const value = requiredText(formData, "presetType");

  if (validPresetTypes.includes(value as PresetType)) {
    return value as PresetType;
  }

  return "Custom";
}

function parseSettings(formData: FormData): ParsedSettingGroup[] {
  const rawValue = requiredText(formData, "settingsJson");

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((group, groupIndex) => {
        if (typeof group !== "object" || group === null) {
          return null;
        }

        const groupRecord = group as Record<string, unknown>;
        const name =
          typeof groupRecord.name === "string"
            ? groupRecord.name.trim()
            : "";

        const rawItems = Array.isArray(groupRecord.items)
          ? groupRecord.items
          : [];

        const items = rawItems
          .map((item, itemIndex) => {
            if (typeof item !== "object" || item === null) {
              return null;
            }

            const itemRecord = item as Record<string, unknown>;
            const label =
              typeof itemRecord.label === "string"
                ? itemRecord.label.trim()
                : "";

            const value =
              typeof itemRecord.value === "string"
                ? itemRecord.value.trim()
                : "";

            const note =
              typeof itemRecord.note === "string"
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
            (item): item is ParsedSettingItem => item !== null,
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
        (group): group is ParsedSettingGroup => group !== null,
      );
  } catch {
    return [];
  }
}

function redirectWithError(
  path: string,
  message: string,
): never {
  redirect(
    `${path}?error=${encodeURIComponent(message)}`,
  );
}

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function createSubmission(formData: FormData) {
  const { supabase, user } = await requireUser();

  const gameId = requiredText(formData, "gameId");
  const handheldId = requiredText(formData, "handheldId");
  const name = requiredText(formData, "name");
  const intent = requiredText(formData, "intent");
  const presetType = getPresetType(formData);
  const settingGroups = parseSettings(formData);

  if (!gameId || !handheldId || !name) {
    redirectWithError(
      "/my-submissions/new",
      "Game, handheld and preset name are required.",
    );
  }

  const {
    data: submission,
    error: submissionError,
  } = await supabase
    .from("preset_submissions")
    .insert({
      user_id: user.id,
      game_id: gameId,
      handheld_id: handheldId,
      name,
      preset_type: presetType,
      resolution: optionalText(formData, "resolution"),
      tdp: optionalText(formData, "tdp"),
      fps_average: optionalNumber(formData, "fpsAverage"),
      one_percent_low: optionalNumber(
        formData,
        "onePercentLow",
      ),
      upscaler: optionalText(formData, "upscaler"),
      battery_life: optionalText(formData, "batteryLife"),
      summary: optionalText(formData, "summary"),
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (submissionError || !submission) {
    redirectWithError(
      "/my-submissions/new",
      submissionError?.message ??
        "Could not create submission.",
    );
  }

  const createdGroupIds: string[] = [];

  try {
    for (const group of settingGroups) {
      const {
        data: createdGroup,
        error: groupError,
      } = await supabase
        .from("preset_submission_groups")
        .insert({
          submission_id: submission.id,
          name: group.name,
          sort_order: group.sortOrder,
        })
        .select("id")
        .single();

      if (groupError || !createdGroup) {
        throw new Error(
          groupError?.message ??
            "Could not create settings group.",
        );
      }

      createdGroupIds.push(createdGroup.id);

      const itemsToInsert = group.items.map((item) => ({
        group_id: createdGroup.id,
        label: item.label,
        value: item.value,
        note: item.note || null,
        sort_order: item.sortOrder,
      }));

      const { error: itemsError } = await supabase
        .from("preset_submission_items")
        .insert(itemsToInsert);

      if (itemsError) {
        throw new Error(itemsError.message);
      }
    }

    if (intent === "submit") {
      const { error: submitError } = await supabase
        .from("preset_submissions")
        .update({
          status: "pending",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (submitError) {
        throw new Error(submitError.message);
      }
    }
  } catch (error) {
    if (createdGroupIds.length > 0) {
      await supabase
        .from("preset_submission_groups")
        .delete()
        .in("id", createdGroupIds);
    }

    await supabase
      .from("preset_submissions")
      .delete()
      .eq("id", submission.id);

    redirectWithError(
      "/my-submissions/new",
      error instanceof Error
        ? error.message
        : "Could not save submission settings.",
    );
  }

  revalidatePath("/my-submissions");

  const successMessage =
    intent === "submit"
      ? "Preset submitted for review."
      : "Draft saved successfully.";

  redirect(
    `/my-submissions?success=${encodeURIComponent(
      successMessage,
    )}`,
  );
}

async function getEditableSubmission(
  submissionId: string,
) {
  const { supabase, user } =
    await requireUser();

  const {
    data: submission,
    error,
  } = await supabase
    .from("preset_submissions")
    .select("id, status")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !submission) {
    redirect(
      "/my-submissions?error=Submission%20not%20found",
    );
  }

  if (
    ![
      "draft",
      "rejected",
      "changes_requested",
    ].includes(submission.status)
  ) {
    redirect(
      "/my-submissions?error=This%20submission%20is%20locked%20for%20review",
    );
  }

  return {
    supabase,
    user,
    submission,
  };
}

export async function updateSubmission(
  formData: FormData,
) {
  const submissionId = requiredText(
    formData,
    "submissionId",
  );

  if (!submissionId) {
    redirect(
      "/my-submissions?error=Missing%20submission%20ID",
    );
  }

  const editPath =
    `/my-submissions/${submissionId}/edit`;

  const {
    supabase,
  } = await getEditableSubmission(
    submissionId,
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

  const intent = requiredText(
    formData,
    "intent",
  );

  if (
    !gameId ||
    !handheldId ||
    !name
  ) {
    redirectWithError(
      editPath,
      "Game, handheld and preset name are required.",
    );
  }

  const settingGroups =
    parseSettings(formData);

  const {
    data: oldGroups,
  } = await supabase
    .from("preset_submission_groups")
    .select("id")
    .eq(
      "submission_id",
      submissionId,
    );

  const oldGroupIds =
    (oldGroups ?? []).map(
      (group) => group.id,
    );

  const {
    error: updateError,
  } = await supabase
    .from("preset_submissions")
    .update({
      game_id: gameId,
      handheld_id: handheldId,
      name,
      preset_type:
        getPresetType(formData),
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
      summary: optionalText(
        formData,
        "summary",
      ),
      status:
        intent === "submit"
          ? "pending"
          : "draft",
      submitted_at:
        intent === "submit"
          ? new Date().toISOString()
          : null,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) {
    redirectWithError(
      editPath,
      updateError.message,
    );
  }

  const createdGroupIds: string[] = [];

  try {
    for (const group of settingGroups) {
      const {
        data: createdGroup,
        error: groupError,
      } = await supabase
        .from(
          "preset_submission_groups",
        )
        .insert({
          submission_id: submissionId,
          name: group.name,
          sort_order:
            group.sortOrder,
        })
        .select("id")
        .single();

      if (
        groupError ||
        !createdGroup
      ) {
        throw new Error(
          groupError?.message ??
            "Could not create settings group.",
        );
      }

      createdGroupIds.push(
        createdGroup.id,
      );

      const itemsToInsert =
        group.items.map((item) => ({
          group_id:
            createdGroup.id,
          label: item.label,
          value: item.value,
          note:
            item.note || null,
          sort_order:
            item.sortOrder,
        }));

      const {
        error: itemsError,
      } = await supabase
        .from(
          "preset_submission_items",
        )
        .insert(itemsToInsert);

      if (itemsError) {
        throw new Error(
          itemsError.message,
        );
      }
    }

    if (oldGroupIds.length > 0) {
      const {
        error: deleteOldError,
      } = await supabase
        .from(
          "preset_submission_groups",
        )
        .delete()
        .in("id", oldGroupIds);

      if (deleteOldError) {
        throw new Error(
          deleteOldError.message,
        );
      }
    }
  } catch (error) {
    if (
      createdGroupIds.length > 0
    ) {
      await supabase
        .from(
          "preset_submission_groups",
        )
        .delete()
        .in(
          "id",
          createdGroupIds,
        );
    }

    redirectWithError(
      editPath,
      error instanceof Error
        ? error.message
        : "Could not update submission settings.",
    );
  }

  revalidatePath(
    "/my-submissions",
  );

  revalidatePath(editPath);

  const successMessage =
    intent === "submit"
      ? "Preset submitted for review."
      : "Draft updated successfully.";

  redirect(
    `/my-submissions?success=${encodeURIComponent(
      successMessage,
    )}`,
  );
}

export async function deleteSubmission(
  formData: FormData,
) {
  const submissionId = requiredText(
    formData,
    "submissionId",
  );

  if (!submissionId) {
    redirect(
      "/my-submissions?error=Missing%20submission%20ID",
    );
  }

  const {
    supabase,
  } = await getEditableSubmission(
    submissionId,
  );

  const {
    error,
  } = await supabase
    .from("preset_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    redirect(
      `/my-submissions?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(
    "/my-submissions",
  );

  redirect(
    "/my-submissions?success=Submission%20deleted",
  );
}

