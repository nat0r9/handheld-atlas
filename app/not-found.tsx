import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-slate-950 px-6 py-20 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(6,182,212,0.16),transparent_35%)]" />

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.4em] text-cyan-400">
          Lost in the Atlas
        </p>

        <p className="mt-6 text-[7rem] font-black leading-none text-slate-900 drop-shadow-[0_0_30px_rgba(6,182,212,0.25)] sm:text-[10rem]">
          404
        </p>

        <h1 className="-mt-4 text-4xl font-black sm:text-6xl">
          This page wandered off the map.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          The game, handheld or guide you requested does not exist,
          was moved, or got swallowed by a particularly aggressive
          Windows update.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
          >
            Return home
          </Link>

          <Link
            href="/games"
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-black text-white transition hover:border-cyan-500 hover:text-cyan-400"
          >
            Browse games
          </Link>

          <Link
            href="/handhelds"
            className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-black text-white transition hover:border-cyan-500 hover:text-cyan-400"
          >
            Browse handhelds
          </Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-2xl gap-4 sm:grid-cols-3">
          <QuickLink
            href="/presets"
            label="Presets"
            description="Recommended settings"
          />

          <QuickLink
            href="/benchmarks"
            label="Benchmarks"
            description="Performance results"
          />

          <QuickLink
            href="/guides"
            label="Guides"
            description="Handheld knowledge"
          />
        </div>
      </div>
    </main>
  );
}

interface QuickLinkProps {
  href: string;
  label: string;
  description: string;
}

function QuickLink({
  href,
  label,
  description,
}: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-500"
    >
      <p className="font-black">{label}</p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </Link>
  );
}