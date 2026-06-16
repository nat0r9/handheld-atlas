"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MODERATION_ROLES } from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

function requiredText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function submissionPath(submissionId: string) {
  return `/admin/submissions/${submissionId}`;
}

function redirectWithError(
  submissionId: string,
  message: string,
): never {
  redirect(
    `${submissionPath(submissionId)}?error=${encodeURIComponent(
      message,
    )}`,
  );
}

async function requireModerator() {
  return requireRole(MODERATION_ROLES, "/");
}

function revalidateSubmissionWorkflow(submissionId: string) {
  revalidatePath("/");
  revalidatePath("/presets");
  revalidatePath("/games");
  revalidatePath("/handhelds");
  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath(submissionPath(submissionId));
  revalidatePath("/my-submissions");
  revalidatePath(`/my-submissions/${submissionId}`);
}

export async function approveSubmission(formData: FormData) {
  const submissionId = requiredText(formData, "submissionId");
  const moderatorNote = requiredText(formData, "moderatorNote");

  if (!submissionId) {
    redirect(
      "/admin/submissions?error=Missing%20submission%20ID",
    );
  }

  const { supabase } = await requireModerator();
  const { data: presetId, error } = await supabase.rpc(
    "publish_preset_submission",
    {
      p_submission_id: submissionId,
      p_moderator_note: moderatorNote || null,
    },
  );

  if (error || typeof presetId !== "string") {
    redirectWithError(
      submissionId,
      error?.message ?? "Could not publish the preset.",
    );
  }

  revalidateSubmissionWorkflow(submissionId);
  revalidatePath(`/presets/${presetId}`);

  redirect(
    `${submissionPath(
      submissionId,
    )}?success=Submission%20approved%20and%20published`,
  );
}

async function updateReviewStatus(
  formData: FormData,
  decision: "rejected" | "changes_requested",
) {
  const submissionId = requiredText(formData, "submissionId");
  const moderatorNote = requiredText(formData, "moderatorNote");

  if (!submissionId) {
    redirect(
      "/admin/submissions?error=Missing%20submission%20ID",
    );
  }

  if (moderatorNote.length < 5) {
    redirectWithError(
      submissionId,
      "Add a clear moderator note before returning the submission.",
    );
  }

  const { supabase } = await requireModerator();
  const { error } = await supabase.rpc(
    "review_preset_submission",
    {
      p_submission_id: submissionId,
      p_decision: decision,
      p_moderator_note: moderatorNote,
    },
  );

  if (error) {
    redirectWithError(submissionId, error.message);
  }

  revalidateSubmissionWorkflow(submissionId);

  const message =
    decision === "changes_requested"
      ? "Changes requested"
      : "Submission rejected";

  redirect(
    `${submissionPath(submissionId)}?success=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function rejectSubmission(formData: FormData) {
  return updateReviewStatus(formData, "rejected");
}

export async function requestSubmissionChanges(
  formData: FormData,
) {
  return updateReviewStatus(formData, "changes_requested");
}
