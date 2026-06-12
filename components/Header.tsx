"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

interface NavigationItem {
  label: string;
  href: string;
}

type HeaderRole =
  | "user"
  | "benchmark_tester"
  | "moderator"
  | "atlas_editor"
  | "admin";

interface HeaderUser {
  id: string;
  displayName: string;
  role: HeaderRole;
}

function getHeaderRoleLabel(
  role: HeaderRole,
) {
  switch (role) {
    case "benchmark_tester":
      return "Benchmark Tester";

    case "moderator":
      return "Moderator";

    case "atlas_editor":
      return "Atlas Editor";

    case "admin":
      return "Administrator";

    default:
      return "Community member";
  }
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
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [isScrolled, setIsScrolled] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState<HeaderUser | null>(null);

  const [isAuthLoading, setIsAuthLoading] =
    useState(true);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 10);
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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      setIsAuthLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCurrentUser(null);
        setIsAuthLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, role, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentUser({
        id: user.id,
        displayName:
          profile?.display_name ??
          user.user_metadata?.display_name ??
          user.email?.split("@")[0] ??
          "Atlas member",
        role:
          (profile?.role as HeaderRole | null) ??
          (profile?.is_admin
            ? "admin"
            : "user"),
      });

      setIsAuthLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    setCurrentUser(null);
    setIsMenuOpen(false);

    router.push("/");
    router.refresh();
  }

  const isSearchActive =
    isActiveRoute("/search");

  const profileInitial =
    currentUser?.displayName
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "border-white/[0.08] bg-[#05070d]/95 shadow-[0_16px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          : "border-white/[0.06] bg-[#05070d]/90 backdrop-blur-lg"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/35 to-transparent" />

      <nav className="mx-auto w-full max-w-[96rem] px-3 sm:px-4 lg:px-6">
        <div className="flex min-h-[4.5rem] w-full items-center justify-between gap-2">
          <Link
            href="/"
            onClick={closeMenu}
            className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
            aria-label="HandheldAtlas homepage"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-red-500/30 bg-red-500/[0.08] shadow-[0_0_28px_rgba(239,35,60,0.12)] transition duration-300 group-hover:border-red-400 group-hover:bg-red-500 group-hover:shadow-[0_0_34px_rgba(239,35,60,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent" />

              <span className="relative text-sm font-black tracking-[-0.08em] text-red-400 transition group-hover:text-white">
                HA
              </span>
            </div>

            <div className="min-w-0">
              <span className="block truncate text-base font-black tracking-[-0.04em] text-white transition group-hover:text-red-400 sm:text-lg">
                HandheldAtlas
              </span>

              <span className="hidden text-[0.52rem] font-black uppercase tracking-[0.22em] text-slate-600 sm:block">
                Performance intelligence
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-0.5 xl:flex">
            {primaryNavigation.map((item) => {
              const isActive =
                isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.06em] transition ${
                    isActive
                      ? "bg-red-500/[0.09] text-red-400"
                      : "text-slate-500 hover:bg-white/[0.035] hover:text-white"
                  }`}
                >
                  {item.label}

                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[1.17rem] h-0.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,35,60,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <Link
              href="/search"
              aria-label="Search HandheldAtlas"
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                isSearchActive
                  ? "border-cyan-500 bg-cyan-500 text-[#05070d] shadow-[0_0_24px_rgba(24,215,255,0.24)]"
                  : "border-white/[0.08] bg-black/20 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400"
              }`}
            >
              <SearchIcon />
            </Link>

            {isAuthLoading ? (
              <div className="h-10 w-28 animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.03]" />
            ) : currentUser ? (
              <>
                <Link
                  href="/profile"
                  className="group flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 px-3 transition hover:border-cyan-500/40 hover:bg-cyan-500/[0.06]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-xs font-black text-cyan-400">
                    {profileInitial}
                  </span>

                  <span className="max-w-28 truncate text-xs font-black text-slate-300 transition group-hover:text-white">
                    {currentUser.displayName}
                  </span>
                </Link>

                <Link
                  href="/my-submissions"
                  className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5 text-xs font-black text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-400"
                >
                  My submissions
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5 text-xs font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5 text-xs font-black text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-400"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="atlas-button-primary py-2.5"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <Link
              href="/search"
              onClick={closeMenu}
              aria-label="Search HandheldAtlas"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
                isSearchActive
                  ? "border-cyan-500 bg-cyan-500 text-[#05070d]"
                  : "border-white/[0.08] bg-black/20 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400"
              }`}
            >
              <SearchIcon />
            </Link>

            {currentUser && !isAuthLoading && (
              <Link
                href="/profile"
                onClick={closeMenu}
                aria-label="Open profile"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-sm font-black text-cyan-400"
              >
                {profileInitial}
              </Link>
            )}

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
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
                isMenuOpen
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-white/[0.08] bg-black/20 text-slate-300 hover:border-red-500/50 hover:text-red-400"
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
            <div className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-white/[0.06] py-4">
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
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs font-black uppercase tracking-[0.08em] transition ${
                          isActive
                            ? "border-red-500/30 bg-red-500/[0.09] text-red-400"
                            : "border-white/[0.06] bg-black/20 text-slate-400 hover:border-white/[0.14] hover:text-white"
                        }`}
                      >
                        <span>
                          {item.label}
                        </span>

                        <span
                          className={
                            isActive
                              ? "text-red-400"
                              : "text-slate-700"
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
                className={`mt-3 flex items-center justify-between rounded-lg border px-4 py-3 text-xs font-black uppercase tracking-[0.08em] transition ${
                  isSearchActive
                    ? "border-cyan-500 bg-cyan-500 text-[#05070d]"
                    : "border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-400 hover:border-cyan-500/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <SearchIcon />
                  Search the Atlas
                </span>

                <span>→</span>
              </Link>

              {!isAuthLoading && (
                <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  {currentUser ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-sm font-black text-cyan-400">
                          {profileInitial}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">
                            {currentUser.displayName}
                          </p>

                          <p className="mt-1 text-[0.55rem] font-black uppercase tracking-[0.12em] text-slate-600">
                            {getHeaderRoleLabel(
                              currentUser.role,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Link
                          href="/profile"
                          onClick={closeMenu}
                          className="atlas-button-secondary w-full"
                        >
                          My profile
                        </Link>

                        <Link
                          href="/my-submissions"
                          onClick={closeMenu}
                          className="atlas-button-secondary w-full"
                        >
                          My submissions
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full rounded-xl border border-red-500/25 bg-red-500/[0.07] px-5 py-3 text-sm font-black text-red-400 transition hover:bg-red-500 hover:text-white sm:col-span-2"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href="/login"
                        onClick={closeMenu}
                        className="atlas-button-secondary w-full"
                      >
                        Login
                      </Link>

                      <Link
                        href="/register"
                        onClick={closeMenu}
                        className="atlas-button-primary w-full"
                      >
                        Create account
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link
                  href="/presets"
                  onClick={closeMenu}
                  className="atlas-button-primary w-full"
                >
                  Find settings
                </Link>

                <Link
                  href="/compare"
                  onClick={closeMenu}
                  className="atlas-button-secondary w-full"
                >
                  Compare devices
                </Link>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/[0.06] pt-4">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,35,60,0.8)]" />

                <p className="text-center text-[0.5rem] font-black uppercase tracking-[0.14em] text-slate-700 sm:text-[0.56rem] sm:tracking-[0.18em]">
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
