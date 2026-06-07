import Link from "next/link";

const recoveryLinks = [
  {
    label: "Browse games",
    href: "/games",
    description:
      "Open the published game database.",
  },
  {
    label: "Explore handhelds",
    href: "/handhelds",
    description:
      "Compare devices and specifications.",
  },
  {
    label: "Find presets",
    href: "/presets",
    description:
      "Search tested handheld settings.",
  },
  {
    label: "Search the Atlas",
    href: "/search",
    description:
      "Search games, devices and articles.",
  },
];

export default function NotFoundPage() {
  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
                Error 404
              </p>

              <h1 className="mt-5 text-6xl font-black leading-[0.95] md:text-8xl">
                Lost beyond
                <span className="block text-cyan-400">
                  the Atlas.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
                The page you tried to open does not exist,
                was moved, or got swallowed by a badly
                configured route. Even maps have blank
                spaces, apparently.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-xl bg-cyan-500 px-6 py-4 font-black text-slate-950 transition hover:bg-cyan-400"
                >
                  Return home
                </Link>

                <Link
                  href="/search"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-4 font-black text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
                >
                  Search the Atlas
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-72 items-center justify-center">
              <div className="absolute h-56 w-56 rounded-full border border-cyan-500/20 bg-cyan-500/5 shadow-[0_0_80px_rgba(6,182,212,0.12)]" />

              <div className="absolute h-40 w-40 rounded-full border border-slate-700" />

              <div className="absolute h-24 w-24 rounded-full border border-purple-500/30 bg-purple-500/5" />

              <div className="relative text-center">
                <p className="text-7xl font-black tracking-[-0.08em] text-cyan-400 md:text-8xl">
                  404
                </p>

                <p className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-slate-600">
                  Coordinates not found
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-400">
              Recovery Routes
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Pick another path
            </h2>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {recoveryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500"
              >
                <p className="text-lg font-black text-slate-200 transition group-hover:text-cyan-400">
                  {item.label}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <p className="mt-5 text-sm font-black text-cyan-400 transition group-hover:translate-x-1">
                  Open →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}