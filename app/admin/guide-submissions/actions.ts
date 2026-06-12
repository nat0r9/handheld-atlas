"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MODERATION_ROLES,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

interface GuideSubmission {
  id: string;
  user_id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  reading_time: number | null;
  difficulty: string | null;
  cover_image_url: string | null;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  status: string;
}

function requiredText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function requireModerator() {
  return requireRole(
    MODERATION_ROLES,
    "/",
  );
}

function detailPath(submissionId: string) {
  return `/admin/guide-submissions/${submissionId}`;
}

function redirectWithError(
  submissionId: string,
  message: string,
): never {
  redirect(
    `${detailPath(submissionId)}?error=${encodeURIComponent(message)}`,
  );
}

async function loadPendingGuideSubmission(
  submissionId: string,
) {
  const { supabase, user } = await requireModerator();

  const { data, error } = await supabase
    .from("guide_submissions")
    .select(`
      id,
      user_id,
      title,
      category,
      excerpt,
      content,
      reading_time,
      difficulty,
      cover_image_url,
      related_game_slug,
      related_handheld_slug,
      status
    `)
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !data) {
    redirect(
      "/admin/guide-submissions?error=Guide%20submission%20not%20found",
    );
  }

  const submission = data as GuideSubmission;

  if (submission.status !== "pending") {
    redirectWithError(
      submissionId,
      "Only pending guide submissions can be moderated.",
    );
  }

  return { supabase, user, submission };
}

export async function approveGuideSubmission(
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
      "/admin/guide-submissions?error=Missing%20guide%20submission%20ID",
    );
  }

  const {
    supabase,
    submission,
  } =
    await loadPendingGuideSubmission(
      submissionId,
    );

  const baseSlug =
    slugify(submission.title) ||
    "community-guide";

  const {
    data,
    error: approvalError,
  } = await supabase.rpc(
    "approve_guide_submission",
    {
      p_submission_id:
        submission.id,
      p_base_slug: baseSlug,
      p_moderator_note:
        moderatorNote || null,
    },
  );

  const publishedGuide =
    Array.isArray(data)
      ? (data[0] as {
          guide_id: string;
          guide_slug: string;
        } | undefined)
      : undefined;

  if (
    approvalError ||
    !publishedGuide
  ) {
    redirectWithError(
      submissionId,
      approvalError?.message ??
        "Could not approve and publish the guide.",
    );
  }

  revalidatePath("/");
  revalidatePath("/guides");
  revalidatePath(`/guides/${publishedGuide.guide_slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/guide-submissions");
  revalidatePath("/my-guide-submissions");

  redirect(
    "/admin/guide-submissions?success=Guide%20approved%20and%20published",
  );
}

async function updateGuideReviewStatus(
  formData: FormData,
  status: "rejected" | "changes_requested",
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
      "/admin/guide-submissions?error=Missing%20guide%20submission%20ID",
    );
  }

  if (!moderatorNote) {
    redirectWithError(
      submissionId,
      "Add a moderator note before returning the guide.",
    );
  }

  const { supabase, user } =
    await loadPendingGuideSubmission(submissionId);

  const { error } = await supabase
    .from("guide_submissions")
    .update({
      status,
      moderator_note: moderatorNote,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("status", "pending");

  if (error) {
    redirectWithError(
      submissionId,
      error.message,
    );
  }

  revalidatePath("/admin/guide-submissions");
  revalidatePath("/my-guide-submissions");

  const message =
    status === "changes_requested"
      ? "Guide changes requested"
      : "Guide submission rejected";

  redirect(
    `/admin/guide-submissions?success=${encodeURIComponent(message)}`,
  );
}

export async function rejectGuideSubmission(
  formData: FormData,
) {
  return updateGuideReviewStatus(
    formData,
    "rejected",
  );
}

export async function requestGuideChanges(
  formData: FormData,
) {
  return updateGuideReviewStatus(
    formData,
    "changes_requested",
  );
}
