import Link from "next/link";
import { guides } from "../../../data/guides";
import type { GuideCategory } from "../../../types/guides";

function getCategoryStyle(category: GuideCategory) {
  switch (category) {
    case "Performance":
      return "bg-orange-500/20 text-orange-400";

    case "Battery":
      return "bg-green-500/20 text-green-400";

    case "Docked":
      return "bg-red-500/20 text-red-400";

    case "Windows":
      return "bg-blue-500/20 text-blue-400";

    case "Hardware":
      return "bg-purple-500/20 text-purple-400";
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const guide = guides.find((item) => item.slug === slug);

  if (!guide) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-black">Guide not found</h1>

          <Link
            href="/guides"
            className="mt-6 inline-flex text-cyan-400 hover:text-cyan-300"
          >
            ← Back to guides
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <article className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/guides"
          className="text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to guides
        </Link>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${getCategoryStyle(
              guide.category,
            )}`}
          >
            {guide.category}
          </span>

          <span className="text-sm text-slate-500">
            {guide.readingTime}
          </span>

          <span className="text-sm text-slate-500">
            Published {guide.publishedAt}
          </span>
        </div>

        <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
          {guide.title}
        </h1>

        <p className="mt-6 text-xl leading-8 text-slate-400">
          {guide.excerpt}
        </p>

        <div className="mt-12 space-y-6">
          {guide.content.map((paragraph, index) => (
            <p
              key={`${guide.slug}-${index}`}
              className="text-lg leading-8 text-slate-300"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <p className="text-sm font-semibold text-yellow-300">
            Development content
          </p>

          <p className="mt-2 text-sm text-yellow-100/70">
            These guides are currently placeholder content used to build
            the HandheldAtlas knowledge base. They will be expanded and
            verified before launch.
          </p>
        </div>
      </article>
    </main>
  );
}