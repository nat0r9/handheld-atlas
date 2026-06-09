"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export interface GameRatingResult {
  averageRating: number | null;
  ratingCount: number;
  userRating: number | null;
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

  const {
    data: game,
    error: gameError,
  } = await supabase
    .from("games")
    .select("id, slug, status")
    .eq("id", gameId)
    .maybeSingle();

  if (
    gameError ||
    !game ||
    game.status !== "published"
  ) {
    throw new Error(
      gameError?.message ??
        "This game is not available for rating.",
    );
  }

  if (rating === null) {
    const { error } = await supabase
      .from("game_ratings")
      .delete()
      .eq("game_id", gameId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new Error(
        "Rating must be a whole number from 1 to 5.",
      );
    }

    const { error } = await supabase
      .from("game_ratings")
      .upsert(
        {
          game_id: gameId,
          user_id: user.id,
          rating,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "game_id,user_id",
        },
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  const {
    data: ratings,
    error: ratingsError,
  } = await supabase
    .from("game_ratings")
    .select("rating, user_id")
    .eq("game_id", gameId);

  if (ratingsError) {
    throw new Error(
      ratingsError.message,
    );
  }

  const ratingValues =
    (ratings ?? []).map(
      (row) => Number(row.rating),
    );

  const averageRating =
    ratingValues.length > 0
      ? Number(
          (
            ratingValues.reduce(
              (total, value) =>
                total + value,
              0,
            ) / ratingValues.length
          ).toFixed(2),
        )
      : null;

  const userRating =
    (ratings ?? []).find(
      (row) =>
        row.user_id === user.id,
    )?.rating ?? null;

  revalidatePath("/games");
  revalidatePath(
    `/games/${game.slug}`,
  );
  revalidatePath("/");

  return {
    averageRating,
    ratingCount:
      ratingValues.length,
    userRating:
      userRating !== null
        ? Number(userRating)
        : null,
  };
}
