"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface HandheldSpotlightItem {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  processor: string | null;
  battery: string | null;
  imageUrl: string | null;
}

interface HandheldSpotlightProps {
  handhelds: HandheldSpotlightItem[];
}

const ROTATION_INTERVAL = 6500;
const SWIPE_THRESHOLD = 45;

export default function HandheldSpotlight({
  handhelds,
}: HandheldSpotlightProps) {
  const items = useMemo(
    () => handhelds,
    [handhelds],
  );

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [isPaused, setIsPaused] =
    useState(false);

  const touchStartX = useRef<
    number | null
  >(null);

  useEffect(() => {
    if (
      isPaused ||
      items.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setActiveIndex(
          (current) =>
            (current + 1) %
            items.length,
        );
      }, ROTATION_INTERVAL);

    return () =>
      window.clearInterval(timer);
  }, [isPaused, items.length]);

  function showPrevious() {
    if (items.length === 0) {
      return;
    }

    setActiveIndex(
      (current) =>
        (current -
          1 +
          items.length) %
        items.length,
    );
  }

  function showNext() {
    if (items.length === 0) {
      return;
    }

    setActiveIndex(
      (current) =>
        (current + 1) %
        items.length,
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

    if (endX === undefined) {
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

  const safeActiveIndex =
    items.length > 0
      ? activeIndex % items.length
      : 0;

  const activeItem =
    items[safeActiveIndex];

  if (!activeItem) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-white/[0.08] bg-black/20 p-10 text-center text-sm text-slate-500">
        No published handhelds yet.
      </div>
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
      aria-label="Featured handhelds"
      className="relative mt-4 min-h-[20rem] overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#05070d] shadow-[0_0_36px_rgba(24,215,255,0.09)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_76%,rgba(24,215,255,0.2),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(239,35,60,0.2),transparent_30%),linear-gradient(145deg,#070b13,#04060b)]" />

      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative flex min-h-[20rem] flex-col p-4 sm:p-5">
        <div className="relative flex min-h-[11rem] items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-black/25">
          {activeItem.imageUrl ? (
            <Image
              key={activeItem.id}
              src={activeItem.imageUrl}
              alt={activeItem.name}
              fill
              sizes="(max-width: 768px) 90vw, 28vw"
              className="object-contain p-4 drop-shadow-[0_18px_30px_rgba(0,0,0,0.75)] transition duration-500"
            />
          ) : (
            <div className="flex h-36 w-56 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/40 text-4xl font-black text-slate-700">
              HA
            </div>
          )}

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Show previous handheld"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.14] bg-black/55 text-lg text-slate-300 backdrop-blur transition hover:border-cyan-500/50 hover:text-cyan-300"
              >
                ←
              </button>

              <button
                type="button"
                onClick={showNext}
                aria-label="Show next handheld"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.14] bg-black/55 text-lg text-slate-300 backdrop-blur transition hover:border-red-500/50 hover:text-red-300"
              >
                →
              </button>
            </>
          )}
        </div>

        <div className="mx-auto mt-4 max-w-md text-center">
          <p className="text-[0.55rem] font-black uppercase tracking-[0.15em] text-cyan-400">
            {activeItem.manufacturer}
          </p>

          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
            {activeItem.name}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {activeItem.processor ??
              "Handheld gaming system"}
          </p>

          {activeItem.battery && (
            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-600">
              Battery ·{" "}
              {activeItem.battery}
            </p>
          )}

          <Link
            href={`/handhelds/${activeItem.slug}`}
            className="atlas-button-secondary mt-4"
          >
            View profile
          </Link>
        </div>

        {items.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {items.map(
              (item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  aria-label={`Show ${item.name}`}
                  aria-current={
                    index === safeActiveIndex
                      ? "true"
                      : undefined
                  }
                  className={`h-1.5 rounded-full transition-all ${
                    index === safeActiveIndex
                      ? "w-8 bg-cyan-400 shadow-[0_0_10px_rgba(24,215,255,0.65)]"
                      : "w-3 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
