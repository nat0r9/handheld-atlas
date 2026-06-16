export const COMMUNITY_MIN_VOTES_PER_GAME = 3;
export const COMMUNITY_MIN_QUALIFIED_GAMES = 3;
export const COMMUNITY_TOP_GAME_LIMIT = 5;

export interface GameRatingSummary {
  gameId: string;
  averageRating: number | null;
  ratingCount: number;
}

export interface MonthlyTopGame {
  gameId: string;
  name: string;
  slug: string;
  genre: string;
  atlasScore: number | null;
  coverImageUrl: string | null;
  averageRating: number;
  ratingCount: number;
  weightedScore: number;
}

interface RawGameRatingSummary {
  game_id?: unknown;
  average_rating?: unknown;
  rating_count?: unknown;
}

interface RawMonthlyTopGame {
  game_id?: unknown;
  name?: unknown;
  slug?: unknown;
  genre?: unknown;
  atlas_score?: unknown;
  cover_image_url?: unknown;
  average_rating?: unknown;
  rating_count?: unknown;
  weighted_score?: unknown;
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseGameRatingSummary(
  raw: RawGameRatingSummary | null | undefined,
): GameRatingSummary {
  const averageRating = toFiniteNumber(raw?.average_rating);
  const ratingCount = toFiniteNumber(raw?.rating_count) ?? 0;

  return {
    gameId: toStringValue(raw?.game_id),
    averageRating,
    ratingCount: Math.max(0, Math.trunc(ratingCount)),
  };
}

export function parseGameRatingSummaries(
  rawRows: unknown,
): GameRatingSummary[] {
  if (!Array.isArray(rawRows)) {
    return [];
  }

  return rawRows.map((row) =>
    parseGameRatingSummary(row as RawGameRatingSummary),
  );
}

export function parseMonthlyTopGames(rawRows: unknown): MonthlyTopGame[] {
  if (!Array.isArray(rawRows)) {
    return [];
  }

  return rawRows
    .map((row) => {
      const raw = row as RawMonthlyTopGame;
      const averageRating = toFiniteNumber(raw.average_rating);
      const ratingCount = toFiniteNumber(raw.rating_count);
      const weightedScore = toFiniteNumber(raw.weighted_score);

      if (
        !toStringValue(raw.game_id) ||
        !toStringValue(raw.name) ||
        !toStringValue(raw.slug) ||
        averageRating === null ||
        ratingCount === null ||
        weightedScore === null
      ) {
        return null;
      }

      return {
        gameId: toStringValue(raw.game_id),
        name: toStringValue(raw.name),
        slug: toStringValue(raw.slug),
        genre: toStringValue(raw.genre) || "Game",
        atlasScore: toFiniteNumber(raw.atlas_score),
        coverImageUrl:
          toStringValue(raw.cover_image_url) || null,
        averageRating,
        ratingCount: Math.max(0, Math.trunc(ratingCount)),
        weightedScore,
      } satisfies MonthlyTopGame;
    })
    .filter((row): row is MonthlyTopGame => row !== null);
}

export function getRatingConfidenceLabel(ratingCount: number) {
  if (ratingCount >= 25) {
    return "Established";
  }

  if (ratingCount >= 10) {
    return "Strong signal";
  }

  if (ratingCount >= COMMUNITY_MIN_VOTES_PER_GAME) {
    return "Qualified";
  }

  return "Warming up";
}
