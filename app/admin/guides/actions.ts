"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

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

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : null;
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStatus(
  formData: FormData,
): ContentStatus {
  const value = requiredText(
    formData,
    "status",
  );

  if (
    value === "draft" ||
    value === "published" ||
    value === "archived"
  ) {
    return value;
  }

  return "draft";
}

function revalidateGuidePages(
  guideId?: string,
  slug?: string | null,
  oldSlug?: string | null,
) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/guides");
  revalidatePath("/guides");

  if (guideId) {
    revalidatePath(
      `/admin/guides/${guideId}/edit`,
    );
  }

  if (slug) {
    revalidatePath(`/guides/${slug}`);
  }

  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/guides/${oldSlug}`);
  }
}

export async function createGuide(
  formData: FormData,
) {
  const { supabase, user } =
    await requireAdmin();

  const title = requiredText(
    formData,
    "title",
  );

  const manualSlug = requiredText(
    formData,
    "slug",
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

  const status = getStatus(formData);

  if (
    !title ||
    !category ||
    !excerpt ||
    !content
  ) {
    redirect(
      "/admin/guides?error=Title%2C%20category%2C%20excerpt%20and%20content%20are%20required",
    );
  }

  const slug = createSlug(
    manualSlug || title,
  );

  if (!slug) {
    redirect(
      "/admin/guides?error=Could%20not%20create%20a%20valid%20slug",
    );
  }

  const readingTime = optionalNumber(
    formData,
    "readingTime",
  );

  if (
    readingTime !== null &&
    readingTime < 1
  ) {
    redirect(
      "/admin/guides?error=Reading%20time%20must%20be%20at%20least%201%20minute",
    );
  }

  const { data: guide, error } =
    await supabase
      .from("guides")
      .insert({
        title,
        slug,
        category,
        excerpt,
        content,
        reading_time: readingTime,
        difficulty: optionalText(
          formData,
          "difficulty",
        ),
        cover_image_url: optionalText(
          formData,
          "coverImageUrl",
        ),
        related_game_slug: optionalText(
          formData,
          "relatedGameSlug",
        ),
        related_handheld_slug: optionalText(
          formData,
          "relatedHandheldSlug",
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

  if (error || !guide) {
    redirect(
      `/admin/guides?error=${encodeURIComponent(
        error?.message ??
          "Could not create guide",
      )}`,
    );
  }

  revalidateGuidePages(
    guide.id,
    slug,
  );

  redirect(
    "/admin/guides?success=Guide%20created",
  );
}

export async function updateGuide(
  formData: FormData,
) {
  const { supabase } = await requireAdmin();

  const guideId = requiredText(
    formData,
    "guideId",
  );

  const title = requiredText(
    formData,
    "title",
  );

  const manualSlug = requiredText(
    formData,
    "slug",
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

  const status = getStatus(formData);

  const editPath =
    `/admin/guides/${guideId}/edit`;

  if (!guideId) {
    redirect(
      "/admin/guides?error=Missing%20guide%20ID",
    );
  }

  if (
    !title ||
    !category ||
    !excerpt ||
    !content
  ) {
    redirect(
      `${editPath}?error=Title%2C%20category%2C%20excerpt%20and%20content%20are%20required`,
    );
  }

  const slug = createSlug(
    manualSlug || title,
  );

  if (!slug) {
    redirect(
      `${editPath}?error=Could%20not%20create%20a%20valid%20slug`,
    );
  }

  const readingTime = optionalNumber(
    formData,
    "readingTime",
  );

  if (
    readingTime !== null &&
    readingTime < 1
  ) {
    redirect(
      `${editPath}?error=Reading%20time%20must%20be%20at%20least%201%20minute`,
    );
  }

  const {
    data: currentGuide,
    error: currentGuideError,
  } = await supabase
    .from("guides")
    .select("slug, published_at")
    .eq("id", guideId)
    .single();

  if (
    currentGuideError ||
    !currentGuide
  ) {
    redirect(
      "/admin/guides?error=Guide%20not%20found",
    );
  }

  const publishedAt =
    status === "published"
      ? currentGuide.published_at ??
        new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("guides")
    .update({
      title,
      slug,
      category,
      excerpt,
      content,
      reading_time: readingTime,
      difficulty: optionalText(
        formData,
        "difficulty",
      ),
      cover_image_url: optionalText(
        formData,
        "coverImageUrl",
      ),
      related_game_slug: optionalText(
        formData,
        "relatedGameSlug",
      ),
      related_handheld_slug: optionalText(
        formData,
        "relatedHandheldSlug",
      ),
      status,
      published_at: publishedAt,
    })
    .eq("id", guideId);

  if (error) {
    redirect(
      `${editPath}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidateGuidePages(
    guideId,
    slug,
    currentGuide.slug,
  );

  redirect(
    `${editPath}?success=Guide%20updated`,
  );
}

export async function deleteGuide(
  formData: FormData,
) {
  const { supabase } = await requireAdmin();

  const guideId = requiredText(
    formData,
    "guideId",
  );

  if (!guideId) {
    redirect(
      "/admin/guides?error=Missing%20guide%20ID",
    );
  }

  const {
    data: guide,
    error: lookupError,
  } = await supabase
    .from("guides")
    .select("slug")
    .eq("id", guideId)
    .single();

  if (lookupError || !guide) {
    redirect(
      "/admin/guides?error=Guide%20not%20found",
    );
  }

  const { error } = await supabase
    .from("guides")
    .delete()
    .eq("id", guideId);

  if (error) {
    redirect(
      `/admin/guides?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidateGuidePages(
    guideId,
    guide.slug,
  );

  redirect(
    "/admin/guides?success=Guide%20deleted",
  );
}