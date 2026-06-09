"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

interface SubmissionItem {
  label: string;
  value: string;
  note: string | null;
  sort_order: number;
}

interface SubmissionGroup {
  name: string;
  sort_order: number;
  preset_submission_items: SubmissionItem[];
}

interface SubmissionForApproval {
  id: string;
  user_id: string;
  game_id: string;
  handheld_id: string;
  name: string;
  preset_type: string;
  resolution: string | null;
  tdp: string | null;
  fps_average: number | null;
  one_percent_low: number | null;
  upscaler: string | null;
  battery_life: string | null;
  summary: string | null;
  status: string;
  preset_submission_groups: SubmissionGroup[];
}

function requiredText(
  formData: FormData,
  name: string,
) {
  return String(
    formData.get(name) ?? "",
  ).trim();
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (
    error ||
    !profile?.is_admin
  ) {
    redirect("/admin/login");
  }

  return {
    supabase,
    user,
  };
}

function submissionPath(
  submissionId: string,
) {
  return `/admin/submissions/${submissionId}`;
}

function redirectWithError(
  submissionId: string,
  message: string,
): never {
  redirect(
    `${submissionPath(
      submissionId,
    )}?error=${encodeURIComponent(
      message,
    )}`,
  );
}

async function loadPendingSubmission(
  submissionId: string,
) {
  const {
    supabase,
    user,
  } = await requireAdmin();

  const {
    data,
    error,
  } = await supabase
    .from("preset_submissions")
    .select(`
      id,
      user_id,
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
      summary,
      status,
      preset_submission_groups (
        name,
        sort_order,
        preset_submission_items (
          label,
          value,
          note,
          sort_order
        )
      )
    `)
    .eq("id", submissionId)
    .maybeSingle();

  if (
    error ||
    !data
  ) {
    redirect(
      "/admin/submissions?error=Submission%20not%20found",
    );
  }

  const submission =
    data as unknown as SubmissionForApproval;

  if (
    submission.status !== "pending"
  ) {
    redirectWithError(
      submissionId,
      "Only pending submissions can be moderated.",
    );
  }

  return {
    supabase,
    user,
    submission,
  };
}

export async function approveSubmission(
  formData: FormData,
) {
  const submissionId = requiredText(
    formData,
    "submissionId",
  );

  const moderatorNote = requiredText(
    formData,
    "moderatorNote",
  );

  if (!submissionId) {
    redirect(
      "/admin/submissions?error=Missing%20submission%20ID",
    );
  }

  const {
    supabase,
    user,
    submission,
  } = await loadPendingSubmission(
    submissionId,
  );

  const {
    data: preset,
    error: presetError,
  } = await supabase
    .from("presets")
    .insert({
      game_id:
        submission.game_id,
      handheld_id:
        submission.handheld_id,
      name: submission.name,
      preset_type:
        submission.preset_type,
      resolution:
        submission.resolution,
      tdp: submission.tdp,
      fps_average:
        submission.fps_average,
      one_percent_low:
        submission.one_percent_low,
      upscaler:
        submission.upscaler,
      battery_life:
        submission.battery_life,
      community_rating: null,
      summary:
        submission.summary,
      status: "published",
      created_by:
        submission.user_id,
      published_at:
        new Date().toISOString(),
    })
    .select("id")
    .single();

  if (
    presetError ||
    !preset
  ) {
    redirectWithError(
      submissionId,
      presetError?.message ??
        "Could not publish the preset.",
    );
  }

  const createdGroupIds: string[] = [];

  try {
    const groups = [
      ...(submission
        .preset_submission_groups ??
        []),
    ].sort(
      (first, second) =>
        first.sort_order -
        second.sort_order,
    );

    for (const group of groups) {
      const {
        data: createdGroup,
        error: groupError,
      } = await supabase
        .from(
          "preset_setting_groups",
        )
        .insert({
          preset_id: preset.id,
          name: group.name,
          sort_order:
            group.sort_order,
        })
        .select("id")
        .single();

      if (
        groupError ||
        !createdGroup
      ) {
        throw new Error(
          groupError?.message ??
            "Could not publish a settings group.",
        );
      }

      createdGroupIds.push(
        createdGroup.id,
      );

      const items = [
        ...(group
          .preset_submission_items ??
          []),
      ]
        .sort(
          (first, second) =>
            first.sort_order -
            second.sort_order,
        )
        .map((item) => ({
          group_id:
            createdGroup.id,
          label: item.label,
          value: item.value,
          note:
            item.note || null,
          sort_order:
            item.sort_order,
        }));

      if (
        items.length > 0
      ) {
        const {
          error: itemsError,
        } = await supabase
          .from(
            "preset_setting_items",
          )
          .insert(items);

        if (itemsError) {
          throw new Error(
            itemsError.message,
          );
        }
      }
    }

    const {
      error: reviewError,
    } = await supabase
      .from("preset_submissions")
      .update({
        status: "approved",
        moderator_note:
          moderatorNote || null,
        reviewed_at:
          new Date().toISOString(),
        reviewed_by: user.id,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", submission.id)
      .eq("status", "pending");

    if (reviewError) {
      throw new Error(
        reviewError.message,
      );
    }
  } catch (error) {
    if (
      createdGroupIds.length > 0
    ) {
      await supabase
        .from(
          "preset_setting_groups",
        )
        .delete()
        .in(
          "id",
          createdGroupIds,
        );
    }

    await supabase
      .from("presets")
      .delete()
      .eq("id", preset.id);

    redirectWithError(
      submissionId,
      error instanceof Error
        ? error.message
        : "Could not approve the submission.",
    );
  }

  revalidatePath("/");
  revalidatePath("/presets");
  revalidatePath("/games");
  revalidatePath("/handhelds");
  revalidatePath("/admin");
  revalidatePath(
    "/admin/submissions",
  );
  revalidatePath(
    "/my-submissions",
  );

  redirect(
    "/admin/submissions?success=Submission%20approved%20and%20published",
  );
}

async function updateReviewStatus(
  formData: FormData,
  status:
    | "rejected"
    | "changes_requested",
) {
  const submissionId = requiredText(
    formData,
    "submissionId",
  );

  const moderatorNote = requiredText(
    formData,
    "moderatorNote",
  );

  if (!submissionId) {
    redirect(
      "/admin/submissions?error=Missing%20submission%20ID",
    );
  }

  if (!moderatorNote) {
    redirectWithError(
      submissionId,
      "Add a moderator note before returning the submission.",
    );
  }

  const {
    supabase,
    user,
  } = await loadPendingSubmission(
    submissionId,
  );

  const {
    error,
  } = await supabase
    .from("preset_submissions")
    .update({
      status,
      moderator_note:
        moderatorNote,
      reviewed_at:
        new Date().toISOString(),
      reviewed_by: user.id,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("status", "pending");

  if (error) {
    redirectWithError(
      submissionId,
      error.message,
    );
  }

  revalidatePath(
    "/admin/submissions",
  );
  revalidatePath(
    "/my-submissions",
  );

  const message =
    status ===
    "changes_requested"
      ? "Changes requested"
      : "Submission rejected";

  redirect(
    `/admin/submissions?success=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function rejectSubmission(
  formData: FormData,
) {
  return updateReviewStatus(
    formData,
    "rejected",
  );
}

export async function requestSubmissionChanges(
  formData: FormData,
) {
  return updateReviewStatus(
    formData,
    "changes_requested",
  );
}
