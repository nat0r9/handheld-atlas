import Link from "next/link";
import { guides } from "../../data/guides";
import type { GuideCategory } from "../../types/guides";

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

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Knowledge Base
        </p>

        <h1 className="mt-3 text-5xl font-black">Guides</h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Practical guides for performance, battery life, Windows,
          hardware and docked handheld gaming.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500 hover:bg-slate-800/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getCategoryStyle(
                    guide.category,
                  )}`}
                >
                  {guide.category}
                </span>

                <span className="text-xs text-slate-500">
                  {guide.readingTime}
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-bold transition group-hover:text-cyan-400">
                {guide.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {guide.excerpt}
              </p>

              <p className="mt-6 text-sm font-semibold text-cyan-400">
                Read guide →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}