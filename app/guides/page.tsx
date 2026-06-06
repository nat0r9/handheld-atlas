import GuidesCatalog, {
  type PublicGuide,
} from "../../components/GuidesCatalog";
import { createClient } from "../../lib/supabase/server";

interface DatabaseGuide {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  reading_time: number | null;
  difficulty: string | null;
  cover_image_url: string | null;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  published_at: string | null;
}

export default async function GuidesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guides")
    .select(`
      id,
      title,
      slug,
      category,
      excerpt,
      reading_time,
      difficulty,
      cover_image_url,
      related_game_slug,
      related_handheld_slug,
      published_at
    `)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  const databaseGuides =
    (data ?? []) as DatabaseGuide[];

  const relatedGameSlugs = Array.from(
    new Set(
      databaseGuides
        .map((guide) => guide.related_game_slug)
        .filter(
          (slug): slug is string =>
            typeof slug === "string" &&
            slug.length > 0,
        ),
    ),
  );

  const relatedHandheldSlugs = Array.from(
    new Set(
      databaseGuides
        .map((guide) => guide.related_handheld_slug)
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

  const guides: PublicGuide[] =
    databaseGuides.map((guide) => ({
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      category: guide.category,
      excerpt: guide.excerpt,
      readingTime: guide.reading_time,
      difficulty: guide.difficulty,
      coverImageUrl: guide.cover_image_url,
      publishedAt: guide.published_at,

      relatedGame: guide.related_game_slug
        ? {
            slug: guide.related_game_slug,
            name:
              gameNames.get(
                guide.related_game_slug,
              ) ?? guide.related_game_slug,
          }
        : null,

      relatedHandheld:
        guide.related_handheld_slug
          ? {
              slug:
                guide.related_handheld_slug,
              name:
                handheldNames.get(
                  guide.related_handheld_slug,
                ) ??
                guide.related_handheld_slug,
            }
          : null,
    }));

  const databaseError =
    error?.message ??
    gamesResult.error?.message ??
    handheldsResult.error?.message ??
    null;

  return (
    <GuidesCatalog
      guides={guides}
      databaseError={databaseError}
    />
  );
}