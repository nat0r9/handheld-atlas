"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Games", href: "/games" },
  { label: "Handhelds", href: "/handhelds" },
  { label: "Presets", href: "/presets" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Compare", href: "/compare" },
  { label: "Guides", href: "/guides" },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function isActiveRoute(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            onClick={closeMenu}
            className="group flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-sm font-black text-cyan-400 transition group-hover:bg-cyan-500 group-hover:text-slate-950">
              HA
            </div>

            <span className="text-xl font-black tracking-tight text-white transition group-hover:text-cyan-400">
              HandheldAtlas
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              setIsMenuOpen((currentValue) => !currentValue)
            }
            aria-expanded={isMenuOpen}
            aria-label={
              isMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-white transition hover:border-cyan-500 md:hidden"
          >
            <span className="sr-only">Toggle menu</span>

            <div className="flex flex-col gap-1.5">
              <span
                className={`block h-0.5 w-5 bg-current transition ${
                  isMenuOpen
                    ? "translate-y-2 rotate-45"
                    : ""
                }`}
              />

              <span
                className={`block h-0.5 w-5 bg-current transition ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              />

              <span
                className={`block h-0.5 w-5 bg-current transition ${
                  isMenuOpen
                    ? "-translate-y-2 -rotate-45"
                    : ""
                }`}
              />
            </div>
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-800 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-400"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}