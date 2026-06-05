import Link from "next/link";

const navItems = [
  { label: "Games", href: "/games" },
  { label: "Handhelds", href: "/handhelds" },
  { label: "Presets", href: "/presets" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Compare", href: "/compare" },
  { label: "Guides", href: "/guides" },
];

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-white transition hover:text-cyan-400"
        >
          HandheldAtlas
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}