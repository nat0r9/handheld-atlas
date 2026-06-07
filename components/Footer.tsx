import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
}

const databaseLinks: FooterLink[] = [
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

const editorialLinks: FooterLink[] = [
  {
    label: "Guides",
    href: "/guides",
  },
  {
    label: "News",
    href: "/news",
  },
  {
    label: "Search",
    href: "/search",
  },
];

const quickLinks: FooterLink[] = [
  {
    label: "Find game settings",
    href: "/presets",
  },
  {
    label: "Browse performance data",
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
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#04060b] text-white">
      <div className="pointer-events-none absolute left-[10%] top-0 h-64 w-64 -translate-y-1/2 rounded-full bg-red-500/[0.07] blur-[100px]" />

      <div className="pointer-events-none absolute bottom-0 right-[8%] h-64 w-64 translate-y-1/2 rounded-full bg-cyan-500/[0.06] blur-[100px]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

      <div className="atlas-shell relative py-10 md:py-12">
        <section className="atlas-panel relative overflow-hidden p-5 md:p-7">
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-red-500/[0.07] blur-[80px]" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="atlas-section-label">
                Handheld performance intelligence
              </p>

              <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight md:text-4xl">
                Stop guessing.
                <span className="atlas-text-red">
                  {" "}
                  Start playing.
                </span>
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                Find tested settings, measured performance
                and practical handheld data without digging
                through twenty tabs of recycled nonsense.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/presets"
                className="atlas-button-primary"
              >
                Find settings
                <ArrowIcon />
              </Link>

              <Link
                href="/search"
                className="atlas-button-secondary"
              >
                Search the Atlas
                <SearchIcon />
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_2fr]">
          <section>
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
              aria-label="HandheldAtlas homepage"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-red-500/30 bg-red-500/[0.08] shadow-[0_0_28px_rgba(239,35,60,0.12)] transition duration-300 group-hover:border-red-400 group-hover:bg-red-500 group-hover:shadow-[0_0_34px_rgba(239,35,60,0.28)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />

                <span className="relative text-sm font-black tracking-[-0.08em] text-red-400 transition group-hover:text-white">
                  HA
                </span>
              </div>

              <div>
                <span className="block text-xl font-black tracking-[-0.04em] transition group-hover:text-red-400">
                  HandheldAtlas
                </span>

                <span className="block text-[0.52rem] font-black uppercase tracking-[0.22em] text-slate-700">
                  Performance intelligence
                </span>
              </div>
            </Link>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-500">
              An independent handheld gaming database for
              settings, presets, benchmarks, device profiles,
              guides and news.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <StatusChip
                label="Live database"
                accent="red"
              />

              <StatusChip
                label="Real benchmarks"
                accent="cyan"
              />

              <StatusChip
                label="No filler"
              />
            </div>
          </section>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn
              title="Database"
              links={databaseLinks}
            />

            <FooterColumn
              title="Editorial"
              links={editorialLinks}
            />

            <FooterColumn
              title="Quick access"
              links={quickLinks}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-white/[0.07] pt-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-slate-300">
                © {currentYear} HandheldAtlas
              </p>

              <p className="mt-1 text-xs leading-6 text-slate-700">
                Independent handheld gaming database and
                editorial platform.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.56rem] font-black uppercase tracking-[0.16em] text-slate-700">
              <span>Tested settings</span>

              <span className="hidden h-1 w-1 rounded-full bg-red-500 sm:block" />

              <span>Measured performance</span>

              <span className="hidden h-1 w-1 rounded-full bg-cyan-400 sm:block" />

              <span>Built for players</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
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
      <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-red-400">
        {title}
      </p>

      <nav
        className="mt-4 flex flex-col gap-1"
        aria-label={`${title} footer links`}
      >
        {links.map((link) => (
          <Link
            key={`${title}-${link.href}-${link.label}`}
            href={link.href}
            className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:border-white/[0.07] hover:bg-white/[0.025] hover:text-white"
          >
            <span>{link.label}</span>

            <span className="text-slate-800 transition group-hover:translate-x-1 group-hover:text-cyan-400">
              →
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
}

function StatusChip({
  label,
  accent,
}: {
  label: string;
  accent?: "red" | "cyan";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.56rem] font-black uppercase tracking-[0.12em] ${
        accent === "red"
          ? "border-red-500/25 bg-red-500/[0.06] text-red-400"
          : accent === "cyan"
            ? "border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-400"
            : "border-white/[0.07] bg-black/20 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          accent === "red"
            ? "bg-red-500 shadow-[0_0_7px_rgba(239,35,60,0.8)]"
            : accent === "cyan"
              ? "bg-cyan-400 shadow-[0_0_7px_rgba(24,215,255,0.8)]"
              : "bg-slate-700"
        }`}
      />

      {label}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />

      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}