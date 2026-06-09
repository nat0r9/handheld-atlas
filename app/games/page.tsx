import GamesCatalog from "../../components/GamesCatalog";
import { createClient } from "../../lib/supabase/server";

export interface PublicGame {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  releaseYear: number | null;
  atlasScore: number | null;
  bestHandheld: string | null;
  recommendedTdp: string | null;
  notes: string | null;
  coverImageUrl: string | null;
  communityRating: number | null;
  ratingCount: number;
  userRating: number | null;
}

interface DatabaseGame {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  release_year: number | null;
  atlas_score: number | null;
  best_handheld: string | null;
  recommended_tdp: string | null;
  notes: string | null;
  cover_image_url: string | null;
  game_ratings: Array<{
    rating: number;
    user_id: string;
  }>;
}

export default async function GamesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("games")
    .select(`
      id,
      name,
      slug,
      genre,
      developer,
      release_year,
      atlas_score,
      best_handheld,
      recommended_tdp,
      notes,
      cover_image_url,
      game_ratings (
        rating,
        user_id
      )
    `)
    .eq("status", "published")
    .order("atlas_score", {
      ascending: false,
      nullsFirst: false,
    });

  const games: PublicGame[] =
    ((data ?? []) as unknown as DatabaseGame[]).map(
      (game) => {
        const ratingValues =
          (game.game_ratings ?? []).map(
            (rating) =>
              Number(rating.rating),
          );

        const communityRating =
          ratingValues.length > 0
            ? ratingValues.reduce(
                (total, value) =>
                  total + value,
                0,
              ) / ratingValues.length
            : null;

        const userRating =
          user !== null
            ? (game.game_ratings ??
                []).find(
                  (rating) =>
                    rating.user_id ===
                    user.id,
                )?.rating ?? null
            : null;

        return {
          id: game.id,
          name: game.name,
          slug: game.slug,
          genre: game.genre,
          developer:
            game.developer,
          releaseYear:
            game.release_year,
          atlasScore:
            game.atlas_score,
          bestHandheld:
            game.best_handheld,
          recommendedTdp:
            game.recommended_tdp,
          notes: game.notes,
          coverImageUrl:
            game.cover_image_url,
          communityRating:
            communityRating !== null
              ? Number(
                  communityRating.toFixed(
                    2,
                  ),
                )
              : null,
          ratingCount:
            ratingValues.length,
          userRating:
            userRating !== null
              ? Number(userRating)
              : null,
        };
      },
    );

  return (
    <GamesCatalog
      games={games}
      databaseError={
        error?.message ?? null
      }
    />
  );
}
