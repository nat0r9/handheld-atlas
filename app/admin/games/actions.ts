"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CONTENT_EDITOR_ROLES,
} from "../../../lib/auth/roles";
import { requireRole } from "../../../lib/auth/require-role";

async function requireContentEditor() {
  return requireRole(
    CONTENT_EDITOR_ROLES,
    "/",
  );
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

function optionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();

  return value.length > 0 ? value : null;
}

function optionalNumber(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function optionalInteger(formData: FormData, name: string) {
  const value = optionalNumber(formData, name);

  return value === null ? null : Math.trunc(value);
}

function optionalList(formData: FormData, name: string) {
  return String(formData.get(name) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function gameMetadata(formData: FormData) {
  const releaseDate = optionalText(formData, "releaseDate");

  return {
    developer: optionalText(formData, "developer"),
    publisher: optionalText(formData, "publisher"),
    release_date: releaseDate,
    release_year: releaseDate
      ? Number(releaseDate.slice(0, 4))
      : optionalInteger(formData, "releaseYear"),
    platforms: optionalList(formData, "platforms"),
    steam_app_id: optionalInteger(formData, "steamAppId"),
    metacritic_critic_score: optionalInteger(
      formData,
      "metacriticCriticScore",
    ),
    metacritic_user_score: optionalNumber(
      formData,
      "metacriticUserScore",
    ),
    metacritic_critic_reviews: optionalInteger(
      formData,
      "metacriticCriticReviews",
    ),
    metacritic_user_ratings: optionalInteger(
      formData,
      "metacriticUserRatings",
    ),
    metacritic_url: optionalText(formData, "metacriticUrl"),
    cover_source_name: optionalText(formData, "coverSourceName"),
    cover_source_url: optionalText(formData, "coverSourceUrl"),
  };
}

function missingPublishingFields(
  metadata: ReturnType<typeof gameMetadata>,
  coverImageUrl: string | null,
) {
  return [
    [metadata.developer, "developer"],
    [metadata.publisher, "publisher"],
    [metadata.release_date, "release date"],
    [metadata.platforms.length > 0, "platforms"],
    [metadata.steam_app_id, "Steam App ID"],
    [metadata.metacritic_critic_score !== null, "Metacritic critic score"],
    [metadata.metacritic_user_score !== null, "Metacritic user score"],
    [metadata.metacritic_url, "Metacritic URL"],
    [coverImageUrl, "cover image"],
    [metadata.cover_source_name, "cover source"],
    [metadata.cover_source_url, "cover source URL"],
  ]
    .filter(([complete]) => !complete)
    .map(([, label]) => label as string);
}

export async function createGame(formData: FormData) {
  const { supabase, user } = await requireContentEditor();

  const name = String(formData.get("name") ?? "").trim();
  const manualSlug = String(formData.get("slug") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");

  if (!name || !genre) {
    redirect(
      "/admin/games?error=Game%20name%20and%20genre%20are%20required",
    );
  }

  const slug = createSlug(manualSlug || name);

  if (!slug) {
    redirect(
      "/admin/games?error=Could%20not%20create%20a%20valid%20slug",
    );
  }

  const atlasScore = optionalNumber(formData, "atlasScore");
  const metadata = gameMetadata(formData);
  const coverImageUrl = optionalText(formData, "coverImageUrl");

  if (status === "published") {
    const missing = missingPublishingFields(metadata, coverImageUrl);
    missing.push("at least one published preset (create the game as a draft first)");
    redirect(
      `/admin/games?error=${encodeURIComponent(
        `Cannot publish: ${missing.join(", ")}`,
      )}`,
    );
  }

  const { error } = await supabase.from("games").insert({
    name,
    slug,
    genre,
    ...metadata,
    atlas_score: atlasScore,
    best_handheld: optionalText(formData, "bestHandheld"),
    recommended_tdp: optionalText(formData, "recommendedTdp"),
    notes: optionalText(formData, "notes"),
    cover_image_url: coverImageUrl,
    status,
    created_by: user.id,
    published_at:
      status === "published" ? new Date().toISOString() : null,
  });

  if (error) {
    redirect(
      `/admin/games?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath("/games");

  redirect("/admin/games?success=Game%20created");
}

export async function updateGame(formData: FormData) {
  const { supabase } = await requireContentEditor();

  const gameId = String(formData.get("gameId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const manualSlug = String(formData.get("slug") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");

  if (!gameId) {
    redirect("/admin/games?error=Missing%20game%20ID");
  }

  if (!name || !genre) {
    redirect(
      `/admin/games/${gameId}/edit?error=Game%20name%20and%20genre%20are%20required`,
    );
  }

  const slug = createSlug(manualSlug || name);

  if (!slug) {
    redirect(
      `/admin/games/${gameId}/edit?error=Could%20not%20create%20a%20valid%20slug`,
    );
  }

  const atlasScore = optionalNumber(formData, "atlasScore");
  const metadata = gameMetadata(formData);
  const coverImageUrl = optionalText(formData, "coverImageUrl");

  const { data: currentGame, error: currentGameError } =
    await supabase
      .from("games")
      .select("status, published_at")
      .eq("id", gameId)
      .single();

  if (currentGameError || !currentGame) {
    redirect(
      `/admin/games/${gameId}/edit?error=Game%20not%20found`,
    );
  }

  if (status === "published") {
    const { count: presetCount } = await supabase
      .from("presets")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId)
      .eq("status", "published");
    const missing = missingPublishingFields(metadata, coverImageUrl);

    if ((presetCount ?? 0) === 0) {
      missing.push("at least one published preset");
    }

    if (missing.length > 0) {
      redirect(
        `/admin/games/${gameId}/edit?error=${encodeURIComponent(
          `Cannot publish: ${missing.join(", ")}`,
        )}`,
      );
    }
  }

  const publishedAt =
    status === "published"
      ? currentGame.published_at ?? new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("games")
    .update({
      name,
      slug,
      genre,
      ...metadata,
      atlas_score: atlasScore,
      best_handheld: optionalText(formData, "bestHandheld"),
      recommended_tdp: optionalText(formData, "recommendedTdp"),
      notes: optionalText(formData, "notes"),
      cover_image_url: coverImageUrl,
      status,
      published_at: publishedAt,
    })
    .eq("id", gameId);

  if (error) {
    redirect(
      `/admin/games/${gameId}/edit?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath(`/admin/games/${gameId}/edit`);
  revalidatePath("/games");
  revalidatePath(`/games/${slug}`);

  redirect(
    `/admin/games/${gameId}/edit?success=Game%20updated`,
  );
}

export async function deleteGame(formData: FormData) {
  const { supabase } = await requireContentEditor();

  const gameId = String(formData.get("gameId") ?? "");

  if (!gameId) {
    redirect("/admin/games?error=Missing%20game%20ID");
  }

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", gameId);

  if (error) {
    redirect(
      `/admin/games?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/games");
  revalidatePath("/games");

  redirect("/admin/games?success=Game%20deleted");
}
