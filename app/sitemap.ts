import type { MetadataRoute } from "next";
import { createClient } from "../lib/supabase/server";

const baseUrl =
  "https://www.handheldatlas.com";

export const revalidate = 3600;

interface SitemapRecord {
  slug: string;
  updated_at: string | null;
  published_at?: string | null;
}

function getLastModified(
  updatedAt: string | null,
  publishedAt?: string | null,
) {
  const value =
    updatedAt ??
    publishedAt ??
    null;

  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? undefined
    : date;
}

function createDynamicEntry(
  pathname: string,
  record: SitemapRecord,
  changeFrequency:
    | "daily"
    | "weekly"
    | "monthly",
  priority: number,
): MetadataRoute.Sitemap[number] {
  const lastModified =
    getLastModified(
      record.updated_at,
      record.published_at,
    );

  return {
    url:
      `${baseUrl}${pathname}/${record.slug}`,
    ...(lastModified
      ? { lastModified }
      : {}),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase =
    await createClient();

  const [
    gamesResult,
    handheldsResult,
    guidesResult,
    newsResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select(
        "slug, updated_at, published_at",
      )
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("handhelds")
      .select(
        "slug, updated_at, published_at",
      )
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("guides")
      .select(
        "slug, updated_at, published_at",
      )
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("news")
      .select(
        "slug, updated_at, published_at",
      )
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),
  ]);

  const games =
    (gamesResult.data ??
      []) as SitemapRecord[];

  const handhelds =
    (handheldsResult.data ??
      []) as SitemapRecord[];

  const guides =
    (guidesResult.data ??
      []) as SitemapRecord[];

  const newsItems =
    (newsResult.data ??
      []) as SitemapRecord[];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/games`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/handhelds`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/presets`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/benchmarks`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const gamePages =
    games.map((record) =>
      createDynamicEntry(
        "/games",
        record,
        "weekly",
        0.8,
      ),
    );

  const handheldPages =
    handhelds.map((record) =>
      createDynamicEntry(
        "/handhelds",
        record,
        "weekly",
        0.8,
      ),
    );

  const guidePages =
    guides.map((record) =>
      createDynamicEntry(
        "/guides",
        record,
        "monthly",
        0.7,
      ),
    );

  const newsPages =
    newsItems.map((record) =>
      createDynamicEntry(
        "/news",
        record,
        "weekly",
        0.8,
      ),
    );

  return [
    ...staticPages,
    ...gamePages,
    ...handheldPages,
    ...guidePages,
    ...newsPages,
  ];
}
