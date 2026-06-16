import GamesCatalog from "../../components/GamesCatalog";
import {
  parseGameRatingSummaries,
  type GameRatingSummary,
} from "../../lib/game-ratings";
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
}

export default async function GamesPage() {
  const supabase = await createClient();

  const [gamesResult, ratingSummaryResult] = await Promise.all([
    supabase
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
        cover_image_url
      `)
      .eq("status", "published")
      .order("atlas_score", {
        ascending: false,
        nullsFirst: false,
      }),
    supabase.rpc("get_game_rating_summaries"),
  ]);

  const ratingSummaries = parseGameRatingSummaries(
    ratingSummaryResult.data,
  );
  const ratingSummaryMap = new Map<string, GameRatingSummary>(
    ratingSummaries.map((summary) => [summary.gameId, summary]),
  );

  const games: PublicGame[] = (
    (gamesResult.data ?? []) as DatabaseGame[]
  ).map((game) => {
    const ratingSummary = ratingSummaryMap.get(game.id);

    return {
      id: game.id,
      name: game.name,
      slug: game.slug,
      genre: game.genre,
      developer: game.developer,
      releaseYear: game.release_year,
      atlasScore: game.atlas_score,
      bestHandheld: game.best_handheld,
      recommendedTdp: game.recommended_tdp,
      notes: game.notes,
      coverImageUrl: game.cover_image_url,
      communityRating: ratingSummary?.averageRating ?? null,
      ratingCount: ratingSummary?.ratingCount ?? 0,
    };
  });

  const databaseError =
    gamesResult.error?.message ??
    ratingSummaryResult.error?.message ??
    null;

  return (
    <GamesCatalog games={games} databaseError={databaseError} />
  );
}
