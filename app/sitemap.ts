import type { MetadataRoute } from "next";
import { createClient } from "../lib/supabase/server";

const baseUrl = "https://handheldatlas.com";

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
    new Date().toISOString();

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? new Date()
    : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [
    gamesResult,
    handheldsResult,
    guidesResult,
    newsResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("handhelds")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("guides")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("news")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", {
        ascending: false,
      }),
  ]);

  const games =
    (gamesResult.data ?? []) as SitemapRecord[];

  const handhelds =
    (handheldsResult.data ?? []) as SitemapRecord[];

  const guides =
    (guidesResult.data ?? []) as SitemapRecord[];

  const newsItems =
    (newsResult.data ?? []) as SitemapRecord[];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/handhelds`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/presets`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/benchmarks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const gamePages: MetadataRoute.Sitemap =
    games.map((game) => ({
      url: `${baseUrl}/games/${game.slug}`,
      lastModified: getLastModified(
        game.updated_at,
        game.published_at,
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const handheldPages: MetadataRoute.Sitemap =
    handhelds.map((handheld) => ({
      url: `${baseUrl}/handhelds/${handheld.slug}`,
      lastModified: getLastModified(
        handheld.updated_at,
        handheld.published_at,
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const guidePages: MetadataRoute.Sitemap =
    guides.map((guide) => ({
      url: `${baseUrl}/guides/${guide.slug}`,
      lastModified: getLastModified(
        guide.updated_at,
        guide.published_at,
      ),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const newsPages: MetadataRoute.Sitemap =
    newsItems.map((newsItem) => ({
      url: `${baseUrl}/news/${newsItem.slug}`,
      lastModified: getLastModified(
        newsItem.updated_at,
        newsItem.published_at,
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...gamePages,
    ...handheldPages,
    ...guidePages,
    ...newsPages,
  ];
}