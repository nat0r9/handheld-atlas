"use client";

import { useState, useTransition } from "react";
import {
  setGameRating,
  type GameRatingResult,
} from "../app/games/actions";
import { getRatingConfidenceLabel } from "../lib/game-ratings";

interface GameRatingControlProps {
  gameId: string;
  initialAverageRating: number | null;
  initialRatingCount: number;
  initialUserRating: number | null;
  initialMonthlyRatingCount?: number;
  isAuthenticated?: boolean;
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
  initialMonthlyRatingCount = 0,
  isAuthenticated = false,
  compact = false,
  onRatingChange,
}: GameRatingControlProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ratingState, setRatingState] = useState<GameRatingResult>({
    averageRating: initialAverageRating,
    ratingCount: initialRatingCount,
    userRating: initialUserRating,
    monthlyRatingCount: initialMonthlyRatingCount,
  });
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const activeRating = hoveredRating ?? ratingState.userRating ?? 0;
  const confidenceLabel = getRatingConfidenceLabel(ratingState.ratingCount);

  function submitRating(rating: number | null) {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const result = await setGameRating(gameId, rating);
        setRatingState(result);
        onRatingChange?.(gameId, result);
        setSuccessMessage(
          rating === null
            ? "Your rating was removed."
            : "Rating saved. Your monthly leaderboard vote is counted once.",
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not update the rating.",
        );
      }
    });
  }

  return (
    <div
      className={`rounded-xl border border-white/[0.08] bg-black/20 ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      <div
        className={`flex gap-1 ${compact ? "justify-center" : ""}`}
        onMouseLeave={() => setHoveredRating(null)}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;

          return (
            <button
              key={value}
              type="button"
              disabled={isPending}
              onMouseEnter={() => setHoveredRating(value)}
              onFocus={() => setHoveredRating(value)}
              onBlur={() => setHoveredRating(null)}
              onClick={() => submitRating(value)}
              aria-label={`Rate ${value} out of 5`}
              aria-pressed={ratingState.userRating === value}
              className={`text-xl leading-none transition sm:text-2xl ${
                value <= activeRating
                  ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.25)]"
                  : "text-slate-700 hover:text-yellow-300"
              } disabled:cursor-wait disabled:opacity-60`}
            >
              ★
            </button>
          );
        })}
      </div>

      <div
        className={`mt-2 ${
          compact
            ? "text-center"
            : "flex flex-wrap items-center justify-between gap-3"
        }`}
      >
        <p className="text-xs text-slate-500">
          {ratingState.averageRating !== null
            ? `${ratingState.averageRating.toFixed(1)}/5`
            : "No ratings"}{" "}
          · {ratingState.ratingCount}{" "}
          {ratingState.ratingCount === 1 ? "vote" : "votes"}
          {ratingState.ratingCount > 0 ? ` · ${confidenceLabel}` : ""}
        </p>

        {!compact && ratingState.userRating !== null && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => submitRating(null)}
            className="text-xs font-black text-slate-600 transition hover:text-red-400 disabled:opacity-50"
          >
            Remove my rating
          </button>
        )}
      </div>

      {!compact && (
        <div className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-slate-600">
          <p>
            {ratingState.userRating !== null
              ? `Your rating: ${ratingState.userRating}/5.`
              : isAuthenticated
                ? "Choose a star to rate this game."
                : "Sign in and choose a star to rate this game."}{" "}
            One live rating per account is used for the all-time score.
          </p>
          <p className="mt-1">
            The monthly Top 5 counts one rating per account, game and month.
          </p>
        </div>
      )}

      {successMessage && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-300"
        >
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
