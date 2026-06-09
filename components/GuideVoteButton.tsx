"use client";

import {
  useState,
  useTransition,
} from "react";
import { toggleGuideVote } from "../app/guides/actions";

interface GuideVoteButtonProps {
  guideId: string;
  initialCount: number;
  initialHasUpvoted: boolean;
  compact?: boolean;
  onVoteChange?: (
    guideId: string,
    count: number,
    hasUpvoted: boolean,
  ) => void;
}

export default function GuideVoteButton({
  guideId,
  initialCount,
  initialHasUpvoted,
  compact = false,
  onVoteChange,
}: GuideVoteButtonProps) {
  const [count, setCount] =
    useState(initialCount);

  const [
    hasUpvoted,
    setHasUpvoted,
  ] = useState(
    initialHasUpvoted,
  );

  const [
    isPending,
    startTransition,
  ] = useTransition();

  function publishState(
    nextCount: number,
    nextHasUpvoted: boolean,
  ) {
    setCount(nextCount);
    setHasUpvoted(
      nextHasUpvoted,
    );

    onVoteChange?.(
      guideId,
      nextCount,
      nextHasUpvoted,
    );
  }

  function handleVote() {
    const optimisticHasUpvoted =
      !hasUpvoted;

    const optimisticCount = Math.max(
      0,
      count +
        (optimisticHasUpvoted
          ? 1
          : -1),
    );

    publishState(
      optimisticCount,
      optimisticHasUpvoted,
    );

    startTransition(async () => {
      try {
        const result =
          await toggleGuideVote(
            guideId,
          );

        publishState(
          result.upvoteCount,
          result.hasUpvoted,
        );
      } catch (error) {
        publishState(
          initialCount,
          initialHasUpvoted,
        );

        console.error(
          "Could not update guide vote:",
          error,
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={isPending}
      aria-pressed={hasUpvoted}
      className={`flex items-center justify-center gap-2 rounded-xl border font-black transition disabled:cursor-wait disabled:opacity-70 ${
        compact
          ? "px-3 py-2 text-xs"
          : "px-4 py-3 text-sm"
      } ${
        hasUpvoted
          ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_18px_rgba(24,215,255,0.1)]"
          : "border-white/[0.08] bg-black/20 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
      }`}
    >
      <span aria-hidden="true">
        ▲
      </span>

      <span>
        {isPending
          ? "Saving"
          : hasUpvoted
            ? "Upvoted"
            : "Upvote"}
      </span>

      <span
        className={`rounded-md px-1.5 py-0.5 text-xs ${
          hasUpvoted
            ? "bg-cyan-500/15 text-cyan-200"
            : "bg-white/[0.05] text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
