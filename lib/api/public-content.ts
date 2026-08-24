"server-only";

import { createClient } from "@supabase/supabase-js";

export const PUBLIC_CONTENT_RESOURCES = [
  "news",
  "guides",
  "games",
  "presets",
] as const;

export type PublicContentResource =
  (typeof PUBLIC_CONTENT_RESOURCES)[number];

interface ResourceConfig {
  table: PublicContentResource;
  identifier: "slug" | "id";
  listSelect: string;
  detailSelect: string;
}

const resourceConfig: Record<
  PublicContentResource,
  ResourceConfig
> = {
  news: {
    table: "news",
    identifier: "slug",
    listSelect:
      "id, title, slug, category, excerpt, cover_image_url, author_name, reading_time, is_featured, related_game_slug, related_handheld_slug, published_at, updated_at",
    detailSelect:
      "id, title, slug, category, excerpt, content, cover_image_url, author_name, reading_time, is_featured, related_game_slug, related_handheld_slug, published_at, updated_at",
  },
  guides: {
    table: "guides",
    identifier: "slug",
    listSelect:
      "id, title, slug, category, excerpt, reading_time, difficulty, cover_image_url, related_game_slug, related_handheld_slug, published_at, updated_at",
    detailSelect:
      "id, title, slug, category, excerpt, content, reading_time, difficulty, cover_image_url, related_game_slug, related_handheld_slug, published_at, updated_at",
  },
  games: {
    table: "games",
    identifier: "slug",
    listSelect:
      "id, name, slug, genre, developer, publisher, release_date, release_year, platforms, steam_app_id, metacritic_critic_score, metacritic_user_score, atlas_score, best_handheld, recommended_tdp, notes, cover_image_url, published_at, updated_at",
    detailSelect:
      "id, name, slug, genre, developer, publisher, release_date, release_year, platforms, steam_app_id, metacritic_critic_score, metacritic_user_score, metacritic_critic_reviews, metacritic_user_ratings, metacritic_url, atlas_score, best_handheld, recommended_tdp, notes, cover_image_url, cover_source_name, cover_source_url, published_at, updated_at",
  },
  presets: {
    table: "presets",
    identifier: "id",
    listSelect: `
      id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      one_percent_low,
      upscaler,
      battery_life,
      summary,
      atlas_verified,
      evidence_tier,
      source_name,
      source_url,
      source_checked_at,
      game_version,
      driver_version,
      os_version,
      evidence_artifact_type,
      evidence_artifact_url,
      published_at,
      updated_at,
      games (name, slug),
      handhelds (name, slug, manufacturer)
    `,
    detailSelect: `
      id,
      name,
      preset_type,
      resolution,
      tdp,
      fps_average,
      one_percent_low,
      upscaler,
      battery_life,
      summary,
      atlas_verified,
      evidence_tier,
      source_name,
      source_url,
      source_checked_at,
      game_version,
      driver_version,
      os_version,
      evidence_artifact_type,
      evidence_artifact_url,
      published_at,
      updated_at,
      games (name, slug),
      handhelds (name, slug, manufacturer),
      preset_setting_groups (
        id,
        name,
        sort_order,
        preset_setting_items (
          id,
          label,
          value,
          note,
          sort_order
        )
      )
    `,
  },
};

const publicHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Cache-Control":
    "public, s-maxage=60, stale-while-revalidate=300",
  "X-Content-Type-Options": "nosniff",
} as const;

export class PublicApiInputError extends Error {}

export function isPublicContentResource(
  value: string,
): value is PublicContentResource {
  return PUBLIC_CONTENT_RESOURCES.includes(
    value as PublicContentResource,
  );
}

export function getPublicContentConfig(
  resource: PublicContentResource,
) {
  return resourceConfig[resource];
}

export function createPublicContentClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Public content database configuration is missing.",
    );
  }

  return createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "X-Client-Info":
            "handheldatlas-public-api/1",
        },
      },
    },
  );
}

export function parsePublicApiPagination(
  request: Request,
) {
  const url = new URL(request.url);
  const pageValue =
    url.searchParams.get("page") ?? "1";
  const limitValue =
    url.searchParams.get("limit") ?? "20";

  if (
    !/^\d+$/.test(pageValue) ||
    !/^\d+$/.test(limitValue)
  ) {
    throw new PublicApiInputError(
      "page and limit must be positive integers.",
    );
  }

  const page = Number(pageValue);
  const limit = Number(limitValue);

  if (page < 1 || page > 1000) {
    throw new PublicApiInputError(
      "page must be between 1 and 1000.",
    );
  }

  if (limit < 1 || limit > 100) {
    throw new PublicApiInputError(
      "limit must be between 1 and 100.",
    );
  }

  return {
    page,
    limit,
    from: (page - 1) * limit,
    to: page * limit - 1,
  };
}

export function publicApiJson(
  body: unknown,
  init?: ResponseInit,
) {
  return Response.json(body, {
    ...init,
    headers: {
      ...publicHeaders,
      ...init?.headers,
    },
  });
}

export function publicApiError(
  status: number,
  code: string,
  message: string,
) {
  return publicApiJson(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export function publicApiOptions() {
  return new Response(null, {
    status: 204,
    headers: publicHeaders,
  });
}
