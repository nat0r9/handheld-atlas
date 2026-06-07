import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

interface GuidePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface DatabaseGuide {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  reading_time: number | null;
  difficulty: string | null;
  cover_image_url: string | null;
  related_game_slug: string | null;
  related_handheld_slug: string | null;
  published_at: string | null;
  updated_at: string | null;
}

interface RelatedContent {
  name: string;
  slug: string;
}

async function getGuide(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guides")
    .select(`
      id,
      title,
      slug,
      category,
      excerpt,
      content,
      reading_time,
      difficulty,
      cover_image_url,
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
      "Could not load guide:",
      error.message,
    );

    return null;
  }

  return data as DatabaseGuide | null;
}

async function getRelatedContent(
  guide: DatabaseGuide,
) {
  const supabase = await createClient();

  const [
    relatedGameResult,
    relatedHandheldResult,
  ] = await Promise.all([
    guide.related_game_slug
      ? supabase
          .from("games")
          .select("name, slug")
          .eq(
            "slug",
            guide.related_game_slug,
          )
          .eq("status", "published")
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    guide.related_handheld_slug
      ? supabase
          .from("handhelds")
          .select("name, slug")
          .eq(
            "slug",
            guide.related_handheld_slug,
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
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) {
    return {
      title: "Guide Not Found",
      description:
        "The requested guide does not exist in the HandheldAtlas knowledge base.",
    };
  }

  return {
    title: guide.title,
    description: guide.excerpt,

    openGraph: {
      title: `${guide.title} | HandheldAtlas`,
      description: guide.excerpt,
      type: "article",
      publishedTime:
        guide.published_at ?? undefined,
      modifiedTime:
        guide.updated_at ?? undefined,
      images: guide.cover_image_url
        ? [
            {
              url: guide.cover_image_url,
              alt: guide.title,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | HandheldAtlas`,
      description: guide.excerpt,
      images: guide.cover_image_url
        ? [guide.cover_image_url]
        : [],
    },
  };
}

function getDifficultyStyle(
  difficulty: string | null,
) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "border-green-500/30 bg-green-500/10 text-green-400";

    case "intermediate":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";

    case "advanced":
      return "border-red-500/30 bg-red-500/10 text-red-400";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
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

function renderGuideContent(content: string) {
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
          className="mt-12 border-l-2 border-red-500 pl-4 text-3xl font-black leading-tight text-white first:mt-0"
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
          key={`list-${index}`}
          className="my-7 space-y-3 text-base leading-8 text-slate-300"
        >
          {lines.map((line, lineIndex) => (
            <li
              key={`${line}-${lineIndex}`}
              className="flex gap-3"
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
              className="grid grid-cols-[2.5rem_1fr] gap-3 text-base leading-8 text-slate-300"
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
        className="my-7 whitespace-pre-line text-base leading-8 text-slate-300"
      >
        {block}
      </p>
    );
  });
}

export default async function GuidePage({
  params,
}: GuidePageProps) {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) {
    notFound();
  }

  const {
    relatedGame,
    relatedHandheld,
  } = await getRelatedContent(guide);

  return (
    <main className="atlas-page pb-14 text-white">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        {guide.cover_image_url ? (
          <Image
            src={guide.cover_image_url}
            alt={guide.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(24,215,255,0.18),transparent_28%),radial-gradient(circle_at_20%_70%,rgba(239,35,60,0.16),transparent_30%),linear-gradient(135deg,#05070d,#090d16_55%,#13090f)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/95 to-[#05070d]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-black/25" />

        <div className="atlas-shell relative flex min-h-[38rem] items-end py-12">
          <div className="max-w-5xl">
            <Link
              href="/guides"
              className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 transition hover:text-white"
            >
              ← Back to guides
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] text-red-400 backdrop-blur">
                {guide.category}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] backdrop-blur ${getDifficultyStyle(
                  guide.difficulty,
                )}`}
              >
                {guide.difficulty ?? "Guide"}
              </span>

              {guide.reading_time !== null && (
                <span className="atlas-chip">
                  {guide.reading_time} min read
                </span>
              )}
            </div>

            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              {guide.title}
            </h1>

            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">
              {guide.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span>
                Published{" "}
                <strong className="text-slate-200">
                  {formatDate(
                    guide.published_at,
                  )}
                </strong>
              </span>

              {guide.updated_at && (
                <span>
                  Updated{" "}
                  <strong className="text-slate-200">
                    {formatDate(
                      guide.updated_at,
                    )}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="atlas-shell relative pb-8">
          <div className="atlas-stat-strip grid grid-cols-2 md:grid-cols-4">
            <StripStat
              label="Category"
              value={guide.category}
            />

            <StripStat
              label="Difficulty"
              value={
                guide.difficulty ?? "Not set"
              }
            />

            <StripStat
              label="Reading time"
              value={
                guide.reading_time !== null
                  ? `${guide.reading_time} min`
                  : "Not set"
              }
            />

            <StripStat
              label="Published"
              value={formatDate(
                guide.published_at,
              )}
            />
          </div>
        </div>
      </section>

      <div className="atlas-shell grid gap-5 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0">
          <section className="atlas-panel p-6 md:p-8 lg:p-10">
            <div className="border-b border-white/[0.07] pb-5">
              <p className="atlas-section-label">
                HandheldAtlas guide
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Complete walkthrough
              </h2>
            </div>

            <div className="mt-7">
              {renderGuideContent(
                guide.content,
              )}
            </div>
          </section>

          <section className="atlas-panel mt-5 p-5">
            <p className="atlas-section-label">
              Continue exploring
            </p>

            <h2 className="mt-1 text-xl font-black">
              More routes through the Atlas
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Link
                href="/guides"
                className="atlas-button-secondary"
              >
                Browse guides
              </Link>

              <Link
                href="/games"
                className="atlas-button-secondary"
              >
                Browse games
              </Link>

              <Link
                href="/handhelds"
                className="atlas-button-primary"
              >
                Browse handhelds
              </Link>
            </div>
          </section>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="atlas-panel p-5">
            <p className="atlas-section-label">
              Guide details
            </p>

            <h2 className="mt-1 text-xl font-black">
              Quick reference
            </h2>

            <dl className="mt-5">
              <GuideInfoRow
                label="Category"
                value={guide.category}
              />

              <GuideInfoRow
                label="Difficulty"
                value={
                  guide.difficulty ??
                  "Not set"
                }
              />

              <GuideInfoRow
                label="Reading time"
                value={
                  guide.reading_time !== null
                    ? `${guide.reading_time} min`
                    : "Not set"
                }
              />

              <GuideInfoRow
                label="Published"
                value={formatDate(
                  guide.published_at,
                )}
                isLast
              />
            </dl>
          </section>

          {(relatedGame ||
            relatedHandheld) && (
            <section className="atlas-panel p-5">
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

          <section className="atlas-panel p-5">
            <p className="atlas-section-label">
              Need more?
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Search every guide, game and device
              without digging through menu hell.
            </p>

            <Link
              href="/search"
              className="atlas-button-primary mt-5 w-full"
            >
              Search the Atlas
            </Link>
          </section>
        </aside>
      </div>
    </main>
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
    <div className="min-w-0 px-4 py-4">
      <p className="text-[0.52rem] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-slate-200">
        {value}
      </p>
    </div>
  );
}

interface GuideInfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function GuideInfoRow({
  label,
  value,
  isLast = false,
}: GuideInfoRowProps) {
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