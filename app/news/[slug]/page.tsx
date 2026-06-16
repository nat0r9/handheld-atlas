import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "../../../components/JsonLd";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { absoluteUrl, siteConfig } from "../../../lib/site";

interface NewsDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface DatabaseNewsItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  reading_time: number | null;
  is_featured: boolean;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  published_at: string | null;
  updated_at: string | null;
}

interface RelatedContent {
  name: string;
  slug: string;
}

async function getNewsItem(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      slug,
      category,
      excerpt,
      content,
      cover_image_url,
      author_name,
      reading_time,
      is_featured,
      related_game_slug,
      related_handheld_slug,
      published_at,
      updated_at
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(
      "Could not load news article:",
      error.message,
    );

    return null;
  }

  return data as DatabaseNewsItem | null;
}

async function getRelatedContent(
  newsItem: DatabaseNewsItem,
) {
  const supabase = await createClient();

  const [
    relatedGameResult,
    relatedHandheldResult,
  ] = await Promise.all([
    newsItem.related_game_slug
      ? supabase
          .from("games")
          .select("name, slug")
          .eq(
            "slug",
            newsItem.related_game_slug,
          )
          .eq("status", "published")
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    newsItem.related_handheld_slug
      ? supabase
          .from("handhelds")
          .select("name, slug")
          .eq(
            "slug",
            newsItem.related_handheld_slug,
          )
          .eq("status", "published")
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ]);

  return {
    relatedGame:
      relatedGameResult.data as RelatedContent | null,

    relatedHandheld:
      relatedHandheldResult.data as RelatedContent | null,
  };
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const newsItem = await getNewsItem(slug);

  if (!newsItem) {
    return {
      title: "News Article Not Found",
      description:
        "The requested news article does not exist in HandheldAtlas.",
    };
  }

  return {
    title: newsItem.title,
    description: newsItem.excerpt,
    alternates: {
      canonical: `/news/${newsItem.slug}`,
    },

    openGraph: {
      url: `/news/${newsItem.slug}`,
      title: `${newsItem.title} | HandheldAtlas`,
      description: newsItem.excerpt,
      type: "article",
      publishedTime:
        newsItem.published_at ?? undefined,
      modifiedTime:
        newsItem.updated_at ?? undefined,
      authors: [
        newsItem.author_name ??
          "HandheldAtlas Team",
      ],
      images: newsItem.cover_image_url
        ? [
            {
              url: newsItem.cover_image_url,
              alt: newsItem.title,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: `${newsItem.title} | HandheldAtlas`,
      description: newsItem.excerpt,
      images: newsItem.cover_image_url
        ? [newsItem.cover_image_url]
        : [],
    },
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function renderArticleContent(content: string) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const firstLine = lines[0] ?? "";

    const isHeading =
      lines.length === 1 &&
      firstLine.length <= 90 &&
      !/[.!?]$/.test(firstLine);

    if (isHeading) {
      return (
        <h2
          key={`${firstLine}-${index}`}
          className="mt-10 border-l-2 border-red-500 pl-4 text-2xl font-black leading-tight text-white first:mt-0 sm:mt-12 sm:text-3xl"
        >
          {firstLine}
        </h2>
      );
    }

    const isBulletList = lines.every((line) =>
      /^[-*•]\s+/.test(line),
    );

    if (isBulletList) {
      return (
        <ul
          key={`bullet-list-${index}`}
          className="my-6 space-y-3 sm:my-7"
        >
          {lines.map((line, lineIndex) => (
            <li
              key={`${line}-${lineIndex}`}
              className="flex gap-3 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8"
            >
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />

              <span>
                {line.replace(
                  /^[-*•]\s+/,
                  "",
                )}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    const isNumberedList = lines.every((line) =>
      /^\d+[.)]\s+/.test(line),
    );

    if (isNumberedList) {
      return (
        <ol
          key={`numbered-list-${index}`}
          className="my-7 space-y-4"
        >
          {lines.map((line, lineIndex) => (
            <li
              key={`${line}-${lineIndex}`}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 text-sm leading-7 text-slate-300 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:text-base sm:leading-8"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/[0.07] text-sm font-black text-red-400">
                {lineIndex + 1}
              </span>

              <span>
                {line.replace(
                  /^\d+[.)]\s+/,
                  "",
                )}
              </span>
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p
        key={`paragraph-${index}`}
        className="my-6 whitespace-pre-line break-words text-sm leading-7 text-slate-300 sm:my-7 sm:text-base sm:leading-8"
      >
        {block}
      </p>
    );
  });
}

export default async function NewsDetailPage({
  params,
}: NewsDetailPageProps) {
  const { slug } = await params;
  const newsItem = await getNewsItem(slug);

  if (!newsItem) {
    notFound();
  }

  const {
    relatedGame,
    relatedHandheld,
  } = await getRelatedContent(newsItem);

  const authorName =
    newsItem.author_name ??
    "HandheldAtlas Team";
  const newsUrl = absoluteUrl(`/news/${newsItem.slug}`);
  const newsJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${newsUrl}#article`,
    headline: newsItem.title,
    description: newsItem.excerpt,
    url: newsUrl,
    mainEntityOfPage: newsUrl,
    image: newsItem.cover_image_url ?? undefined,
    datePublished: newsItem.published_at ?? undefined,
    dateModified: newsItem.updated_at ?? newsItem.published_at ?? undefined,
    articleSection: newsItem.category,
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@id": `${siteConfig.url}/#organization`,
    },
    about: [
      relatedGame
        ? {
            "@type": "VideoGame",
            name: relatedGame.name,
            url: absoluteUrl(`/games/${relatedGame.slug}`),
          }
        : null,
      relatedHandheld
        ? {
            "@type": "Product",
            name: relatedHandheld.name,
            url: absoluteUrl(`/handhelds/${relatedHandheld.slug}`),
          }
        : null,
    ].filter(Boolean),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "News",
        item: absoluteUrl("/news"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: newsItem.title,
        item: newsUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[newsJsonLd, breadcrumbJsonLd]} />
      <main className="atlas-page min-w-0 overflow-x-hidden pb-14 text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        {newsItem.cover_image_url ? (
          <Image
            src={newsItem.cover_image_url}
            alt={newsItem.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-50"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(24,215,255,0.18),transparent_28%),radial-gradient(circle_at_20%_70%,rgba(239,35,60,0.18),transparent_30%),linear-gradient(135deg,#05070d,#090d16_55%,#13090f)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/95 to-[#05070d]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-black/25" />

        <div className="atlas-shell relative flex min-h-[32rem] items-end py-9 sm:min-h-[40rem] sm:py-12">
          <div className="min-w-0 max-w-5xl">
            <Link
              href="/news"
              className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 transition hover:text-white"
            >
              ← Back to news
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
              {newsItem.is_featured && (
                <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] text-yellow-300 backdrop-blur">
                  Featured story
                </span>
              )}

              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] text-red-400 backdrop-blur">
                {newsItem.category}
              </span>

              {newsItem.reading_time !== null && (
                <span className="atlas-chip">
                  {newsItem.reading_time} min read
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-5xl break-words text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:mt-6 sm:text-6xl lg:text-7xl">
              {newsItem.title}
            </h1>

            <p className="mt-5 max-w-4xl text-base leading-7 text-slate-300 sm:mt-6 sm:text-lg sm:leading-8">
              {newsItem.excerpt}
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 sm:mt-8 sm:gap-x-6 sm:gap-y-3 sm:text-sm">
              <span>
                By{" "}
                <strong className="text-slate-200">
                  {authorName}
                </strong>
              </span>

              <span>
                Published{" "}
                <strong className="text-slate-200">
                  {formatDate(
                    newsItem.published_at,
                  )}
                </strong>
              </span>

              {newsItem.updated_at && (
                <span>
                  Updated{" "}
                  <strong className="text-slate-200">
                    {formatDate(
                      newsItem.updated_at,
                    )}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="atlas-shell relative pb-6 sm:pb-8">
          <div className="atlas-stat-strip grid grid-cols-2 md:grid-cols-4">
            <StripStat
              label="Category"
              value={newsItem.category}
            />

            <StripStat
              label="Author"
              value={authorName}
            />

            <StripStat
              label="Reading time"
              value={
                newsItem.reading_time !== null
                  ? `${newsItem.reading_time} min`
                  : "Not set"
              }
            />

            <StripStat
              label="Published"
              value={formatDate(
                newsItem.published_at,
              )}
            />
          </div>
        </div>
      </section>

      <div className="atlas-shell grid min-w-0 gap-5 pt-5 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0">
          <section className="atlas-panel min-w-0 p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="border-b border-white/[0.07] pb-5">
              <p className="atlas-section-label">
                HandheldAtlas newsroom
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Full story
              </h2>
            </div>

            <div className="mt-7">
              {renderArticleContent(
                newsItem.content,
              )}
            </div>
          </section>

          <section className="atlas-panel mt-5 min-w-0 p-4 sm:p-5">
            <p className="atlas-section-label">
              Continue exploring
            </p>

            <h2 className="mt-1 text-xl font-black">
              More from the Atlas
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href="/news"
                className="atlas-button-secondary w-full sm:w-auto"
              >
                Browse news
              </Link>

              <Link
                href="/guides"
                className="atlas-button-secondary w-full sm:w-auto"
              >
                Browse guides
              </Link>

              <Link
                href="/search"
                className="atlas-button-primary w-full sm:w-auto"
              >
                Search the Atlas
              </Link>
            </div>
          </section>
        </article>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="atlas-panel min-w-0 p-4 sm:p-5">
            <p className="atlas-section-label">
              Article details
            </p>

            <h2 className="mt-1 text-xl font-black">
              Quick reference
            </h2>

            <dl className="mt-5">
              <InfoRow
                label="Category"
                value={newsItem.category}
              />

              <InfoRow
                label="Author"
                value={authorName}
              />

              <InfoRow
                label="Reading time"
                value={
                  newsItem.reading_time !== null
                    ? `${newsItem.reading_time} min`
                    : "Not set"
                }
              />

              <InfoRow
                label="Published"
                value={formatDate(
                  newsItem.published_at,
                )}
                isLast
              />
            </dl>
          </section>

          {(relatedGame ||
            relatedHandheld) && (
            <section className="atlas-panel min-w-0 p-4 sm:p-5">
              <p className="atlas-section-label">
                Related content
              </p>

              <h2 className="mt-1 text-xl font-black">
                Connected profiles
              </h2>

              <div className="mt-5 space-y-3">
                {relatedGame && (
                  <Link
                    href={`/games/${relatedGame.slug}`}
                    className="group block rounded-xl border border-green-500/25 bg-green-500/[0.06] p-4 transition hover:border-green-500/50"
                  >
                    <p className="text-[0.54rem] font-black uppercase tracking-[0.14em] text-green-400">
                      Related game
                    </p>

                    <p className="mt-2 font-black text-white transition group-hover:text-green-300">
                      {relatedGame.name}
                    </p>

                    <p className="mt-3 text-xs font-black text-green-400">
                      Open game profile →
                    </p>
                  </Link>
                )}

                {relatedHandheld && (
                  <Link
                    href={`/handhelds/${relatedHandheld.slug}`}
                    className="group block rounded-xl border border-cyan-500/25 bg-cyan-500/[0.06] p-4 transition hover:border-cyan-500/50"
                  >
                    <p className="text-[0.54rem] font-black uppercase tracking-[0.14em] text-cyan-400">
                      Related handheld
                    </p>

                    <p className="mt-2 font-black text-white transition group-hover:text-cyan-300">
                      {relatedHandheld.name}
                    </p>

                    <p className="mt-3 text-xs font-black text-cyan-400">
                      Open handheld profile →
                    </p>
                  </Link>
                )}
              </div>
            </section>
          )}

          {newsItem.is_featured && (
            <section className="rounded-xl border border-yellow-500/25 bg-yellow-500/[0.06] p-5">
              <p className="text-[0.56rem] font-black uppercase tracking-[0.14em] text-yellow-400">
                Featured coverage
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                This story is currently highlighted
                across the HandheldAtlas newsroom.
              </p>
            </section>
          )}

          <section className="atlas-panel min-w-0 p-4 sm:p-5">
            <p className="atlas-section-label">
              Read more
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Browse the latest handheld hardware,
              game-performance and platform coverage
              without wading through algorithmic swamp
              water.
            </p>

            <Link
              href="/news"
              className="atlas-button-primary mt-5 w-full"
            >
              Browse all news
            </Link>
          </section>
        </aside>
      </div>
      </main>
    </>
  );
}

function StripStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[0.45rem] font-black uppercase leading-tight tracking-[0.1em] text-slate-600 sm:text-[0.52rem] sm:tracking-[0.14em]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-slate-200">
        {value}
      </p>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function InfoRow({
  label,
  value,
  isLast = false,
}: InfoRowProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-4 ${
        isLast
          ? ""
          : "border-b border-white/[0.06]"
      }`}
    >
      <dt className="text-sm text-slate-600">
        {label}
      </dt>

      <dd className="max-w-[60%] text-right text-sm font-black text-slate-300">
        {value}
      </dd>
    </div>
  );
}