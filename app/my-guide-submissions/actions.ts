"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const validDifficulties = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

type GuideDifficulty =
  (typeof validDifficulties)[number];

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

function optionalInteger(
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

  if (
    !Number.isInteger(number) ||
    number < 1
  ) {
    return null;
  }

  return number;
}

function getDifficulty(
  formData: FormData,
): GuideDifficulty | null {
  const value = requiredText(
    formData,
    "difficulty",
  );

  if (!value) {
    return null;
  }

  return validDifficulties.includes(
    value as GuideDifficulty,
  )
    ? (value as GuideDifficulty)
    : null;
}

function redirectWithError(
  path: string,
  message: string,
): never {
  redirect(
    `${path}?error=${encodeURIComponent(
      message,
    )}`,
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

  return {
    supabase,
    user,
  };
}

export async function createGuideSubmission(
  formData: FormData,
) {
  const {
    supabase,
    user,
  } = await requireUser();

  const title = requiredText(
    formData,
    "title",
  );

  const category = requiredText(
    formData,
    "category",
  );

  const excerpt = requiredText(
    formData,
    "excerpt",
  );

  const content = requiredText(
    formData,
    "content",
  );

  const intent = requiredText(
    formData,
    "intent",
  );

  if (
    !title ||
    !category ||
    !excerpt ||
    !content
  ) {
    redirectWithError(
      "/my-guide-submissions/new",
      "Title, category, excerpt and guide content are required.",
    );
  }

  if (title.length > 140) {
    redirectWithError(
      "/my-guide-submissions/new",
      "Title can contain at most 140 characters.",
    );
  }

  if (excerpt.length > 320) {
    redirectWithError(
      "/my-guide-submissions/new",
      "Excerpt can contain at most 320 characters.",
    );
  }

  const {
    data: submission,
    error,
  } = await supabase
    .from("guide_submissions")
    .insert({
      user_id: user.id,
      title,
      category,
      excerpt,
      content,
      reading_time:
        optionalInteger(
          formData,
          "readingTime",
        ),
      difficulty:
        getDifficulty(formData),
      cover_image_url:
        optionalText(
          formData,
          "coverImageUrl",
        ),
      related_game_slug:
        optionalText(
          formData,
          "relatedGameSlug",
        ),
      related_handheld_slug:
        optionalText(
          formData,
          "relatedHandheldSlug",
        ),
      status: "draft",
      updated_at:
        new Date().toISOString(),
    })
    .select("id")
    .single();

  if (
    error ||
    !submission
  ) {
    redirectWithError(
      "/my-guide-submissions/new",
      error?.message ??
        "Could not create guide submission.",
    );
  }

  if (intent === "submit") {
    const {
      error: submitError,
    } = await supabase
      .from("guide_submissions")
      .update({
        status: "pending",
        submitted_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", submission.id);

    if (submitError) {
      await supabase
        .from("guide_submissions")
        .delete()
        .eq("id", submission.id);

      redirectWithError(
        "/my-guide-submissions/new",
        submitError.message,
      );
    }
  }

  revalidatePath(
    "/my-guide-submissions",
  );

  const successMessage =
    intent === "submit"
      ? "Guide submitted for review."
      : "Guide draft saved successfully.";

  redirect(
    `/my-guide-submissions?success=${encodeURIComponent(
      successMessage,
    )}`,
  );
}


async function getEditableGuideSubmission(
  submissionId: string,
) {
  const {
    supabase,
    user,
  } = await requireUser();

  const {
    data: submission,
    error,
  } = await supabase
    .from("guide_submissions")
    .select("id, status")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    error ||
    !submission
  ) {
    redirect(
      "/my-guide-submissions?error=Guide%20submission%20not%20found",
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
      "/my-guide-submissions?error=This%20guide%20submission%20is%20locked%20for%20review",
    );
  }

  return {
    supabase,
    submission,
  };
}

export async function updateGuideSubmission(
  formData: FormData,
) {
  const submissionId = requiredText(
    formData,
    "submissionId",
  );

  if (!submissionId) {
    redirect(
      "/my-guide-submissions?error=Missing%20guide%20submission%20ID",
    );
  }

  const editPath =
    `/my-guide-submissions/${submissionId}/edit`;

  const {
    supabase,
  } = await getEditableGuideSubmission(
    submissionId,
  );

  const title = requiredText(
    formData,
    "title",
  );

  const category = requiredText(
    formData,
    "category",
  );

  const excerpt = requiredText(
    formData,
    "excerpt",
  );

  const content = requiredText(
    formData,
    "content",
  );

  const intent = requiredText(
    formData,
    "intent",
  );

  if (
    !title ||
    !category ||
    !excerpt ||
    !content
  ) {
    redirectWithError(
      editPath,
      "Title, category, excerpt and guide content are required.",
    );
  }

  if (title.length > 140) {
    redirectWithError(
      editPath,
      "Title can contain at most 140 characters.",
    );
  }

  if (excerpt.length > 320) {
    redirectWithError(
      editPath,
      "Excerpt can contain at most 320 characters.",
    );
  }

  const {
    error,
  } = await supabase
    .from("guide_submissions")
    .update({
      title,
      category,
      excerpt,
      content,
      reading_time:
        optionalInteger(
          formData,
          "readingTime",
        ),
      difficulty:
        getDifficulty(formData),
      cover_image_url:
        optionalText(
          formData,
          "coverImageUrl",
        ),
      related_game_slug:
        optionalText(
          formData,
          "relatedGameSlug",
        ),
      related_handheld_slug:
        optionalText(
          formData,
          "relatedHandheldSlug",
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

  if (error) {
    redirectWithError(
      editPath,
      error.message,
    );
  }

  revalidatePath(
    "/my-guide-submissions",
  );

  revalidatePath(editPath);

  const successMessage =
    intent === "submit"
      ? "Guide submitted for review."
      : "Guide draft updated successfully.";

  redirect(
    `/my-guide-submissions?success=${encodeURIComponent(
      successMessage,
    )}`,
  );
}

export async function deleteGuideSubmission(
  formData: FormData,
) {
  const submissionId = requiredText(
    formData,
    "submissionId",
  );

  if (!submissionId) {
    redirect(
      "/my-guide-submissions?error=Missing%20guide%20submission%20ID",
    );
  }

  const {
    supabase,
  } = await getEditableGuideSubmission(
    submissionId,
  );

  const {
    error,
  } = await supabase
    .from("guide_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    redirect(
      `/my-guide-submissions?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(
    "/my-guide-submissions",
  );

  redirect(
    "/my-guide-submissions?success=Guide%20submission%20deleted",
  );
}
