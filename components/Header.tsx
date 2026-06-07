"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavigationItem {
  label: string;
  href: string;
  accent?: boolean;
}

const primaryNavigation: NavigationItem[] = [
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
    accent: true,
  },
];

export default function Header() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [isScrolled, setIsScrolled] =
    useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function isActiveRoute(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  const isSearchActive =
    isActiveRoute("/search");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "border-slate-800 bg-slate-950/95 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          : "border-slate-800/70 bg-slate-950/85 backdrop-blur-lg"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-4">
          <Link
            href="/"
            onClick={closeMenu}
            className="group flex min-w-0 items-center gap-3"
            aria-label="HandheldAtlas homepage"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.1)] transition duration-300 group-hover:border-cyan-400 group-hover:bg-cyan-500 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

              <span className="relative text-sm font-black tracking-[-0.08em] text-cyan-400 transition group-hover:text-slate-950">
                HA
              </span>
            </div>

            <div className="min-w-0">
              <span className="block truncate text-lg font-black tracking-tight text-white transition group-hover:text-cyan-400 sm:text-xl">
                HandheldAtlas
              </span>

              <span className="hidden text-[0.6rem] font-black uppercase tracking-[0.25em] text-slate-600 sm:block">
                Performance intelligence
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            {primaryNavigation.map((item) => {
              const isActive =
                isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-xl px-3 py-2 text-sm font-bold transition ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400"
                      : item.accent
                        ? "text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.label}

                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[1.13rem] h-0.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  )}

                  {item.accent &&
                    !isActive && (
                      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                    )}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            <Link
              href="/search"
              aria-label="Search HandheldAtlas"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isSearchActive
                  ? "border-cyan-500 bg-cyan-500 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              <SearchIcon />
            </Link>

            <Link
              href="/presets"
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-black text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
            >
              Find settings
            </Link>
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <Link
              href="/search"
              onClick={closeMenu}
              aria-label="Search HandheldAtlas"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                isSearchActive
                  ? "border-cyan-500 bg-cyan-500 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-white hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              <SearchIcon />
            </Link>

            <button
              type="button"
              onClick={() =>
                setIsMenuOpen(
                  (currentValue) =>
                    !currentValue,
                )
              }
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={
                isMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                isMenuOpen
                  ? "border-cyan-500 bg-cyan-500 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-white hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              <span className="sr-only">
                Toggle navigation
              </span>

              <span className="relative block h-5 w-5">
                <span
                  className={`absolute left-0 top-0.5 block h-0.5 w-5 rounded-full bg-current transition duration-300 ${
                    isMenuOpen
                      ? "translate-y-2 rotate-45"
                      : ""
                  }`}
                />

                <span
                  className={`absolute left-0 top-[0.56rem] block h-0.5 w-5 rounded-full bg-current transition duration-300 ${
                    isMenuOpen
                      ? "opacity-0"
                      : ""
                  }`}
                />

                <span
                  className={`absolute bottom-0.5 left-0 block h-0.5 w-5 rounded-full bg-current transition duration-300 ${
                    isMenuOpen
                      ? "-translate-y-2 -rotate-45"
                      : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id="mobile-navigation"
          className={`grid transition-all duration-300 xl:hidden ${
            isMenuOpen
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-slate-800 py-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {primaryNavigation.map(
                  (item) => {
                    const isActive =
                      isActiveRoute(
                        item.href,
                      );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-bold transition ${
                          isActive
                            ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-400"
                            : item.accent
                              ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-400 hover:bg-yellow-500/10"
                              : "border-transparent bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <span>
                          {item.label}
                        </span>

                        <span
                          className={
                            isActive
                              ? "text-cyan-400"
                              : "text-slate-600"
                          }
                        >
                          →
                        </span>
                      </Link>
                    );
                  },
                )}
              </div>

              <Link
                href="/search"
                onClick={closeMenu}
                className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-black transition ${
                  isSearchActive
                    ? "border-cyan-500 bg-cyan-500 text-slate-950"
                    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950"
                }`}
              >
                <span className="flex items-center gap-3">
                  <SearchIcon />
                  Search the Atlas
                </span>

                <span>→</span>
              </Link>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/presets"
                  onClick={closeMenu}
                  className="rounded-xl bg-cyan-500 px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-400"
                >
                  Find game settings
                </Link>

                <Link
                  href="/benchmarks"
                  onClick={closeMenu}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-center text-sm font-black text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
                >
                  Browse benchmarks
                </Link>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-black/20 px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
                  Tested settings · Real data · No filler
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
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