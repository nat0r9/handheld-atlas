import NewsCatalog, {
  type PublicNewsItem,
} from "../../components/NewsCatalog";
import { createClient } from "../../lib/supabase/server";

interface DatabaseNewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string | null;
  reading_time: number | null;
  is_featured: boolean;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  published_at: string | null;
}

export default async function NewsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      slug,
      category,
      excerpt,
      cover_image_url,
      author_name,
      reading_time,
      is_featured,
      related_game_slug,
      related_handheld_slug,
      published_at
    `)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  const databaseNews =
    (data ?? []) as DatabaseNewsItem[];

  const relatedGameSlugs = Array.from(
    new Set(
      databaseNews
        .map((item) => item.related_game_slug)
        .filter(
          (slug): slug is string =>
            typeof slug === "string" &&
            slug.length > 0,
        ),
    ),
  );

  const relatedHandheldSlugs = Array.from(
    new Set(
      databaseNews
        .map(
          (item) =>
            item.related_handheld_slug,
        )
        .filter(
          (slug): slug is string =>
            typeof slug === "string" &&
            slug.length > 0,
        ),
    ),
  );

  const [gamesResult, handheldsResult] =
    await Promise.all([
      relatedGameSlugs.length > 0
        ? supabase
            .from("games")
            .select("name, slug")
            .in("slug", relatedGameSlugs)
        : Promise.resolve({
            data: [],
            error: null,
          }),

      relatedHandheldSlugs.length > 0
        ? supabase
            .from("handhelds")
            .select("name, slug")
            .in(
              "slug",
              relatedHandheldSlugs,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);

  const gameNames = new Map(
    (gamesResult.data ?? []).map((game) => [
      game.slug,
      game.name,
    ]),
  );

  const handheldNames = new Map(
    (handheldsResult.data ?? []).map(
      (handheld) => [
        handheld.slug,
        handheld.name,
      ],
    ),
  );

  const newsItems: PublicNewsItem[] =
    databaseNews.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      excerpt: item.excerpt,
      coverImageUrl:
        item.cover_image_url,
      authorName:
        item.author_name ??
        "HandheldAtlas Team",
      readingTime: item.reading_time,
      isFeatured: item.is_featured,
      publishedAt: item.published_at,

      relatedGame: item.related_game_slug
        ? {
            slug: item.related_game_slug,
            name:
              gameNames.get(
                item.related_game_slug,
              ) ?? item.related_game_slug,
          }
        : null,

      relatedHandheld:
        item.related_handheld_slug
          ? {
              slug:
                item.related_handheld_slug,
              name:
                handheldNames.get(
                  item.related_handheld_slug,
                ) ??
                item.related_handheld_slug,
            }
          : null,
    }));

  const databaseError =
    error?.message ??
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    null;

  return (
    <NewsCatalog
      newsItems={newsItems}
      databaseError={databaseError}
    />
  );
}