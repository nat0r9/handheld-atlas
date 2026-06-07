import Link from "next/link";

const databaseLinks = [
  {
    label: "Games",
    href: "/games",
  },
  {
    label: "Handhelds",
    href: "/handhelds",
  },
  {
    label: "Presets",
    href: "/presets",
  },
  {
    label: "Benchmarks",
    href: "/benchmarks",
  },
  {
    label: "Compare",
    href: "/compare",
  },
];

const contentLinks = [
  {
    label: "Guides",
    href: "/guides",
  },
  {
    label: "News",
    href: "/news",
  },
];

const quickLinks = [
  {
    label: "Find game settings",
    href: "/presets",
  },
  {
    label: "Browse benchmarks",
    href: "/benchmarks",
  },
  {
    label: "Compare handhelds",
    href: "/compare",
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-950 text-white">
      <div className="pointer-events-none absolute left-[8%] top-0 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-[8%] h-72 w-72 translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <section>
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
              aria-label="HandheldAtlas homepage"
            >
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.12)] transition group-hover:border-cyan-400 group-hover:bg-cyan-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                <span className="relative text-sm font-black tracking-[-0.08em] text-cyan-400 transition group-hover:text-slate-950">
                  HA
                </span>
              </div>

              <div>
                <span className="block text-2xl font-black tracking-tight transition group-hover:text-cyan-400">
                  HandheldAtlas
                </span>

                <span className="block text-[0.65rem] font-black uppercase tracking-[0.25em] text-slate-600">
                  Performance intelligence
                </span>
              </div>
            </Link>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">
              Tested settings, verified benchmarks, device
              profiles, practical guides and handheld gaming
              news without the usual algorithm-fed filler.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/presets"
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Find game settings
              </Link>

              <Link
                href="/benchmarks"
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
              >
                View benchmarks
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                The mission
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                Build one reliable atlas for handheld players:
                real data, clear recommendations and fewer
                bullshit answers buried under twelve minutes
                of video padding.
              </p>
            </div>
          </section>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FooterColumn
              title="Database"
              links={databaseLinks}
            />

            <FooterColumn
              title="Content"
              links={contentLinks}
            />

            <FooterColumn
              title="Quick access"
              links={quickLinks}
            />
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-300">
                © {currentYear} HandheldAtlas
              </p>

              <p className="mt-1 text-xs leading-6 text-slate-600">
                Independent handheld gaming database and
                editorial platform.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-600">
              <span>Tested settings</span>
              <span className="hidden text-cyan-500 sm:inline">
                •
              </span>
              <span>Real benchmarks</span>
              <span className="hidden text-cyan-500 sm:inline">
                •
              </span>
              <span>No filler</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

function FooterColumn({
  title,
  links,
}: FooterColumnProps) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
        {title}
      </p>

      <nav
        className="mt-5 flex flex-col gap-3"
        aria-label={`${title} footer links`}
      >
        {links.map((link) => (
          <Link
            key={`${title}-${link.href}-${link.label}`}
            href={link.href}
            className="group flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm font-bold text-slate-400 transition hover:border-slate-800 hover:bg-slate-900 hover:text-white"
          >
            <span>{link.label}</span>

            <span className="text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-400">
              →
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
}