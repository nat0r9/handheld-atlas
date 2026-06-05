"use client";

import Link from "next/link";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            onClick={closeMenu}
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

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-cyan-400"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}