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
}

export default async function GamesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      "id, name, slug, genre, developer, release_year, atlas_score, best_handheld, recommended_tdp, notes, cover_image_url",
    )
    .eq("status", "published")
    .order("atlas_score", {
      ascending: false,
      nullsFirst: false,
    });

  const games: PublicGame[] = (data ?? []).map((game) => ({
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
  }));

  return (
    <GamesCatalog
      games={games}
      databaseError={error?.message ?? null}
    />
  );
}