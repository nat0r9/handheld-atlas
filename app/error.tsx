"use client";

import Link from "next/link";
import { useEffect } from "react";

interface GlobalErrorPageProps {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
}

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  useEffect(() => {
    console.error(
      "HandheldAtlas application error:",
      error,
    );
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-950/40 via-slate-950 to-black p-8 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-400">
              Atlas System Error
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              Something broke.
              <span className="block text-red-400">
                The Atlas survived.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
              The page could not be loaded correctly.
              This may be a temporary database or network
              problem rather than the beginning of the
              digital apocalypse.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
              >
                Try again
              </button>

              <Link
                href="/"
                className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 font-black text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
              >
                Return home
              </Link>

              <Link
                href="/search"
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-4 font-black text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
              >
                Search the Atlas
              </Link>
            </div>

            {error.digest && (
              <div className="mt-9 rounded-2xl border border-slate-800 bg-black/30 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">
                  Error reference
                </p>

                <p className="mt-2 break-all font-mono text-sm text-slate-400">
                  {error.digest}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard
            title="Retry"
            description="Try loading the current page again."
          />

          <InfoCard
            title="Navigate away"
            description="Open another module while the issue clears."
          />

          <InfoCard
            title="Temporary issues"
            description="Database and network errors often disappear after a moment."
          />
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="font-black text-slate-200">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}