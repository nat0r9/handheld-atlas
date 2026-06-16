"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getSubmissionReadiness,
  type SubmissionGroupInput,
} from "../../lib/submission-workflow";
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

            return {
              label:
                typeof itemRecord.label === "string"
                  ? itemRecord.label.trim()
                  : "",
              value:
                typeof itemRecord.value === "string"
                  ? itemRecord.value.trim()
                  : "",
              note:
                typeof itemRecord.note === "string"
                  ? itemRecord.note.trim()
                  : "",
              sortOrder: itemIndex,
            };
          })
          .filter(
            (item): item is ParsedSettingItem => item !== null,
          );

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

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function submissionPath(submissionId: string) {
  return `/my-submissions/${submissionId}`;
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

function buildSubmissionPayload(formData: FormData) {
  const settingGroups = parseSettings(formData);
  const gameId = requiredText(formData, "gameId");
  const handheldId = requiredText(formData, "handheldId");
  const name = requiredText(formData, "name");
  const resolution = requiredText(formData, "resolution");
  const tdp = requiredText(formData, "tdp");
  const fpsAverage = optionalNumber(formData, "fpsAverage");
  const onePercentLow = optionalNumber(formData, "onePercentLow");
  const batteryLife = requiredText(formData, "batteryLife");
  const summary = requiredText(formData, "summary");
  const intent = requiredText(formData, "intent");

  const readinessGroups: SubmissionGroupInput[] = settingGroups.map(
    (group) => ({
      name: group.name,
      items: group.items.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    }),
  );

  const readiness = getSubmissionReadiness({
    gameId,
    handheldId,
    name,
    resolution,
    tdp,
    fpsAverage,
    onePercentLow,
    batteryLife,
    summary,
    groups: readinessGroups,
  });

  return {
    gameId,
    handheldId,
    name,
    intent,
    presetType: getPresetType(formData),
    resolution,
    tdp,
    fpsAverage,
    onePercentLow,
    upscaler: optionalText(formData, "upscaler"),
    batteryLife,
    summary,
    settingGroups,
    readiness,
  };
}

function validateSubmissionPayload(
  payload: ReturnType<typeof buildSubmissionPayload>,
  errorPath: string,
) {
  if (!payload.gameId || !payload.handheldId || !payload.name) {
    redirectWithError(
      errorPath,
      "Game, handheld and preset name are required.",
    );
  }

  if (payload.intent === "submit" && !payload.readiness.isReady) {
    redirectWithError(
      errorPath,
      `Finish these readiness checks before review: ${payload.readiness.issues.join(
        ", ",
      )}.`,
    );
  }
}

async function saveSubmissionWithRpc({
  submissionId,
  formData,
  errorPath,
}: {
  submissionId: string | null;
  formData: FormData;
  errorPath: string;
}) {
  const { supabase } = await requireUser();
  const payload = buildSubmissionPayload(formData);

  validateSubmissionPayload(payload, errorPath);

  const { data, error } = await supabase.rpc(
    "save_preset_submission",
    {
      p_submission_id: submissionId,
      p_game_id: payload.gameId,
      p_handheld_id: payload.handheldId,
      p_name: payload.name,
      p_preset_type: payload.presetType,
      p_resolution: payload.resolution || null,
      p_tdp: payload.tdp || null,
      p_fps_average: payload.fpsAverage,
      p_one_percent_low: payload.onePercentLow,
      p_upscaler: payload.upscaler,
      p_battery_life: payload.batteryLife || null,
      p_summary: payload.summary || null,
      p_settings: payload.settingGroups,
      p_submit: payload.intent === "submit",
    },
  );

  if (error || typeof data !== "string") {
    redirectWithError(
      errorPath,
      error?.message ?? "Could not save the submission.",
    );
  }

  return {
    submissionId: data,
    submitted: payload.intent === "submit",
  };
}

export async function createSubmission(formData: FormData) {
  const result = await saveSubmissionWithRpc({
    submissionId: null,
    formData,
    errorPath: "/my-submissions/new",
  });

  revalidatePath("/my-submissions");

  const message = result.submitted
    ? "Preset submitted for review."
    : "Draft saved successfully.";

  redirect(
    `${submissionPath(result.submissionId)}?success=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function updateSubmission(formData: FormData) {
  const submissionId = requiredText(formData, "submissionId");

  if (!submissionId) {
    redirect(
      "/my-submissions?error=Missing%20submission%20ID",
    );
  }

  const editPath = `/my-submissions/${submissionId}/edit`;
  const result = await saveSubmissionWithRpc({
    submissionId,
    formData,
    errorPath: editPath,
  });

  revalidatePath("/my-submissions");
  revalidatePath(submissionPath(submissionId));
  revalidatePath(editPath);

  const message = result.submitted
    ? "New revision submitted for review."
    : "Draft updated successfully.";

  redirect(
    `${submissionPath(submissionId)}?success=${encodeURIComponent(
      message,
    )}`,
  );
}

async function getEditableSubmission(submissionId: string) {
  const { supabase, user } = await requireUser();

  const { data: submission, error } = await supabase
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
    !["draft", "rejected", "changes_requested"].includes(
      submission.status,
    )
  ) {
    redirect(
      `${submissionPath(
        submissionId,
      )}?error=This%20submission%20is%20locked%20for%20review`,
    );
  }

  return { supabase };
}

export async function withdrawSubmission(formData: FormData) {
  const submissionId = requiredText(formData, "submissionId");

  if (!submissionId) {
    redirect(
      "/my-submissions?error=Missing%20submission%20ID",
    );
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc(
    "withdraw_preset_submission",
    {
      p_submission_id: submissionId,
    },
  );

  if (error) {
    redirectWithError(submissionPath(submissionId), error.message);
  }

  revalidatePath("/my-submissions");
  revalidatePath(submissionPath(submissionId));

  redirect(
    `${submissionPath(
      submissionId,
    )}?success=Submission%20withdrawn%20to%20draft`,
  );
}

export async function deleteSubmission(formData: FormData) {
  const submissionId = requiredText(formData, "submissionId");

  if (!submissionId) {
    redirect(
      "/my-submissions?error=Missing%20submission%20ID",
    );
  }

  const { supabase } = await getEditableSubmission(submissionId);
  const { data: deletedSubmission, error } = await supabase
    .from("preset_submissions")
    .delete()
    .eq("id", submissionId)
    .in("status", ["draft", "rejected", "changes_requested"])
    .select("id")
    .maybeSingle();

  if (error || !deletedSubmission) {
    redirectWithError(
      submissionPath(submissionId),
      error?.message ?? "This submission can no longer be deleted.",
    );
  }

  revalidatePath("/my-submissions");

  redirect(
    "/my-submissions?success=Submission%20deleted",
  );
}
