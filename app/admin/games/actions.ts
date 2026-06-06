"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

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

export async function createGame(formData: FormData) {
  const { supabase, user } = await requireAdmin();

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

  const releaseYear = optionalNumber(formData, "releaseYear");
  const atlasScore = optionalNumber(formData, "atlasScore");

  const { error } = await supabase.from("games").insert({
    name,
    slug,
    genre,
    developer: optionalText(formData, "developer"),
    release_year: releaseYear,
    atlas_score: atlasScore,
    best_handheld: optionalText(formData, "bestHandheld"),
    recommended_tdp: optionalText(formData, "recommendedTdp"),
    notes: optionalText(formData, "notes"),
    cover_image_url: optionalText(formData, "coverImageUrl"),
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
  const { supabase } = await requireAdmin();

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

  const releaseYear = optionalNumber(formData, "releaseYear");
  const atlasScore = optionalNumber(formData, "atlasScore");

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
      developer: optionalText(formData, "developer"),
      release_year: releaseYear,
      atlas_score: atlasScore,
      best_handheld: optionalText(formData, "bestHandheld"),
      recommended_tdp: optionalText(formData, "recommendedTdp"),
      notes: optionalText(formData, "notes"),
      cover_image_url: optionalText(formData, "coverImageUrl"),
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
  const { supabase } = await requireAdmin();

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