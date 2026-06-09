"use client";

import { useTransition } from "react";
import { togglePresetVote } from "../app/presets/actions";

interface PresetVoteButtonProps {
  presetId: string;
  initialCount: number;
  initialHasUpvoted: boolean;
  count: number;
  hasUpvoted: boolean;
  onVoteChange: (
    presetId: string,
    count: number,
    hasUpvoted: boolean,
  ) => void;
}

export default function PresetVoteButton({
  presetId,
  initialCount,
  initialHasUpvoted,
  count,
  hasUpvoted,
  onVoteChange,
}: PresetVoteButtonProps) {
  const [isPending, startTransition] =
    useTransition();

  function handleVote() {
    const optimisticHasUpvoted =
      !hasUpvoted;

    const optimisticCount = Math.max(
      0,
      count +
        (optimisticHasUpvoted ? 1 : -1),
    );

    onVoteChange(
      presetId,
      optimisticCount,
      optimisticHasUpvoted,
    );

    startTransition(async () => {
      try {
        const result =
          await togglePresetVote(
            presetId,
          );

        onVoteChange(
          presetId,
          result.upvoteCount,
          result.hasUpvoted,
        );
      } catch (error) {
        onVoteChange(
          presetId,
          initialCount,
          initialHasUpvoted,
        );

        console.error(
          "Could not update preset vote:",
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
      className={`flex min-w-[7.25rem] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-black transition disabled:cursor-wait disabled:opacity-70 ${
        hasUpvoted
          ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_18px_rgba(24,215,255,0.1)]"
          : "border-white/[0.08] bg-black/20 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400"
      }`}
    >
      <span
        aria-hidden="true"
        className={`text-base transition ${
          hasUpvoted
            ? "translate-y-[-1px]"
            : ""
        }`}
      >
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
