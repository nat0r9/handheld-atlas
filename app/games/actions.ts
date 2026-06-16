"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export interface GameRatingResult {
  averageRating: number | null;
  ratingCount: number;
  userRating: number | null;
  monthlyRatingCount: number;
}

interface RatingRpcRow {
  average_rating: number | string | null;
  rating_count: number | string | null;
  user_rating: number | string | null;
  monthly_rating_count: number | string | null;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setGameRating(
  gameId: string,
  rating: number | null,
): Promise<GameRatingResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (
    rating !== null &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }

  const { data, error } = await supabase.rpc("set_game_rating", {
    p_game_id: gameId,
    p_rating: rating,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | RatingRpcRow
    | null;

  if (!row) {
    throw new Error("The rating was saved, but its summary could not be loaded.");
  }

  const averageRating = toNumber(row.average_rating);
  const ratingCount = toNumber(row.rating_count) ?? 0;
  const userRating = toNumber(row.user_rating);
  const monthlyRatingCount = toNumber(row.monthly_rating_count) ?? 0;

  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath(`/games/${gameId}`);

  const { data: game } = await supabase
    .from("games")
    .select("slug")
    .eq("id", gameId)
    .maybeSingle();

  if (game?.slug) {
    revalidatePath(`/games/${game.slug}`);
  }

  return {
    averageRating,
    ratingCount: Math.max(0, Math.trunc(ratingCount)),
    userRating:
      userRating === null ? null : Math.trunc(userRating),
    monthlyRatingCount: Math.max(0, Math.trunc(monthlyRatingCount)),
  };
}
