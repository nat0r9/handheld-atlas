"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  setGameRating,
  type GameRatingResult,
} from "../app/games/actions";

interface GameRatingControlProps {
  gameId: string;
  initialAverageRating: number | null;
  initialRatingCount: number;
  initialUserRating: number | null;
  compact?: boolean;
  onRatingChange?: (
    gameId: string,
    result: GameRatingResult,
  ) => void;
}

export default function GameRatingControl({
  gameId,
  initialAverageRating,
  initialRatingCount,
  initialUserRating,
  compact = false,
  onRatingChange,
}: GameRatingControlProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    ratingState,
    setRatingState,
  ] = useState<GameRatingResult>({
    averageRating:
      initialAverageRating,
    ratingCount:
      initialRatingCount,
    userRating:
      initialUserRating,
  });

  const [hoveredRating, setHoveredRating] =
    useState<number | null>(null);

  const activeRating =
    hoveredRating ??
    ratingState.userRating ??
    0;

  function submitRating(
    rating: number | null,
  ) {
    startTransition(async () => {
      try {
        const result =
          await setGameRating(
            gameId,
            rating,
          );

        setRatingState(result);
        onRatingChange?.(
          gameId,
          result,
        );
      } catch (error) {
        console.error(
          "Could not update game rating:",
          error,
        );
      }
    });
  }

  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-black/20 ${
        compact
          ? "p-3"
          : "p-4 sm:p-5"
      }`}
    >
      <div
        className={`flex gap-1 ${
          compact
            ? "justify-center"
            : ""
        }`}
        onMouseLeave={() =>
          setHoveredRating(null)
        }
      >
        {Array.from(
          { length: 5 },
          (_, index) => {
            const value =
              index + 1;

            return (
              <button
                key={value}
                type="button"
                disabled={isPending}
                onMouseEnter={() =>
                  setHoveredRating(
                    value,
                  )
                }
                onFocus={() =>
                  setHoveredRating(
                    value,
                  )
                }
                onBlur={() =>
                  setHoveredRating(
                    null,
                  )
                }
                onClick={() =>
                  submitRating(value)
                }
                aria-label={`Rate ${value} out of 5`}
                className={`text-xl leading-none transition sm:text-2xl ${
                  value <= activeRating
                    ? "text-yellow-400"
                    : "text-slate-700 hover:text-yellow-300"
                } disabled:cursor-wait disabled:opacity-60`}
              >
                ★
              </button>
            );
          },
        )}
      </div>

      <div
        className={`mt-2 ${
          compact
            ? "text-center"
            : "flex flex-wrap items-center justify-between gap-3"
        }`}
      >
        <p className="text-xs text-slate-500">
          {ratingState.averageRating !==
          null
            ? `${ratingState.averageRating.toFixed(
                1,
              )}/5`
            : "No ratings"}{" "}
          ·{" "}
          {ratingState.ratingCount}{" "}
          {ratingState.ratingCount === 1
            ? "vote"
            : "votes"}
        </p>

        {!compact &&
          ratingState.userRating !==
            null && (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                submitRating(null)
              }
              className="text-xs font-black text-slate-600 transition hover:text-red-400 disabled:opacity-50"
            >
              Remove my rating
            </button>
          )}
      </div>

      {!compact && (
        <p className="mt-3 text-xs leading-5 text-slate-600">
          {ratingState.userRating !==
          null
            ? `Your rating: ${ratingState.userRating}/5`
            : "Sign in and choose a star to rate this game."}
        </p>
      )}
    </div>
  );
}
