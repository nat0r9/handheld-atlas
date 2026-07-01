import GamesCatalog from "../../components/GamesCatalog";
import {
  parseGameRatingSummaries,
  type GameRatingSummary,
} from "../../lib/game-ratings";
import { createClient } from "../../lib/supabase/server";

export interface PublicGameTopPreset {
  id: string;
  name: string;
  type: string;
  handheldName: string | null;
  averageFps: number | null;
  atlasVerified: boolean;
  confirmationCount: number;
}

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
  topPreset: PublicGameTopPreset | null;
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

interface DatabasePresetForGameCard {
  id: string;
  game_id: string;
  name: string;
  preset_type: string;
  fps_average: number | null;
  atlas_verified: boolean;
  community_rating: number | null;
  published_at: string | null;
  handhelds: {
    name: string;
  } | null;
  preset_votes: Array<{
    user_id: string;
  }>;
  preset_confirmations: Array<{
    user_id: string;
  }>;
}

function getPresetRank(preset: DatabasePresetForGameCard) {
  const publishedAt = preset.published_at
    ? new Date(preset.published_at).getTime()
    : 0;

  return (
    (preset.atlas_verified ? 1_000_000 : 0) +
    (preset.preset_confirmations?.length ?? 0) * 10_000 +
    (preset.community_rating ?? 0) * 1_000 +
    (preset.preset_votes?.length ?? 0) * 100 +
    (preset.fps_average ?? 0) +
    publishedAt / 100_000_000_000
  );
}

export default async function GamesPage() {
  const supabase = await createClient();

  const [gamesResult, ratingSummaryResult, presetsResult] = await Promise.all([
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
    supabase
      .from("presets")
      .select(`
        id,
        game_id,
        name,
        preset_type,
        fps_average,
        atlas_verified,
        community_rating,
        published_at,
        handhelds (
          name
        ),
        preset_votes (
          user_id
        ),
        preset_confirmations (
          user_id
        )
      `)
      .eq("status", "published"),
  ]);

  const ratingSummaries = parseGameRatingSummaries(
    ratingSummaryResult.data,
  );
  const ratingSummaryMap = new Map<string, GameRatingSummary>(
    ratingSummaries.map((summary) => [summary.gameId, summary]),
  );

  const topPresetMap = new Map<string, PublicGameTopPreset>();
  const topPresetRankMap = new Map<string, number>();
  const databasePresets =
    (presetsResult.data ?? []) as unknown as DatabasePresetForGameCard[];

  for (const preset of databasePresets) {
    if (!preset.game_id) {
      continue;
    }

    const rank = getPresetRank(preset);
    const currentRank =
      topPresetRankMap.get(preset.game_id) ?? Number.NEGATIVE_INFINITY;

    if (rank <= currentRank) {
      continue;
    }

    topPresetRankMap.set(preset.game_id, rank);
    topPresetMap.set(preset.game_id, {
      id: preset.id,
      name: preset.name,
      type: preset.preset_type,
      handheldName: preset.handhelds?.name ?? null,
      averageFps: preset.fps_average,
      atlasVerified: preset.atlas_verified ?? false,
      confirmationCount: preset.preset_confirmations?.length ?? 0,
    });
  }

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
      topPreset: topPresetMap.get(game.id) ?? null,
    };
  });

  const databaseError =
    gamesResult.error?.message ??
    ratingSummaryResult.error?.message ??
    presetsResult.error?.message ??
    null;

  return (
    <GamesCatalog games={games} databaseError={databaseError} />
  );
}
