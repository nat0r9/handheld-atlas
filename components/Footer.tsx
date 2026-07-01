import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
}

type SocialPlatform =
  | "discord"
  | "instagram"
  | "x";

interface SocialLink {
  platform: SocialPlatform;
  title: string;
  href: string;
}

const primaryLinks: FooterLink[] = [
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
  {
    label: "Guides",
    href: "/guides",
  },
  {
    label: "News",
    href: "/news",
  },
];

const secondaryLinks: FooterLink[] = [
  {
    label: "Settings Guide",
    href: "/settings-impact",
  },
  {
    label: "Methodology",
    href: "/methodology",
  },
  {
    label: "Search",
    href: "/search",
  },
  {
    label: "Profile",
    href: "/profile",
  },
  {
    label: "My submissions",
    href: "/my-submissions",
  },
  {
    label: "My guides",
    href: "/my-guide-submissions",
  },
];

const socialLinks: SocialLink[] = [
  {
    platform: "discord",
    title: "Discord",
    href: "https://discord.gg/RdafdpbTXd",
  },
  {
    platform: "instagram",
    title: "Instagram",
    href:
      "https://www.instagram.com/handheld_atlas",
  },
  {
    platform: "x",
    title: "X / Twitter",
    href:
      "https://x.com/handheldatlas",
  },
];

const supportUrl =
  "https://buymeacoffee.com/handheldatlas";

export default function Footer() {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,35,60,0.08),transparent_34%),radial-gradient(circle_at_85%_100%,rgba(24,215,255,0.07),transparent_32%)]" />

      <div className="pointer-events-none absolute -left-28 top-0 h-full w-72 -skew-x-[34deg] bg-white/[0.018]" />

      <div className="pointer-events-none absolute -right-40 bottom-0 h-44 w-[34rem] skew-x-[-36deg] bg-cyan-500/[0.025]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      <div className="atlas-shell relative py-10 sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <Link
            href="/"
            aria-label="HandheldAtlas homepage"
            className="group inline-flex items-center gap-3"
          >
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-red-500/30 bg-red-500/[0.08] shadow-[0_0_28px_rgba(239,35,60,0.12)] transition duration-300 group-hover:border-red-400 group-hover:bg-red-500 group-hover:shadow-[0_0_34px_rgba(239,35,60,0.28)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />

              <span className="relative text-sm font-black tracking-[-0.08em] text-red-400 transition group-hover:text-white">
                HA
              </span>
            </div>

            <div className="text-left">
              <span className="block text-xl font-black tracking-[-0.04em] text-white transition group-hover:text-red-400">
                HandheldAtlas
              </span>

              <span className="block text-[0.52rem] font-black uppercase tracking-[0.22em] text-slate-700">
                Performance intelligence
              </span>
            </div>
          </Link>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-500">
            Independent handheld gaming database for
            tested settings, measured performance,
            hardware profiles, guides and community
            knowledge.
          </p>

          <p className="mt-2 text-[0.58rem] font-black uppercase tracking-[0.17em] text-slate-700">
            HandheldAtlas.com
            <span className="mx-2 text-red-500">
              |
            </span>
            Community-driven
            <span className="mx-2 text-cyan-400">
              |
            </span>
            Built for players
          </p>

          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:px-5">
            <p className="text-sm font-black text-white">
              Support the Atlas
            </p>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
              Support helps cover hosting, testing time and future community
              features while keeping the database open for handheld players.
            </p>

            <a
              href={supportUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-3 inline-flex rounded-xl border border-yellow-400/30 bg-yellow-400/[0.08] px-4 py-2 text-xs font-black text-yellow-200 transition hover:border-yellow-300/60 hover:bg-yellow-400/[0.14] hover:text-yellow-100"
            >
              Buy us a coffee →
            </a>
          </div>

          <nav
            aria-label="Footer navigation"
            className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-black text-slate-400"
          >
            {primaryLinks.map(
              (link, index) => (
                <div
                  key={link.href}
                  className="flex items-center gap-3"
                >
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-slate-800"
                    >
                      |
                    </span>
                  )}

                  <Link
                    href={link.href}
                    className="transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </div>
              ),
            )}
          </nav>

          <nav
            aria-label="Account and quick links"
            className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.66rem] font-bold text-slate-600"
          >
            {secondaryLinks.map(
              (link, index) => (
                <div
                  key={link.href}
                  className="flex items-center gap-3"
                >
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-slate-800"
                    >
                      |
                    </span>
                  )}

                  <Link
                    href={link.href}
                    className="transition hover:text-cyan-300"
                  >
                    {link.label}
                  </Link>
                </div>
              ),
            )}
          </nav>

          <nav
            aria-label="HandheldAtlas social media"
            className="mt-6 flex items-center justify-center gap-5"
          >
            {socialLinks.map(
              (social) => (
                <SocialIconLink
                  key={social.platform}
                  social={social}
                />
              ),
            )}
          </nav>

          <div className="mt-6 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />

          <p className="mt-5 text-xs font-black text-slate-400">
            © {currentYear} HandheldAtlas
          </p>

          <p className="mt-2 max-w-3xl text-[0.6rem] font-bold uppercase tracking-[0.13em] text-slate-700">
            Tested settings
            <span className="mx-2 text-red-500">
              |
            </span>
            Measured performance
            <span className="mx-2 text-cyan-400">
              |
            </span>
            No recycled filler
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIconLink({
  social,
}: {
  social: SocialLink;
}) {
  const hoverClass =
    social.platform === "discord"
      ? "hover:text-[#8b95ff]"
      : social.platform === "instagram"
        ? "hover:text-fuchsia-400"
        : "hover:text-cyan-300";

  return (
    <a
      href={social.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${social.title} — opens in a new tab`}
      title={social.title}
      className={`flex h-8 w-8 items-center justify-center text-slate-500 transition duration-200 hover:-translate-y-0.5 hover:scale-110 ${hoverClass}`}
    >
      <SocialIcon
        platform={social.platform}
        className="h-5 w-5"
      />
    </a>
  );
}

function SocialIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className: string;
}) {
  if (platform === "discord") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={className}
        fill="currentColor"
      >
        <path d="M19.5 5.34A16.4 16.4 0 0 0 15.44 4l-.5 1.02a14.8 14.8 0 0 0-5.88 0L8.56 4A16.5 16.5 0 0 0 4.5 5.34C1.93 9.13 1.23 12.82 1.58 16.46A16.7 16.7 0 0 0 6.56 19l1.2-1.65a10.6 10.6 0 0 1-1.88-.9l.46-.35c3.63 1.68 7.57 1.68 11.16 0l.47.35c-.6.35-1.23.65-1.88.9L17.29 19a16.6 16.6 0 0 0 4.98-2.54c.42-4.22-.72-7.88-2.77-11.12ZM8.64 14.76c-1.09 0-1.99-1-1.99-2.23 0-1.23.88-2.23 1.99-2.23 1.11 0 2.01 1.01 1.99 2.23 0 1.23-.88 2.23-1.99 2.23Zm6.72 0c-1.09 0-1.99-1-1.99-2.23 0-1.23.88-2.23 1.99-2.23 1.11 0 2.01 1.01 1.99 2.23 0 1.23-.88 2.23-1.99 2.23Z" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
        />

        <circle
          cx="12"
          cy="12"
          r="4"
        />

        <circle
          cx="17.5"
          cy="6.5"
          r="1"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.24-8.28L2.96 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.72L8.42 4.05H6.57L17.8 19.84Z" />
    </svg>
  );
}
