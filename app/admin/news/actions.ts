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

function getBoolean(
  formData: FormData,
  name: string,
) {
  const value = formData.get(name);

  return (
    value === "on" ||
    value === "true" ||
    value === "1"
  );
}

function revalidateNewsPages(
  newsId?: string,
  slug?: string | null,
  oldSlug?: string | null,
) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/news");
  revalidatePath("/news");

  if (newsId) {
    revalidatePath(
      `/admin/news/${newsId}/edit`,
    );
  }

  if (slug) {
    revalidatePath(`/news/${slug}`);
  }

  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/news/${oldSlug}`);
  }
}

export async function createNews(
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

  const isFeatured = getBoolean(
    formData,
    "isFeatured",
  );

  if (
    !title ||
    !category ||
    !excerpt ||
    !content
  ) {
    redirect(
      "/admin/news?error=Title%2C%20category%2C%20excerpt%20and%20content%20are%20required",
    );
  }

  const slug = createSlug(
    manualSlug || title,
  );

  if (!slug) {
    redirect(
      "/admin/news?error=Could%20not%20create%20a%20valid%20slug",
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
      "/admin/news?error=Reading%20time%20must%20be%20at%20least%201%20minute",
    );
  }

  const { data: newsItem, error } =
    await supabase
      .from("news")
      .insert({
        title,
        slug,
        category,
        excerpt,
        content,

        cover_image_url: optionalText(
          formData,
          "coverImageUrl",
        ),

        author_name: optionalText(
          formData,
          "authorName",
        ),

        reading_time: readingTime,

        is_featured: isFeatured,

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

  if (error || !newsItem) {
    redirect(
      `/admin/news?error=${encodeURIComponent(
        error?.message ??
          "Could not create news article",
      )}`,
    );
  }

  revalidateNewsPages(
    newsItem.id,
    slug,
  );

  redirect(
    "/admin/news?success=News%20article%20created",
  );
}

export async function updateNews(
  formData: FormData,
) {
  const { supabase } =
    await requireAdmin();

  const newsId = requiredText(
    formData,
    "newsId",
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

  const isFeatured = getBoolean(
    formData,
    "isFeatured",
  );

  const editPath =
    `/admin/news/${newsId}/edit`;

  if (!newsId) {
    redirect(
      "/admin/news?error=Missing%20news%20ID",
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
    data: currentNews,
    error: currentNewsError,
  } = await supabase
    .from("news")
    .select(
      "slug, published_at",
    )
    .eq("id", newsId)
    .single();

  if (
    currentNewsError ||
    !currentNews
  ) {
    redirect(
      "/admin/news?error=News%20article%20not%20found",
    );
  }

  const publishedAt =
    status === "published"
      ? currentNews.published_at ??
        new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("news")
    .update({
      title,
      slug,
      category,
      excerpt,
      content,

      cover_image_url: optionalText(
        formData,
        "coverImageUrl",
      ),

      author_name: optionalText(
        formData,
        "authorName",
      ),

      reading_time: readingTime,

      is_featured: isFeatured,

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
      updated_at: new Date().toISOString(),
    })
    .eq("id", newsId);

  if (error) {
    redirect(
      `${editPath}?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidateNewsPages(
    newsId,
    slug,
    currentNews.slug,
  );

  redirect(
    `${editPath}?success=News%20article%20updated`,
  );
}

export async function deleteNews(
  formData: FormData,
) {
  const { supabase } =
    await requireAdmin();

  const newsId = requiredText(
    formData,
    "newsId",
  );

  if (!newsId) {
    redirect(
      "/admin/news?error=Missing%20news%20ID",
    );
  }

  const {
    data: newsItem,
    error: lookupError,
  } = await supabase
    .from("news")
    .select("slug")
    .eq("id", newsId)
    .single();

  if (lookupError || !newsItem) {
    redirect(
      "/admin/news?error=News%20article%20not%20found",
    );
  }

  const { error } = await supabase
    .from("news")
    .delete()
    .eq("id", newsId);

  if (error) {
    redirect(
      `/admin/news?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidateNewsPages(
    newsId,
    newsItem.slug,
  );

  redirect(
    "/admin/news?success=News%20article%20deleted",
  );
}