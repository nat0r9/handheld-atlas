import type { MetadataRoute } from "next";
import { siteConfig } from "../lib/site";
import { createClient } from "../lib/supabase/server";

export const revalidate = 3600;

interface SitemapRecord {
  slug: string;
  updated_at: string | null;
  published_at?: string | null;
}

interface PresetSitemapRecord {
  id: string;
  updated_at: string | null;
  published_at: string | null;
}

function getLastModified(
  updatedAt: string | null,
  publishedAt?: string | null,
) {
  const value = updatedAt ?? publishedAt ?? null;

  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function createDynamicEntry(
  pathname: string,
  record: SitemapRecord,
  changeFrequency: "daily" | "weekly" | "monthly",
  priority: number,
): MetadataRoute.Sitemap[number] {
  const lastModified = getLastModified(
    record.updated_at,
    record.published_at,
  );

  return {
    url: `${siteConfig.url}${pathname}/${record.slug}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  };
}

function reportSitemapError(label: string, error: { message: string } | null) {
  if (error) {
    console.error(`Could not load ${label} for sitemap:`, error.message);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [
    gamesResult,
    handheldsResult,
    guidesResult,
    newsResult,
    presetsResult,
    settingsImpactResult,
    contributorsResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("handhelds")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("guides")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("news")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("presets")
      .select("id, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("setting_impact_entries")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("public_slug, updated_at")
      .eq("public_profile", true)
      .not("public_slug", "is", null),
  ]);

  reportSitemapError("games", gamesResult.error);
  reportSitemapError("handhelds", handheldsResult.error);
  reportSitemapError("guides", guidesResult.error);
  reportSitemapError("news", newsResult.error);
  reportSitemapError("presets", presetsResult.error);
  reportSitemapError("settings impact", settingsImpactResult.error);
  reportSitemapError("contributors", contributorsResult.error);

  const games = (gamesResult.data ?? []) as SitemapRecord[];
  const handhelds = (handheldsResult.data ?? []) as SitemapRecord[];
  const guides = (guidesResult.data ?? []) as SitemapRecord[];
  const newsItems = (newsResult.data ?? []) as SitemapRecord[];
  const presets = (presetsResult.data ?? []) as PresetSitemapRecord[];
  const settingsImpact = (settingsImpactResult.data ?? []) as SitemapRecord[];
  const contributors = (contributorsResult.data ?? []).map((row) => ({
    slug: row.public_slug as string,
    updated_at: row.updated_at as string | null,
  })) as SitemapRecord[];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/games`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/handhelds`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/presets`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/benchmarks`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/compare`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/news`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/settings-impact`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/methodology`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const gamePages = games.map((record) =>
    createDynamicEntry("/games", record, "weekly", 0.8),
  );

  const handheldPages = handhelds.map((record) =>
    createDynamicEntry("/handhelds", record, "weekly", 0.8),
  );

  const guidePages = guides.map((record) =>
    createDynamicEntry("/guides", record, "monthly", 0.7),
  );

  const newsPages = newsItems.map((record) =>
    createDynamicEntry("/news", record, "weekly", 0.8),
  );

  const presetPages: MetadataRoute.Sitemap = presets.map((record) => {
    const lastModified = getLastModified(
      record.updated_at,
      record.published_at,
    );

    return {
      url: `${siteConfig.url}/presets/${record.id}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  const settingsImpactPages = settingsImpact.map((record) =>
    createDynamicEntry("/settings-impact", record, "monthly", 0.7),
  );

  const contributorPages = contributors.map((record) =>
    createDynamicEntry("/contributors", record, "weekly", 0.6),
  );

  return [
    ...staticPages,
    ...gamePages,
    ...handheldPages,
    ...guidePages,
    ...newsPages,
    ...presetPages,
    ...settingsImpactPages,
    ...contributorPages,
  ];
}
