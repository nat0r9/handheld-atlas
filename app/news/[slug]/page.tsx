import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

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

    openGraph: {
      title: `${newsItem.title} | HandheldAtlas`,
      description: newsItem.excerpt,
      type: "article",
      publishedTime:
        newsItem.published_at ?? undefined,
      modifiedTime:
        newsItem.updated_at ?? undefined,
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
          className="mt-12 text-3xl font-black leading-tight text-white first:mt-0"
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
          className="my-6 space-y-3 pl-6 text-lg leading-8 text-slate-300"
        >
          {lines.map((line, lineIndex) => (
            <li
              key={`${line}-${lineIndex}`}
              className="list-disc marker:text-cyan-400"
            >
              {line.replace(/^[-*•]\s+/, "")}
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
          className="my-6 space-y-3 pl-6 text-lg leading-8 text-slate-300"
        >
          {lines.map((line, lineIndex) => (
            <li
              key={`${line}-${lineIndex}`}
              className="list-decimal marker:font-bold marker:text-cyan-400"
            >
              {line.replace(/^\d+[.)]\s+/, "")}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p
        key={`paragraph-${index}`}
        className="my-6 whitespace-pre-line text-lg leading-9 text-slate-300"
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

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
        {newsItem.cover_image_url ? (
          <Image
            src={newsItem.cover_image_url}
            alt={newsItem.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-black" />
        )}

        <div className="absolute inset-0 bg-slate-950/60" />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/35" />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />

        <div className="relative mx-auto flex min-h-[34rem] max-w-7xl items-end px-6 py-14">
          <div className="max-w-4xl">
            <Link
              href="/news"
              className="inline-flex text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to news
            </Link>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {newsItem.is_featured && (
                <span className="rounded-full border border-yellow-500/40 bg-yellow-500/20 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-300 backdrop-blur">
                  Featured
                </span>
              )}

              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-300 backdrop-blur">
                {newsItem.category}
              </span>

              {newsItem.reading_time !== null && (
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300 backdrop-blur">
                  {newsItem.reading_time} min read
                </span>
              )}
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">
              {newsItem.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              {newsItem.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-400">
              <span>
                By{" "}
                <strong className="text-slate-200">
                  {newsItem.author_name ??
                    "HandheldAtlas Team"}
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
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-10">
            {renderArticleContent(
              newsItem.content,
            )}
          </div>
        </article>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Article Details
            </p>

            <dl className="mt-5 space-y-4">
              <InfoRow
                label="Category"
                value={newsItem.category}
              />

              <InfoRow
                label="Author"
                value={
                  newsItem.author_name ??
                  "HandheldAtlas Team"
                }
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
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                Related Content
              </p>

              <div className="mt-5 space-y-3">
                {relatedGame && (
                  <Link
                    href={`/games/${relatedGame.slug}`}
                    className="block rounded-2xl border border-green-500/30 bg-green-500/10 p-4 transition hover:border-green-400 hover:bg-green-500/20"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-400">
                      Game
                    </p>

                    <p className="mt-2 font-black text-white">
                      {relatedGame.name}
                    </p>

                    <p className="mt-2 text-sm text-green-300">
                      Open game profile →
                    </p>
                  </Link>
                )}

                {relatedHandheld && (
                  <Link
                    href={`/handhelds/${relatedHandheld.slug}`}
                    className="block rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 transition hover:border-purple-400 hover:bg-purple-500/20"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                      Handheld
                    </p>

                    <p className="mt-2 font-black text-white">
                      {relatedHandheld.name}
                    </p>

                    <p className="mt-2 text-sm text-purple-300">
                      Open handheld profile →
                    </p>
                  </Link>
                )}
              </div>
            </section>
          )}

          <Link
            href="/news"
            className="block rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 text-center font-black text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
          >
            Browse all news
          </Link>
        </aside>
      </div>
    </main>
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
      className={`flex items-start justify-between gap-4 ${
        isLast
          ? ""
          : "border-b border-slate-800 pb-4"
      }`}
    >
      <dt className="text-sm text-slate-500">
        {label}
      </dt>

      <dd className="text-right font-bold text-slate-200">
        {value}
      </dd>
    </div>
  );
}