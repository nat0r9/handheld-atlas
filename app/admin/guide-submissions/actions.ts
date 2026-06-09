"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

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

  return { supabase, user };
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
  const { supabase, user } = await requireAdmin();

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

async function createUniqueGuideSlug(
  title: string,
) {
  const { supabase } = await requireAdmin();

  const baseSlug = slugify(title) || "community-guide";
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("guides")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
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

  const { supabase, user, submission } =
    await loadPendingGuideSubmission(submissionId);

  let slug: string;

  try {
    slug = await createUniqueGuideSlug(submission.title);
  } catch (error) {
    redirectWithError(
      submissionId,
      error instanceof Error
        ? error.message
        : "Could not create a unique guide slug.",
    );
  }

  const { data: guide, error: guideError } =
    await supabase
      .from("guides")
      .insert({
        title: submission.title,
        slug,
        category: submission.category,
        excerpt: submission.excerpt,
        content: submission.content,
        reading_time: submission.reading_time,
        difficulty: submission.difficulty,
        cover_image_url: submission.cover_image_url,
        related_game_slug: submission.related_game_slug,
        related_handheld_slug:
          submission.related_handheld_slug,
        status: "published",
        created_by: submission.user_id,
        published_at: new Date().toISOString(),
      })
      .select("id, slug")
      .single();

  if (guideError || !guide) {
    redirectWithError(
      submissionId,
      guideError?.message ?? "Could not publish the guide.",
    );
  }

  const { error: reviewError } = await supabase
    .from("guide_submissions")
    .update({
      status: "approved",
      moderator_note: moderatorNote || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submission.id)
    .eq("status", "pending");

  if (reviewError) {
    await supabase
      .from("guides")
      .delete()
      .eq("id", guide.id);

    redirectWithError(
      submissionId,
      reviewError.message,
    );
  }

  revalidatePath("/");
  revalidatePath("/guides");
  revalidatePath(`/guides/${guide.slug}`);
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
