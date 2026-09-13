import { getBenchmarkIndex } from "../../lib/catalog/benchmark-index";
import { assertRead, readAll } from "../../lib/catalog/read";
import {
  genres,
  PAGE_SIZE,
  pageNumber,
  param,
  type SearchParams,
} from "../../lib/catalog/query";
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
  benchmarkCount: number;
  presetCount: number;
}

interface DatabaseGame {
  id: string;
  name: string;
  slug: string;
  genre: string;
  developer: string | null;
  release_year: number | null;
  metacritic_critic_score: number | null;
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
    slug: string;
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

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const values = Object.fromEntries(
    ["q", "genre", "handheld", "coverage", "sort"].map((k) => [
      k,
      param(params, k),
    ]),
  );
  const db = await createClient();
  const [index, benchmarks, presetsResult, ratings] = await Promise.all([
    readAll<DatabaseGame>(
      (from, to) =>
        db
          .from("games")
          .select("id,name,slug,genre,release_year,metacritic_critic_score")
          .eq("status", "published")
          .order("id")
          .range(from, to),
      "game index",
    ),
    getBenchmarkIndex(),
    db
      .from("presets")
      .select(
        "id,game_id,name,preset_type,fps_average,atlas_verified,community_rating,published_at,handhelds(name,slug),preset_votes(user_id),preset_confirmations(user_id)",
      )
      .eq("status", "published"),
    db.rpc("get_game_rating_summaries", {}, { get: true }),
  ]);
  assertRead(presetsResult.error, "preset coverage");
  assertRead(ratings.error, "game ratings");
  const presets = (presetsResult.data ??
    []) as unknown as DatabasePresetForGameCard[];
  const ratingMap = new Map(
    parseGameRatingSummaries(ratings.data).map((r) => [r.gameId, r]),
  );
  const benchmarkCounts = new Map<string, number>();
  const presetCounts = new Map<string, number>();
  for (const b of benchmarks)
    if (!values.handheld || b.handhelds?.slug === values.handheld)
      benchmarkCounts.set(b.game_id, (benchmarkCounts.get(b.game_id) ?? 0) + 1);
  for (const p of presets)
    if (!values.handheld || p.handhelds?.slug === values.handheld)
      presetCounts.set(p.game_id, (presetCounts.get(p.game_id) ?? 0) + 1);
  const matching = index
    .filter((g) => {
      const bc = benchmarkCounts.get(g.id) ?? 0,
        pc = presetCounts.get(g.id) ?? 0;
      return (
        (!values.q ||
          values.q
            .toLowerCase()
            .split(/\s+/)
            .every((word) => g.name.toLowerCase().includes(word))) &&
        (!values.genre || genres(g.genre).includes(values.genre)) &&
        (!values.handheld || bc + pc > 0) &&
        (!values.coverage ||
          (values.coverage === "benchmarks"
            ? bc > 0
            : values.coverage === "presets"
              ? pc > 0
              : bc + pc > 0))
      );
    })
    .sort((a, b) => {
      if (values.sort === "name") return a.name.localeCompare(b.name);
      if (values.sort === "newest")
        return (
          (b.release_year ?? 0) - (a.release_year ?? 0) ||
          a.name.localeCompare(b.name)
        );
      if (values.sort === "community")
        return (
          (ratingMap.get(b.id)?.averageRating ?? -1) -
            (ratingMap.get(a.id)?.averageRating ?? -1) ||
          a.name.localeCompare(b.name)
        );
      return (
        (b.metacritic_critic_score ?? -1) - (a.metacritic_critic_score ?? -1) ||
        a.name.localeCompare(b.name)
      );
    });
  const page = pageNumber(param(params, "page"), matching.length),
    ids = matching
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((g) => g.id);
  const result = ids.length
    ? await db
        .from("games")
        .select(
          "id,name,slug,genre,developer,release_year,metacritic_critic_score,best_handheld,recommended_tdp,notes,cover_image_url",
        )
        .eq("status", "published")
        .in("id", ids)
    : { data: [], error: null };
  assertRead(result.error, "games");
  const rows = new Map(
    ((result.data ?? []) as DatabaseGame[]).map((g) => [g.id, g]),
  );
  const games: PublicGame[] = ids.flatMap((id) => {
    const g = rows.get(id);
    if (!g) return [];
    const p = presets
      .filter(
        (p) =>
          p.game_id === id &&
          (!values.handheld || p.handhelds?.slug === values.handheld),
      )
      .sort((a, b) => getPresetRank(b) - getPresetRank(a))[0];
    return [
      {
        id: g.id,
        name: g.name,
        slug: g.slug,
        genre: g.genre,
        developer: g.developer,
        releaseYear: g.release_year,
        atlasScore: g.metacritic_critic_score,
        bestHandheld: g.best_handheld,
        recommendedTdp: g.recommended_tdp,
        notes: g.notes,
        coverImageUrl: g.cover_image_url,
        communityRating: ratingMap.get(id)?.averageRating ?? null,
        ratingCount: ratingMap.get(id)?.ratingCount ?? 0,
        benchmarkCount: benchmarkCounts.get(id) ?? 0,
        presetCount: presetCounts.get(id) ?? 0,
        topPreset: p
          ? {
              id: p.id,
              name: p.name,
              type: p.preset_type,
              handheldName: p.handhelds?.name ?? null,
              averageFps: p.fps_average,
              atlasVerified: p.atlas_verified,
              confirmationCount: p.preset_confirmations?.length ?? 0,
            }
          : null,
      },
    ];
  });
  const handheldOptions = Array.from(
    new Map(
      [...benchmarks, ...presets].flatMap((b) =>
        b.handhelds ? [[b.handhelds.slug, b.handhelds.name] as const] : [],
      ),
    ).entries(),
  )
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ value, label }));
  return (
    <GamesCatalog
      games={games}
      page={page}
      total={matching.length}
      values={values}
      genreOptions={Array.from(
        new Set(index.flatMap((g) => genres(g.genre))),
      ).sort()}
      handheldOptions={handheldOptions}
    />
  );
}
