"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface TopGamePanelItem {
  rank: number;
  id: string;
  name: string;
  slug: string;
  genre: string;
  coverImageUrl: string | null;
  atlasScore: number | null;
  bestHandheld: string | null;
  recommendedTdp: string | null;
  communityRating: number | null;
  ratingCount: number;
}

interface CommunityTopGamesPanelProps {
  items: TopGamePanelItem[];
  mode: "community" | "atlas";
  monthLabel: string;
}

const ROTATION_INTERVAL = 7000;
const SWIPE_THRESHOLD = 45;

export default function CommunityTopGamesPanel({
  items,
  mode,
  monthLabel,
}: CommunityTopGamesPanelProps) {
  const [activeIndex, setActiveIndex] =
    useState(0);

  const [isPaused, setIsPaused] =
    useState(false);

  const touchStartX = useRef<
    number | null
  >(null);

  const safeItems = useMemo(
    () => items.slice(0, 5),
    [items],
  );

  useEffect(() => {
    if (
      isPaused ||
      safeItems.length <= 1
    ) {
      return;
    }

    const intervalId =
      window.setInterval(() => {
        setActiveIndex(
          (currentIndex) =>
            (currentIndex + 1) %
            safeItems.length,
        );
      }, ROTATION_INTERVAL);

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, [
    isPaused,
    safeItems.length,
  ]);

  useEffect(() => {
    if (
      activeIndex >= safeItems.length
    ) {
      setActiveIndex(0);
    }
  }, [
    activeIndex,
    safeItems.length,
  ]);

  function showPrevious() {
    if (
      safeItems.length === 0
    ) {
      return;
    }

    setActiveIndex(
      (currentIndex) =>
        (currentIndex -
          1 +
          safeItems.length) %
        safeItems.length,
    );
  }

  function showNext() {
    if (
      safeItems.length === 0
    ) {
      return;
    }

    setActiveIndex(
      (currentIndex) =>
        (currentIndex + 1) %
        safeItems.length,
    );
  }

  function handleTouchStart(
    event: React.TouchEvent,
  ) {
    touchStartX.current =
      event.touches[0]?.clientX ??
      null;
  }

  function handleTouchEnd(
    event: React.TouchEvent,
  ) {
    if (
      touchStartX.current === null
    ) {
      return;
    }

    const endX =
      event.changedTouches[0]
        ?.clientX;

    if (
      endX === undefined
    ) {
      touchStartX.current = null;
      return;
    }

    const difference =
      endX - touchStartX.current;

    touchStartX.current = null;

    if (
      Math.abs(difference) <
      SWIPE_THRESHOLD
    ) {
      return;
    }

    if (difference > 0) {
      showPrevious();
    } else {
      showNext();
    }
  }

  const activeItem =
    safeItems[activeIndex];

  if (!activeItem) {
    return (
      <section className="flex min-h-[31rem] items-center justify-center rounded-[2rem] border border-white/[0.08] bg-black/30 p-8 text-center backdrop-blur sm:min-h-[34rem] lg:min-h-[29rem]">
        <div>
          <p className="atlas-section-label">
            Atlas Top 5
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Rankings are warming up.
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Add published games and ratings
            to bring this panel to life.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      onMouseEnter={() =>
        setIsPaused(true)
      }
      onMouseLeave={() =>
        setIsPaused(false)
      }
      onFocusCapture={() =>
        setIsPaused(true)
      }
      onBlurCapture={() =>
        setIsPaused(false)
      }
      onTouchStart={
        handleTouchStart
      }
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label={
        mode === "community"
          ? `Community Top 5 Games for ${monthLabel}`
          : "Atlas Top 5 Games"
      }
      className="group relative min-h-[31rem] overflow-hidden rounded-[2rem] border border-red-500/20 bg-[#070a11]/95 shadow-[0_0_70px_rgba(239,35,60,0.14)] backdrop-blur sm:min-h-[34rem] lg:min-h-[29rem]"
    >
      {activeItem.coverImageUrl ? (
        <Image
          key={activeItem.id}
          src={
            activeItem.coverImageUrl
          }
          alt=""
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="object-cover object-center opacity-55 transition duration-700 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_30%,rgba(24,215,255,0.2),transparent_26%),radial-gradient(circle_at_35%_65%,rgba(239,35,60,0.22),transparent_35%),#080b13]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-[#05070d] via-[#05070d]/90 to-[#05070d]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-black/40" />

      <div className="relative flex min-h-[31rem] flex-col p-5 sm:min-h-[34rem] sm:p-7 lg:min-h-[29rem]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-black uppercase tracking-[0.18em] text-red-400">
              {mode === "community"
                ? `Community Top 5 · ${monthLabel}`
                : "Atlas Top 5"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {mode === "community"
                ? "Ranked by this month's verified user ratings"
                : "Editorial fallback until enough community votes arrive"}
            </p>
          </div>

          <span className="rounded-full border border-white/[0.1] bg-black/40 px-3 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-slate-300">
            {activeIndex + 1} /{" "}
            {safeItems.length}
          </span>
        </div>

        <div className="mt-auto max-w-xl pt-12 sm:pt-16 lg:max-w-md">
          <div className="flex items-end gap-4">
            <span className="text-6xl font-black leading-none tracking-[-0.08em] text-white/10 sm:text-7xl">
              #
              {activeItem.rank}
            </span>

            <div className="min-w-0 pb-1">
              <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-cyan-400">
                {activeItem.genre}
              </p>

              <h2 className="mt-2 break-words text-3xl font-black leading-[0.95] tracking-[-0.045em] sm:text-4xl">
                {activeItem.name}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric
              label={
                mode === "community"
                  ? "User rating"
                  : "Ranking"
              }
              value={
                activeItem.communityRating !==
                null
                  ? `${activeItem.communityRating.toFixed(
                      1,
                    )}/5`
                  : `#${activeItem.rank}`
              }
              accent="cyan"
            />

            <Metric
              label={
                mode === "community"
                  ? "Monthly votes"
                  : "Atlas score"
              }
              value={
                mode === "community"
                  ? activeItem.ratingCount.toString()
                  : activeItem.atlasScore !==
                      null
                    ? `${activeItem.atlasScore}`
                    : "—"
              }
            />

            <Metric
              label="Best handheld"
              value={
                activeItem.bestHandheld ??
                "Not set"
              }
              wide
            />

            <Metric
              label="Recommended"
              value={
                activeItem.recommendedTdp ??
                "Not set"
              }
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="rounded-xl border border-red-500/20 bg-[#04060a]/90 px-4 py-3 shadow-[0_0_24px_rgba(239,35,60,0.1)]">
              <p className="text-[0.5rem] font-black uppercase tracking-[0.14em] text-slate-600">
                Atlas Score
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {activeItem.atlasScore ??
                  "—"}
                <span className="ml-1 text-xs text-red-400">
                  /100
                </span>
              </p>
            </div>

            <Link
              href={`/games/${activeItem.slug}`}
              className="atlas-button-primary"
            >
              View game →
            </Link>
          </div>
        </div>

        {safeItems.length > 1 && (
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4">
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Show previous game"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30 text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-400"
            >
              ←
            </button>

            <div className="flex flex-1 items-center justify-center gap-2">
              {safeItems.map(
                (item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActiveIndex(index)
                    }
                    aria-label={`Show ${item.name}`}
                    aria-current={
                      index === activeIndex
                        ? "true"
                        : undefined
                    }
                    className={`h-1.5 rounded-full transition-all ${
                      index ===
                      activeIndex
                        ? "w-8 bg-red-500 shadow-[0_0_10px_rgba(239,35,60,0.7)]"
                        : "w-3 bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                ),
              )}
            </div>

            <button
              type="button"
              onClick={showNext}
              aria-label="Show next game"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/30 text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-400"
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  accent = "default",
  wide = false,
}: {
  label: string;
  value: string;
  accent?: "default" | "cyan";
  wide?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-3 ${
        wide
          ? "col-span-2 sm:col-span-1"
          : ""
      } ${
        accent === "cyan"
          ? "border-cyan-500/20 bg-cyan-500/[0.07]"
          : "border-white/[0.07] bg-black/30"
      }`}
    >
      <p className="text-[0.46rem] font-black uppercase tracking-[0.09em] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-xs font-black ${
          accent === "cyan"
            ? "text-cyan-300"
            : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
