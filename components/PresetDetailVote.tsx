"use client";

import { useState } from "react";
import PresetVoteButton from "./PresetVoteButton";

interface PresetDetailVoteProps {
  presetId: string;
  initialCount: number;
  initialHasUpvoted: boolean;
}

export default function PresetDetailVote({
  presetId,
  initialCount,
  initialHasUpvoted,
}: PresetDetailVoteProps) {
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);

  function handleVoteChange(
    _presetId: string,
    nextCount: number,
    nextHasUpvoted: boolean,
  ) {
    setCount(nextCount);
    setHasUpvoted(nextHasUpvoted);
  }

  return (
    <PresetVoteButton
      presetId={presetId}
      initialCount={initialCount}
      initialHasUpvoted={initialHasUpvoted}
      count={count}
      hasUpvoted={hasUpvoted}
      onVoteChange={handleVoteChange}
    />
  );
}